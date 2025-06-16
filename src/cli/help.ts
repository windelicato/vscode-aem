import { SdkStartCommand } from "../lib/sdk/commands/start";
import { SdkStopCommand } from "../lib/sdk/commands/stop";
import { SdkStatusCommand } from "../lib/sdk/commands/status";
import { SdkLogCommand } from "../lib/sdk/commands/log";
import { SdkSetupCommand } from "../lib/sdk/commands/setup";
import { MavenCommand } from "../lib/maven/maven";
import { ScaffoldCommand } from "../lib/scaffold/scaffold";
import { generateHelp } from "../lib/utils/argParser";

const HELP_TEXT = `AEM Helper CLI

Usage:
  aem <command> [subcommand] [options]

Commands:
  sdk start         Start the AEM SDK
  sdk stop          Stop the AEM SDK
  sdk status        Show AEM SDK status
  sdk log           Show AEM SDK logs
  sdk setup         Setup the AEM SDK
  maven [module]    Run Maven install (optionally for a module)
  scaffold          Scaffold a new AEM project
  help              Show this help message

For command-specific help, use aem <command> --help.
`;

export function printHelp() {
  console.log(HELP_TEXT);
}

export function printSubcommandHelp(command: string, subcommand?: string) {
  if (command === "sdk") {
    if (subcommand === "start") {
      console.log(
        "aem sdk start [options]\n" + generateHelp(SdkStartCommand.ARGUMENTS)
      );
    } else if (subcommand === "stop") {
      console.log(
        "aem sdk stop [options]\n" + generateHelp(SdkStopCommand.ARGUMENTS)
      );
    } else if (subcommand === "status") {
      console.log(
        "aem sdk status [options]\n" + generateHelp(SdkStatusCommand.ARGUMENTS)
      );
    } else if (subcommand === "log") {
      console.log(
        "aem sdk log [options]\n" + generateHelp(SdkLogCommand.ARGUMENTS)
      );
    } else if (subcommand === "setup") {
      console.log(
        "aem sdk setup [options]\n" + generateHelp(SdkSetupCommand.ARGUMENTS)
      );
    } else {
      printHelp();
    }
  } else if (command === "maven") {
    console.log(
      "aem maven [module] [options]\n" + generateHelp(MavenCommand.ARGUMENTS)
    );
  } else if (command === "scaffold") {
    console.log(
      "aem scaffold [options]\n" + generateHelp(ScaffoldCommand.ARGUMENTS)
    );
  } else {
    printHelp();
  }
}
