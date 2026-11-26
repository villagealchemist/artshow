const pages = [...document.querySelectorAll<HTMLElement>(".comic-page")];

function pagePath(index: number): string {
  return `/h${"e".repeat(index + 1)}resjohnnyson/issue-01/`;
}

// A shared page address opens the matching illustration even without a fragment.
const linkedPage = pages.find((page) => `#${page.id}` === location.hash);
const routeIndex = pages.findIndex(
  (_, index) => pagePath(index) === location.pathname,
);
if (linkedPage) {
  linkedPage.scrollIntoView({ behavior: "instant" });
} else if (!location.hash && routeIndex > 0) {
  pages[routeIndex]?.scrollIntoView({ behavior: "instant" });
}

let scheduled = false;
function updateAddress(): void {
  scheduled = false;
  const marker = innerHeight / 3;
  let activeIndex = 0;
  for (const [index, page] of pages.entries()) {
    if (page.getBoundingClientRect().top <= marker) activeIndex = index;
  }
  const activePage = pages[activeIndex];
  if (!activePage) return;
  const inHeader =
    activeIndex === 0 && activePage.getBoundingClientRect().top > marker;
  const next = `${pagePath(activeIndex)}${location.search}${inHeader ? "" : `#${activePage.id}`}`;
  if (`${location.pathname}${location.search}${location.hash}` !== next) {
    // Replace, so reading five pages does not fill the browser's Back history.
    history.replaceState(history.state, "", next);
  }
}

function scheduleUpdate(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateAddress);
}

addEventListener("scroll", scheduleUpdate, { passive: true });
addEventListener("resize", scheduleUpdate);
scheduleUpdate();
