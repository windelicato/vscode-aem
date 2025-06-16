import { SdkStartCommand } from "../../lib/sdk/commands/start";
import { SdkStopCommand } from "../../lib/sdk/commands/stop";
import { SdkStatusCommand } from "../../lib/sdk/commands/status";
import { SdkLogCommand } from "../../lib/sdk/commands/log";
import { SdkSetupCommand } from "../../lib/sdk/commands/setup";

export async function handleSdkCommand(
  subcmd: string,
  args: string[],
  config: any
) {
  if (subcmd === "start") {
    await new SdkStartCommand(config).run(args.join(" "));
  } else if (subcmd === "stop") {
    await new SdkStopCommand(config).run(args.join(" "));
  } else if (subcmd === "status") {
    await new SdkStatusCommand(config).run(args.join(" "));
  } else if (subcmd === "log") {
    await new SdkLogCommand(config).run(args.join(" "));
  } else if (subcmd === "setup") {
    await new SdkSetupCommand(config).run(args.join(" "));
  } else {
    throw new Error("Unknown sdk subcommand: " + subcmd);
  }
}
