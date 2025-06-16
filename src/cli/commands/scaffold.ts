import { Command } from "commander";
import { applyArgDefinitions } from "../commanderUtils";
import { ScaffoldCommand } from "../../lib/scaffold/scaffold";

export function registerScaffoldCommand(program: Command) {
  applyArgDefinitions(
    program
      .command("scaffold")
      .description("Scaffold a new AEM project using Maven archetype."),
    ScaffoldCommand.ARGUMENTS
  ).action((options) => {
    console.log("AEM Scaffold", options);
    // TODO: Wire up to ScaffoldCommand logic
  });
}
