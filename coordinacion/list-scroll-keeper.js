// Conserva la posición de scroll de los listados al recargarlos mientras hay un
// panel lateral abierto (o se acaba de cerrar). Al guardar desde un panel, muchas
// pestañas recargan su listado: el cuerpo de la tabla se vacía con un "Cargando…",
// la altura se hunde, el navegador recoloca el scroll arriba y al volver a pintar
// las filas el usuario pierde el sitio donde estaba. Aquí se captura la posición
// antes del vaciado y se restaura cuando las filas reaparecen.
//
// Se engancha al setter de innerHTML de los cuerpos de tabla (y de las listas cuyo
// id acaba en "-list") para cubrir todas las pestañas sin tocar cada `load*`.
(() => {
  const PANEL_SELECTOR = ".detail-panel, .side-panel";
  const RECENT_CLOSE_MS = 6000;
  const PENDING_TTL_MS = 30000;

  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (!descriptor?.set || !descriptor.configurable) return;

  const pendingByElement = new WeakMap();
  let lastPanelCloseAt = 0;

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target;
      if (
        target instanceof Element &&
        target.matches(PANEL_SELECTOR) &&
        target.classList.contains("hidden")
      ) {
        lastPanelCloseAt = Date.now();
      }
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  });

  const isTrackedList = (el) =>
    el.tagName === "TBODY" || (typeof el.id === "string" && el.id.endsWith("-list"));

  const panelActive = () =>
    Boolean(document.querySelector(".detail-panel:not(.hidden), .side-panel:not(.hidden)")) ||
    Date.now() - lastPanelCloseAt < RECENT_CLOSE_MS;

  const isScrollable = (el) => {
    const overflowY = getComputedStyle(el).overflowY;
    return (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
  };

  function captureScroll(el) {
    const scrollers = [];
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (isScrollable(node)) scrollers.push({ node, top: node.scrollTop, left: node.scrollLeft });
    }
    const root = document.scrollingElement;
    return {
      at: Date.now(),
      scrollers,
      pageTop: root ? root.scrollTop : 0,
    };
  }

  function restoreScroll(state) {
    const apply = () => {
      for (const { node, top, left } of state.scrollers) {
        if (node.isConnected) {
          node.scrollTop = top;
          node.scrollLeft = left;
        }
      }
      const root = document.scrollingElement;
      if (root && state.pageTop) root.scrollTop = state.pageTop;
    };
    apply();
    requestAnimationFrame(apply);
  }

  const hasRealRows = (el) =>
    el.children.length > 1 || (el.children.length === 1 && !el.querySelector(".empty-state"));

  Object.defineProperty(Element.prototype, "innerHTML", {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value) {
      if (!isTrackedList(this) || !this.isConnected) {
        descriptor.set.call(this, value);
        return;
      }

      let pending = pendingByElement.get(this);
      if (pending && Date.now() - pending.at > PENDING_TTL_MS) {
        pendingByElement.delete(this);
        pending = null;
      }
      // Solo se captura si hay panel abierto o recién cerrado, y solo la primera
      // vez de una secuencia (vaciado → filas): el segundo paso ya vería el scroll
      // hundido.
      if (!pending && panelActive() && hasRealRows(this)) {
        pending = captureScroll(this);
        pendingByElement.set(this, pending);
      }

      descriptor.set.call(this, value);

      if (pending && hasRealRows(this)) {
        pendingByElement.delete(this);
        restoreScroll(pending);
      }
    },
  });
})();
