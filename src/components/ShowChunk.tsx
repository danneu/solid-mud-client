import { untrack, type Component } from "solid-js";
import { linkify } from "../util/linkify";
import {
  Color16,
  getColorHexCode,
  Decoration,
  type StyledText,
} from "ansi-stream-parser";
import { ensureColorVisibleOnBlack } from "../util/color";
import styles from "./ShowChunk.module.scss";

const fgStyleMap: Record<Color16, string> = {
  [Color16.black]: styles.fgBlack,
  [Color16.red]: styles.fgRed,
  [Color16.green]: styles.fgGreen,
  [Color16.yellow]: styles.fgYellow,
  [Color16.blue]: styles.fgBlue,
  [Color16.magenta]: styles.fgMagenta,
  [Color16.cyan]: styles.fgCyan,
  [Color16.white]: styles.fgWhite,
  [Color16.brightBlack]: styles.fgBrightBlack,
  [Color16.brightRed]: styles.fgBrightRed,
  [Color16.brightGreen]: styles.fgBrightGreen,
  [Color16.brightYellow]: styles.fgBrightYellow,
  [Color16.brightBlue]: styles.fgBrightBlue,
  [Color16.brightMagenta]: styles.fgBrightMagenta,
  [Color16.brightCyan]: styles.fgBrightCyan,
  [Color16.brightWhite]: styles.fgBrightWhite,
};

const bgStyleMap: Record<Color16, string | null> = {
  [Color16.black]: null,
  [Color16.red]: styles.bgRed,
  [Color16.green]: styles.bgGreen,
  [Color16.yellow]: styles.bgYellow,
  [Color16.blue]: styles.bgBlue,
  [Color16.magenta]: styles.bgMagenta,
  [Color16.cyan]: styles.bgCyan,
  [Color16.white]: styles.bgWhite,
  [Color16.brightBlack]: null,
  [Color16.brightRed]: styles.bgBrightRed,
  [Color16.brightGreen]: styles.bgBrightGreen,
  [Color16.brightYellow]: styles.bgBrightYellow,
  [Color16.brightBlue]: styles.bgBrightBlue,
  [Color16.brightMagenta]: styles.bgBrightMagenta,
  [Color16.brightCyan]: styles.bgBrightCyan,
  [Color16.brightWhite]: styles.bgBrightWhite,
};

const decorationStyleMap: Record<Decoration, string | null> = {
  [Decoration.bold]: styles.bold,
  [Decoration.italic]: styles.italic,
  [Decoration.underline]: styles.underline,
  [Decoration.strikethrough]: styles.strikethrough,
  [Decoration.dim]: styles.dim,
  [Decoration.blink]: null,
  [Decoration.reverse]: null,
  [Decoration.hidden]: null,
};

export const ShowChunk: Component<{ chunk: StyledText }> = (props) => {
  const chunk = untrack(() => props.chunk); // Explicitly non-reactive

  const style: Record<string, string> = {};
  const classes: string[] = [];

  switch (chunk.fg?.type) {
    case "16": {
      classes.push(fgStyleMap[chunk.fg.code]);
      break;
    }
    case "256":
    case "rgb":
      style.color = getColorHexCode(ensureColorVisibleOnBlack(chunk.fg));
      break;
  }

  switch (chunk.bg?.type) {
    case "16": {
      const className = bgStyleMap[chunk.bg.code];
      if (className) classes.push(className);
      break;
    }
    case "256":
    case "rgb":
      style.backgroundColor = getColorHexCode(chunk.bg);
      break;
  }

  for (const decoration of chunk.decorations ?? []) {
    const className = decorationStyleMap[decoration];
    if (className) classes.push(className);
  }

  return (
    <span
      class={classes.length > 0 ? classes.join(" ") : undefined}
      style={style}
      innerHTML={linkify(chunk.text)}
    />
  );
};
