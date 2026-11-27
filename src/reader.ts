function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing reader element: ${selector}`);
  return found;
}

const track = element<HTMLDivElement>(".page-track");
const pages = [...document.querySelectorAll<HTMLElement>(".comic-page")];
const previous = element<HTMLButtonElement>("#previous-page");
const next = element<HTMLButtonElement>("#next-page");
const zoom = element<HTMLButtonElement>("#zoom-page");
const count = element<HTMLOutputElement>("#page-count");
const dialog = element<HTMLDialogElement>("#page-dialog");
const descriptions = [...dialog.querySelectorAll<HTMLElement>(".page-text")];
let activeIndex = 0;
let zoomed = false;

function pagePath(index: number): string {
  return `/h${"e".repeat(index + 1)}resjohnnyson/`;
}

function linkedIndex(): number {
  const fragment = pages.findIndex((page) => `#${page.id}` === location.hash);
  if (fragment >= 0) return fragment;
  return Math.max(
    0,
    pages.findIndex((_, index) => pagePath(index) === location.pathname),
  );
}

function updateControls(): void {
  count.value = `${activeIndex + 1} / ${pages.length}`;
  previous.disabled = activeIndex === 0;
  next.disabled = activeIndex === pages.length - 1;
  pages.forEach((page, index) => {
    page.inert = index !== activeIndex;
    // Have the next illustration ready before the next swipe.
    if (Math.abs(index - activeIndex) <= 1) {
      const image = page.querySelector("img");
      if (image) image.loading = "eager";
    }
  });
  descriptions.forEach((description, index) => {
    description.hidden = index !== activeIndex;
  });
  const address = `${pagePath(activeIndex)}${location.search}`;
  if (`${location.pathname}${location.search}${location.hash}` !== address) {
    history.replaceState(history.state, "", address);
  }
}

function setZoom(enabled: boolean, point?: { x: number; y: number }): void {
  const page = pages[activeIndex];
  const viewport = page?.querySelector<HTMLElement>(".page-viewport");
  const image = page?.querySelector("img");
  if (!page || !viewport || !image) return;
  const before = image.getBoundingClientRect();
  const x = point ? (point.x - before.left) / before.width : 0.5;
  const y = point ? (point.y - before.top) / before.height : 0;
  zoomed = enabled;
  track.classList.toggle("is-zoomed", enabled);
  page.classList.toggle("is-zoomed", enabled);
  const artwork = page.querySelector(".artwork");
  artwork?.setAttribute("aria-pressed", String(enabled));
  zoom.setAttribute("aria-pressed", String(enabled));
  zoom.textContent = enabled ? "Fit" : "Zoom";
  zoom.title = enabled
    ? "Fit the whole page (Escape)"
    : "Zoom the artwork in place";
  viewport.scrollTo({
    left: enabled ? x * image.clientWidth - viewport.clientWidth / 2 : 0,
    top:
      enabled && point ? y * image.clientHeight - viewport.clientHeight / 2 : 0,
    behavior: "instant",
  });
}

function showPage(index: number): void {
  if (zoomed) setZoom(false);
  activeIndex = Math.max(0, Math.min(pages.length - 1, index));
  track.scrollTo({
    left: activeIndex * track.clientWidth,
    behavior: "instant",
  });
  updateControls();
}

previous.addEventListener("click", () => showPage(activeIndex - 1));
next.addEventListener("click", () => showPage(activeIndex + 1));
zoom.addEventListener("click", () => setZoom(!zoomed));
element<HTMLButtonElement>("#read-text").addEventListener("click", () =>
  dialog.showModal(),
);

pages.forEach((page) => {
  page.querySelector(".artwork")?.addEventListener("click", (event) => {
    if (event instanceof MouseEvent) {
      setZoom(
        !zoomed,
        event.detail ? { x: event.clientX, y: event.clientY } : undefined,
      );
    }
  });
});

let scheduled = false;
track.addEventListener(
  "scroll",
  () => {
    if (scheduled || zoomed) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const index = Math.max(
        0,
        Math.min(
          pages.length - 1,
          Math.round(track.scrollLeft / track.clientWidth),
        ),
      );
      if (index !== activeIndex) {
        activeIndex = index;
        updateControls();
      }
    });
  },
  { passive: true },
);

addEventListener("keydown", (event) => {
  if (dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Escape" && zoomed) {
    setZoom(false);
  } else if (
    !zoomed &&
    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
  ) {
    event.preventDefault();
    if (event.key === "Home") showPage(0);
    else if (event.key === "End") showPage(pages.length - 1);
    else showPage(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  }
});

// Rotation and browser chrome resizing keep the current page aligned.
new ResizeObserver(() => {
  track.scrollTo({
    left: activeIndex * track.clientWidth,
    behavior: "instant",
  });
}).observe(track);
addEventListener("popstate", () => showPage(linkedIndex()));
addEventListener("hashchange", () => showPage(linkedIndex()));
showPage(linkedIndex());
