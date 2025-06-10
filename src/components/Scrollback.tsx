// Scrollback.tsx is a container that holds many lines.
import {
  type Component,
  Index,
  createMemo,
  type Accessor,
  For,
  createEffect,
  on,
  createSignal,
} from "solid-js";
import { ShowChunk } from "./ShowChunk";
import { type Server } from "../model/types";
import { toArray as ringToArray } from "../util/RingBuffer";
import { scrollToBottom } from "../util/scrollToBottom";
import styles from "./Scrollback.module.scss";

export interface ScrollbackProps {
  server: Server;
  visible: boolean;
  ref?: (el: HTMLDivElement) => void;
  onScroll?: () => void;
}

export const Scrollback: Component<ScrollbackProps> = (props) => {
  // Auto-scroll behavior will be handled by parent component
  let scrollContainer: HTMLDivElement | undefined;

  // Track whether to show mini pane
  const [showMiniPane, setShowMiniPane] = createSignal(false);

  // Check if user is at bottom of scroll (with small tolerance for rounding)
  const checkIfAtBottom = (el: HTMLDivElement) => {
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom <= 1; // 1px tolerance for rounding errors
  };

  // TODO: Regexp trie
  const lineIncludeRegex: Accessor<RegExp | null> = createMemo(() => {
    // console.log("[Scrollback] createMemo lineIncludeRegex");
    const pattern = props.server.lineFiltersInclude
      .filter((s) => s.trim())
      .join("|");
    if (pattern.length === 0) return null;
    // console.log("[Scrollback] lineIncludeRegex", JSON.stringify(pattern));
    try {
      return new RegExp(pattern);
    } catch (e) {
      console.error("Bad regex", pattern, e);
      return null;
    }
  });

  const lineExcludeRegex: Accessor<RegExp | null> = createMemo(() => {
    // console.log("[Scrollback] createMemo lineExcludeRegex");
    const pattern = props.server.lineFiltersExclude
      .filter((s) => s.trim())
      .join("|");
    if (pattern.length === 0) return null;
    // console.log("[Scrollback] lineExcludeRegex", JSON.stringify(pattern));
    try {
      return new RegExp(pattern);
    } catch (e) {
      console.error("Bad regex", pattern, e);
      return null;
    }
  });

  const filteredLines = createMemo(() => {
    // console.log("[Scrollback] createMemo filteredLines");

    const filterMode = props.server.filterMode;

    const lines = ringToArray(props.server.lines);

    if (filterMode === "off") {
      return lines;
    }

    return lines.filter((line) => {
      const text = line.chunks
        .reduce((acc, chunk) => acc + chunk.text, "")
        // trim is important so that it's easier to use ^ and $ in regex filters
        .trim();

      switch (filterMode) {
        case "include": {
          const includeRegex = lineIncludeRegex();
          if (includeRegex && !includeRegex.test(text)) return false;
          break;
        }
        case "exclude": {
          const excludeRegex = lineExcludeRegex();
          if (excludeRegex && excludeRegex.test(text)) return false;
          break;
        }
        default: {
          const _: never = filterMode;
          throw new Error(`Unknown filter mode: ${_}`);
        }
      }

      return true;
    });
  });

  // Scroll to bottom when filters change
  createEffect(
    on(
      [
        () => props.server.filterMode,
        () => lineIncludeRegex(),
        () => lineExcludeRegex(),
      ],
      () => {
        console.log(
          "filters changed. should be scrolling to bottom...",
          props.server.lineFiltersInclude,
          props.server.lineFiltersExclude,
        );
        if (props.visible) {
          scrollToBottom(scrollContainer!, "always");
        }
      },
    ),
  );

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollContainer) return;

    const isAtBottom = checkIfAtBottom(scrollContainer);
    setShowMiniPane(!isAtBottom);

    // Call parent's onScroll if provided
    props.onScroll?.();
  };

  // Get the last N lines for mini pane
  const getRecentLines = () => {
    const allLines = filteredLines();
    const linesToShow = 20;
    return allLines.slice(-linesToShow);
  };

  // Untested
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    let startY = touch.clientY;

    const handleTouchMove = (e: TouchEvent) => {
      if (scrollContainer) {
        const touch = e.touches[0];
        const deltaY = startY - touch.clientY;
        scrollContainer.scrollTop += deltaY;
        startY = touch.clientY;
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <div class={styles.scrollbackWrapper}>
      <div
        class={`${styles.log} ${styles.logViewport}`}
        ref={(el) => {
          scrollContainer = el;
          props.ref?.(el);
        }}
        onScroll={handleScroll}
      >
        <For each={filteredLines()}>
          {(line) => (
            <div class={styles.line}>
              <Index each={line.chunks}>
                {(chunk) => <ShowChunk chunk={chunk()} />}
              </Index>
            </div>
          )}
        </For>
      </div>

      <div
        class={`${styles.miniPane}`}
        style={{
          // mini pane is always mounted, just hidden
          display: showMiniPane() ? "block" : "none",
        }}
        onWheel={(e) => {
          // Forward scroll events to the main log
          if (scrollContainer) {
            scrollContainer.scrollTop += e.deltaY;
            e.preventDefault();
          }
        }}
        onTouchStart={handleTouchStart}
      >
        <div class={`${styles.log} ${styles.miniPaneInner}`}>
          <For each={getRecentLines()}>
            {(line) => (
              <div class={styles.line}>
                <Index each={line.chunks}>
                  {(chunk) => <ShowChunk chunk={chunk()} />}
                </Index>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
