export function getDistanceFromBottom(el: HTMLDivElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

export const scrollToBottom = (
  el: HTMLElement,
  mode: "auto" | "always" = "auto",
) => {
  if (!el) return;

  if (mode === "auto") {
    // Check if user is near bottom before scrolling
    const buffer = 100;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom <= buffer;

    if (!isNearBottom) return;
  }

  // Perform the scroll (mode === 'always' skips the check above)
  setTimeout(() => {
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "instant",
      });
    }
  }, 0);
};
