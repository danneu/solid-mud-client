import { batch, createSignal } from "solid-js";

export function useCommandHistory() {
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [tempDraft, setTempDraft] = createSignal("");

  const navigateHistory = (
    direction: "up" | "down",
    currentDraft: string,
    history: string[],
  ) => {
    const currentIndex = historyIndex();

    if (direction === "up") {
      // Save current draft when starting to navigate
      if (currentIndex === -1 && currentDraft) {
        setTempDraft(currentDraft);
      }

      const newIndex = Math.min(currentIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);

      return newIndex === -1 ? tempDraft() : history[newIndex];
    } else {
      // Navigate down
      const newIndex = Math.max(currentIndex - 1, -1);
      setHistoryIndex(newIndex);

      return newIndex === -1 ? tempDraft() : history[newIndex];
    }
  };

  const resetHistory = () => {
    batch(() => {
      setHistoryIndex(-1);
      setTempDraft("");
    });
  };

  return {
    navigateHistory,
    resetHistory,
    historyIndex,
  };
}
