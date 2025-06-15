import { SdkConfig } from "../config";
import * as fs from "fs";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";

export const ARGUMENTS: ArgDefinitions = {
  instance: {
    type: ArgType.Value,
    aliases: ["instance", "--instance", "-i"],
    description: "Instance name to check status for",
    required: false,
  },
};

export async function status(config: SdkConfig, input: string = "") {
  const opts = parseArgs(input, ARGUMENTS);
  const instances = opts.instance
    ? config.instances.filter((i) => i.name === opts.instance)
    : config.instances;
  for (const instance of instances) {
    const instanceDir = `${config.sdkHome}/${instance.name}`;
    const pidFile = `${instanceDir}/crx-quickstart/conf/cq.pid`;
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
    console.log(`[${instance.name}] ${statusMsg}`);
  }
}
