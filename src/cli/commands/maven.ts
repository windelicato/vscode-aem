import { Command } from "commander";
import { applyArgDefinitions } from "../commanderUtils";
import { MavenCommand } from "../../lib/maven/maven";

export function registerMavenCommands(program: Command) {
  const maven = program.command("maven").description("AEM Maven commands");
  applyArgDefinitions(maven.command("install"), MavenCommand.ARGUMENTS)
    .description("Install with Maven")
    .action(async (module, options) => {
      try {
        // Merge positional and option args for input string
        const inputArgs = [];
        if (module) {
          inputArgs.push(module);
        }
        for (const [key, value] of Object.entries(options)) {
          if (typeof value === "boolean" && value) {
            inputArgs.push(`--${key}`);
          } else if (typeof value === "string") {
            inputArgs.push(`--${key} ${value}`);
          }
        }
        const input = inputArgs.join(" ");
        const cmd = new MavenCommand();
        await cmd.run(input);
      } catch (err) {
        console.error(
          "Maven install failed:",
          err instanceof Error ? err.message : err
        );
        process.exit(1);
      }
    });
}
