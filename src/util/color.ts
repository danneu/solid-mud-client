import { getColorRgb, type Color } from "ansi-stream-parser";
import chroma from "chroma-js";

export function ensureColorVisibleOnBlack(
  color: Color,
  minLuminance = 0.3,
): Color {
  switch (color.type) {
    case "16":
      // we already map color 16 to css classes that ensure visibility
      return color;
    case "256":
    case "rgb": {
      const [r, g, b] = getColorRgb(color);
      const c = chroma(r, g, b);
      if (c.luminance() < minLuminance) {
        const brightened = c.luminance(minLuminance).rgb();
        return {
          type: "rgb",
          rgb: [
            Math.round(brightened[0]),
            Math.round(brightened[1]),
            Math.round(brightened[2]),
          ],
        };
      }
      return color;
    }
  }
}
