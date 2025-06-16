import { SdkStartCommand } from "../lib/sdk/commands/start";
import { SdkStopCommand } from "../lib/sdk/commands/stop";
import { SdkStatusCommand } from "../lib/sdk/commands/status";
import { SdkLogCommand } from "../lib/sdk/commands/log";
import { SdkSetupCommand } from "../lib/sdk/commands/setup";
import { MavenCommand } from "../lib/maven/maven";
import { ScaffoldCommand } from "../lib/scaffold/scaffold";
import { generateHelp } from "../lib/utils/argParser";

const HELP_TEXT = `AEM Helper CLI

USAGE
  aem <command> [subcommand] [options]

COMMANDS
  sdk start         Start the AEM SDK
  sdk stop          Stop the AEM SDK
  sdk status        Show AEM SDK status
  sdk log           Show AEM SDK logs
  sdk setup         Setup the AEM SDK
  maven [module]    Run Maven install (optionally for a module)
  scaffold          Scaffold a new AEM project
  config init [path]      Generate a default config file at [path] (default: .aemrc.json)
  config show             Show the fully resolved config
  config path             Show the config file path currently in use
  config validate [path]  Validate the config file at [path] (default: .aemrc.json)
  config env              Show environment variable overrides for config
  config env-list         List all available config environment variables
  help                    Show this help message

For command-specific help, use aem <command> --help.

CONFIGURATION
  - By default, configuration is loaded from .aemrc.json in the current directory.
  - You can set the AEM_CONFIG_PATH environment variable to use a custom config file path.
  - Any config value can be overridden by setting its documented environment variable.
  - Run 'aem config env-list' to see all available environment variable overrides.
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
  } else if (command === "config") {
    console.log(
      `aem config init [path]
  Generate a default config file at [path] (default: .aemrc.json).

aem config show
  Show the fully resolved config (including env overrides and defaults).

aem config path
  Show the config file path currently in use.

aem config validate [path]
  Validate the config file at [path] (default: .aemrc.json) and report missing/invalid fields.

aem config env
  Show environment variable overrides currently set for config fields.

aem config env-list
  List all available config environment variables and their descriptions.
`
    );
  } else {
    printHelp();
  }
}
