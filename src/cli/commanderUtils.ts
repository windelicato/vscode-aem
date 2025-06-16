import { Command as CommanderCommand } from "commander";
import { ArgDefinitions, ArgType } from "../lib/utils/argParser";

/**
 * Adds options and arguments to a commander command based on ArgDefinitions.
 * @param cmd - The commander command instance
 * @param argDefs - The ArgDefinitions static property from a lib command class
 */
export function applyArgDefinitions(
  cmd: CommanderCommand,
  argDefs: ArgDefinitions
) {
  // First, add options
  Object.entries(argDefs).forEach(([key, def]) => {
    if (def.type === ArgType.Flag) {
      // Boolean flag
      const flags =
        def.aliases
          ?.filter((a) => a.startsWith("--") || a.startsWith("-"))
          ?.join(", ") || `--${key}`;
      cmd.option(flags, def.description, def.default);
    } else if (def.type === ArgType.Value) {
      // Option with value
      const flags =
        def.aliases
          ?.filter((a) => a.startsWith("--") || a.startsWith("-"))
          ?.join(", ") || `--${key} <value>`;
      cmd.option(flags + " <value>", def.description, def.default);
    } else if (def.type === ArgType.Positional) {
      // Positional argument (make optional)
      cmd.argument(`[${key}]`, def.description);
    }
  });
  return cmd;
}
