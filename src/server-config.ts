import type { ServerConfig } from "./model/types";
import yaml, { YAMLException } from "js-yaml";
import { z } from "zod/v4-mini";
import { AliasMatcher } from "./alias";

const ServerConfigSchema = z.object({
  aliases: z.record(z.string(), z.string()),
});

export type ServerConfigError =
  | { type: "invalid_yaml"; error: YAMLException }
  | {
      type: "invalid_schema";
      error: ReturnType<typeof ServerConfigSchema.safeParse>["error"];
    }
  | { type: "invalid_aliases"; error: string };

export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

export function serverConfigErrorToString(error: ServerConfigError): string {
  switch (error.type) {
    case "invalid_yaml":
      return `Invalid YAML: ${error.error.message}`;
    case "invalid_schema":
      console.log(error.error);
      return `Invalid schema: ${error.error?.issues[0].message}`;
    case "invalid_aliases":
      return `Invalid aliases: ${error.error}`;
    default: {
      const _exhaustiveCheck: never = error;
      return `Unknown error: ${JSON.stringify(_exhaustiveCheck)}`;
    }
  }
}

// This one throws
export function parseServerConfig(markup: string): ServerConfig {
  const result = parseServerConfigSafe(markup);
  if (!result.success) {
    throw new Error(serverConfigErrorToString(result.error));
  }
  return result.value;
}

export function parseServerConfigSafe(
  markup: string,
): Result<ServerConfig, ServerConfigError> {
  // Parse yaml
  let parsed: unknown;
  try {
    parsed = yaml.load(markup);
  } catch (e) {
    if (e instanceof YAMLException) {
      return { success: false, error: { type: "invalid_yaml", error: e } };
    }
    throw e;
  }

  // Validate schema
  const result = ServerConfigSchema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      error: { type: "invalid_schema", error: result.error },
    };
  }

  // Parse aliases
  const alias = AliasMatcher.compileSafe(result.data.aliases);
  if (!alias.success) {
    return {
      success: false,
      error: { type: "invalid_aliases", error: alias.errors[0].message },
    };
  }

  return {
    success: true,
    value: {
      markup,
      aliases: result.data.aliases,
    },
  };
}
