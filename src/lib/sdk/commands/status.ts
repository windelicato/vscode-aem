import { Command } from "../../base/command";
import * as fs from "fs";
import * as path from "path";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";

export class SdkStatusCommand extends Command<
  typeof SdkStatusCommand.ARGUMENTS,
  (instance: string, status: string) => void
> {
  static readonly ARGUMENTS: ArgDefinitions = {
    instance: {
      type: ArgType.Value,
      aliases: ["instance", "--instance", "-i"],
      description: "Instance name to check status for",
      required: false,
    },
  };

  readonly name = "sdk-status";
  readonly description = "Check the status of AEM SDK instances.";
  readonly arguments = SdkStatusCommand.ARGUMENTS;

  async create(input: string) {
    // Not a shell command, so just return info for the first instance
    return { cwd: process.cwd(), command: "start" };
  }

  async run(
    input: string,
    cwd?: string,
    onData?: (instance: string, status: string) => void
  ): Promise<void> {
    const opts = parseArgs(input, this.arguments);
    const config = this.config.sdk;
    const instances = opts.instance
      ? config.instances.filter((i) => i.name === opts.instance)
      : config.instances;
    for (const instance of instances) {
      const instanceDir = path.join(config.home, instance.name);
      const pidFile = path.join(
        instanceDir,
        "crx-quickstart",
        "conf",
        "cq.pid"
      );
      let statusMsg = "";
      if (fs.existsSync(pidFile)) {
        const pid = fs.readFileSync(pidFile, "utf8").trim();
        if (pid && pid.length > 0) {
          try {
            process.kill(Number(pid), 0);
            statusMsg = `RUNNING (PID ${pid})`;
          } catch {
            statusMsg = "STOPPED (PID file present, but process not running)";
          }
        } else {
          statusMsg = "STOPPED (PID file present, but empty)";
        }
      } else {
        statusMsg = "STOPPED (no PID file)";
      }
      if (onData) {
        onData(instance.name, statusMsg);
      } else {
        console.log(`[${instance.name}] ${statusMsg}`);
      }
    }
  }
}
