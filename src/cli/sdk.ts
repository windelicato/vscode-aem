// Handles 'aem sdk' commands
import { SdkSetupCommand } from "../lib/sdk/commands/setup";
import { SdkStartCommand } from "../lib/sdk/commands/start";
import { SdkStopCommand } from "../lib/sdk/commands/stop";
import { SdkStatusCommand } from "../lib/sdk/commands/status";
import { SdkLogCommand } from "../lib/sdk/commands/log";

const commands = {
  setup: new SdkSetupCommand(),
  start: new SdkStartCommand(),
  stop: new SdkStopCommand(),
  status: new SdkStatusCommand(),
  log: new SdkLogCommand(),
};

export async function handleSdkCommand(args: string[]) {
  const [subcommand, ...rest] = args;

  if (
    subcommand === "help" ||
    subcommand === "--help" ||
    subcommand === undefined
  ) {
    console.log("aem sdk <subcommand> [args]\n");
    Object.entries(commands).forEach(([name, cmd]) => {
      console.log(`${name}:`);
      cmd.showHelp();
      console.log();
    });
    return;
  }

  const command = commands[subcommand as keyof typeof commands];
  if (!command) {
    console.error("Unknown sdk subcommand");
    process.exit(1);
  }

  await command.run(rest.join(" "));
}
