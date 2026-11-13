/* Navegación por teclado en las listas de sugerencias de personal (toda la web).
 *
 * Las listas `.filter-suggestions` las pintan varios códigos distintos (selector general,
 * Concilia, Formación, Control personal). En vez de tocar cada uno, este módulo escucha a
 * nivel de documento y da a todas el mismo comportamiento:
 *   - al escribir, la primera coincidencia queda resaltada;
 *   - ↓ / ↑ mueven el resaltado (dan la vuelta al llegar al final);
 *   - Enter elige la resaltada; Escape cierra la lista sin cerrar el panel.
 * Elegir = disparar pointerdown + click sobre la opción, que es lo que ya escucha cada código.
 * El asistente de carga de Programación tiene su propio combo (data-pc-combo) y se excluye.
 */
(function () {
  const OPTION = ".filter-suggestion-option";
  const ACTIVE = "is-active";

  function isTextInput(el) {
    return (
      el instanceof HTMLInputElement &&
      (!el.type || el.type === "text" || el.type === "search") &&
      !el.dataset.pcCombo &&
      !el.readOnly &&
      !el.disabled
    );
  }

  // Lista de sugerencias de un input: la primera `.filter-suggestions` del ancestro más
  // cercano que contenga alguna (se prefiere una visible).
  function findList(input) {
    let node = input.parentElement;
    for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
      const lists = [...node.querySelectorAll(".filter-suggestions")].filter((list) => !list.closest("dialog#programming-carga-dialog"));
      if (lists.length) return lists.find((list) => !list.classList.contains("hidden")) || lists[0];
    }
    return null;
  }

  const isOpen = (list) => list && !list.classList.contains("hidden") && list.querySelector(OPTION);

  function setActive(list, index) {
    const options = [...list.querySelectorAll(OPTION)];
    if (!options.length) return;
    const next = (index + options.length) % options.length;
    options.forEach((option, i) => {
      option.classList.toggle(ACTIVE, i === next);
      option.setAttribute("aria-selected", i === next ? "true" : "false");
    });
    options[next].scrollIntoView({ block: "nearest" });
  }

  const activeIndex = (list) => [...list.querySelectorAll(OPTION)].findIndex((o) => o.classList.contains(ACTIVE));

  function choose(option) {
    const init = { bubbles: true, cancelable: true, view: window };
    option.dispatchEvent(new PointerEvent("pointerdown", init));
    option.dispatchEvent(new MouseEvent("click", init));
  }

  document.addEventListener(
    "keydown",
    (event) => {
      const input = event.target;
      if (!isTextInput(input)) return;
      const list = findList(input);
      if (!isOpen(list)) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const current = activeIndex(list);
        setActive(list, current < 0 ? (event.key === "ArrowDown" ? 0 : -1) : current + (event.key === "ArrowDown" ? 1 : -1));
      } else if (event.key === "Enter") {
        const option = list.querySelector(`${OPTION}.${ACTIVE}`);
        if (!option) return; // sin resaltar: Enter conserva su comportamiento de siempre
        event.preventDefault();
        event.stopPropagation();
        choose(option);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        list.classList.add("hidden");
      }
    },
    true
  );

  // Al escribir, las listas se repintan (pierden el resaltado): se marca la primera coincidencia.
  document.addEventListener("input", (event) => {
    const input = event.target;
    if (!isTextInput(input) || !input.value.trim()) return;
    window.setTimeout(() => {
      const list = findList(input);
      if (isOpen(list)) setActive(list, 0);
    }, 40);
  });
})();
