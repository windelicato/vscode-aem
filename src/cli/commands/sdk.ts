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
  // Helper to get instance names from config
  function getInstanceNames(): string[] {
    if (config?.sdk?.instances) {
      return config.sdk.instances.map((i: any) => i.name);
    }
    return [];
  }

  if (subcmd === "start" || subcmd === "stop" || subcmd === "setup") {
    const instanceNames = getInstanceNames();
    const update = (name: string, _msg: string) => {
      process.stdout.write(".");
    };
    if (subcmd === "start") {
      await new SdkStartCommand(config).run(args.join(" "), undefined, update);
      process.stdout.write("\n");
    } else if (subcmd === "stop") {
      await new SdkStopCommand(config).run(args.join(" "), undefined, update);
      process.stdout.write("\n");
    } else if (subcmd === "setup") {
      if (instanceNames.length === 0) {
        await new SdkSetupCommand(config).run(
          args.join(" "),
          undefined,
          (_msg: string) => process.stdout.write(".")
        );
        process.stdout.write("\n");
      } else {
        await new SdkSetupCommand(config).run(
          args.join(" "),
          undefined,
          (_msg: string) => process.stdout.write(".")
        );
        process.stdout.write("\n");
      }
    }
  } else if (subcmd === "status") {
    await new SdkStatusCommand(config).run(args.join(" "));
  } else if (subcmd === "log") {
    await new SdkLogCommand(config).run(args.join(" "));
  } else {
    throw new Error("Unknown sdk subcommand: " + subcmd);
  }
}
