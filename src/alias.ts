export interface AliasMatch {
  output: string[];
  params: string[];
  pattern: string;
}

export type AliasError = {
  type: "invalid_pattern";
  pattern: string;
  message: string;
};

export type AliasCompileResult =
  | { success: true; alias: AliasMatcher }
  | { success: false; errors: AliasError[] };

export class AliasMatcher {
  private patterns: Array<{
    regex: RegExp;
    template: string;
    paramCount: number;
    original: string;
  }> = [];

  static compile(aliases: Record<string, string>): AliasMatcher {
    const result = AliasMatcher.compileSafe(aliases);
    if (!result.success) {
      throw new Error(result.errors[0].message);
    }
    return result.alias;
  }

  static compileSafe(aliases: Record<string, string>): AliasCompileResult {
    const instance = new AliasMatcher();
    const errors: AliasError[] = [];

    // Validate and process each pattern
    for (const pattern of Object.keys(aliases)) {
      // Check if pattern starts with at least one non-wildcard character
      const trimmedPattern = pattern.trim();

      if (trimmedPattern.length === 0) {
        errors.push({
          type: "invalid_pattern",
          pattern,
          message: "Pattern cannot be empty",
        });
        continue;
      }

      if (trimmedPattern.startsWith("*")) {
        errors.push({
          type: "invalid_pattern",
          pattern,
          message:
            "Pattern must start with at least one character (not a wildcard)",
        });
        continue;
      }

      // Additional validation: check if first token is just "*"
      const firstToken = trimmedPattern.split(/\s+/)[0];
      if (firstToken === "*") {
        errors.push({
          type: "invalid_pattern",
          pattern,
          message:
            "Pattern must start with at least one character (not a wildcard)",
        });
        continue;
      }
    }

    // If there are errors, return early
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Sort patterns by specificity
    const sortedEntries = Object.entries(aliases).sort((a, b) => {
      const aStars = (a[0].match(/\*/g) || []).length;
      const bStars = (b[0].match(/\*/g) || []).length;
      if (aStars !== bStars) return aStars - bStars;
      return b[0].length - a[0].length;
    });

    // Build regex patterns
    for (const [pattern, template] of sortedEntries) {
      const parts = pattern.trim().split(/\s+/);
      const regexParts = parts.map((part) => {
        if (part === "*") {
          return "(.+?)";
        } else if (part.includes("*")) {
          return part.replace(/\*/g, "(.+?)");
        } else {
          return part.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        }
      });

      const regexPattern = `^${regexParts.join("\\s+")}$`;
      const paramCount = (pattern.match(/\*/g) || []).length;

      instance.patterns.push({
        regex: new RegExp(regexPattern),
        template: template.trim(),
        paramCount,
        original: pattern,
      });
    }

    return { success: true, alias: instance };
  }

  match(input: string): AliasMatch | null {
    const trimmedInput = input.trim();

    for (const { regex, template, original } of this.patterns) {
      const match = trimmedInput.match(regex);

      if (match) {
        const params = match.slice(1);

        let output = template;
        for (let i = 0; i < params.length; i++) {
          output = output.replace(new RegExp(`\\$${i + 1}`, "g"), params[i]);
        }

        // Normalize newlines: replace \r\n and \r with \n
        output = output.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // Split on newlines, trim each line, filter out empty lines
        const lines = output
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        return {
          output: lines,
          params,
          pattern: original,
        };
      }
    }

    return null;
  }

  listPatterns(): string[] {
    return this.patterns.map((p) => p.original);
  }
}
