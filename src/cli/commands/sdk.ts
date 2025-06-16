import { Command } from "commander";
import { applyArgDefinitions } from "../commanderUtils";
import { SdkStartCommand } from "../../lib/sdk/commands/start";
import { SdkStopCommand } from "../../lib/sdk/commands/stop";
import { SdkStatusCommand } from "../../lib/sdk/commands/status";
import { SdkLogCommand } from "../../lib/sdk/commands/log";
import { SdkSetupCommand } from "../../lib/sdk/commands/setup";

export function registerSdkCommands(program: Command) {
  const sdk = program.command("sdk").description("AEM SDK commands");
  applyArgDefinitions(
    sdk.command("start").description("Start the AEM SDK instance(s)"),
    SdkStartCommand.ARGUMENTS
  ).action((options) => {
    console.log("AEM SDK start", options);
    // TODO: Wire up to SdkStartCommand logic
  });
  applyArgDefinitions(
    sdk.command("stop").description("Stop the AEM SDK instance(s)"),
    SdkStopCommand.ARGUMENTS
  ).action((options) => {
    console.log("AEM SDK stop", options);
    // TODO: Wire up to SdkStopCommand logic
  });
  applyArgDefinitions(
    sdk
      .command("status")
      .description("Check the status of AEM SDK instance(s)"),
    SdkStatusCommand.ARGUMENTS
  ).action((options) => {
    console.log("AEM SDK status", options);
    // TODO: Wire up to SdkStatusCommand logic
  });
  applyArgDefinitions(
    sdk
      .command("log")
      .description("Tail AEM SDK log files for one or more instances."),
    SdkLogCommand.ARGUMENTS
  ).action((options) => {
    console.log("AEM SDK log", options);
    // TODO: Wire up to SdkLogCommand logic
  });
  applyArgDefinitions(
    sdk
      .command("setup")
      .description("Setup AEM SDK quickstart and forms add-on"),
    SdkSetupCommand.ARGUMENTS
  ).action((options) => {
    console.log("AEM SDK setup", options);
    // TODO: Wire up to SdkSetupCommand logic
  });
}
