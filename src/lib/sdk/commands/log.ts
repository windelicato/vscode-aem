import { SdkConfig } from "../config";
import * as fs from "fs";
import { spawn } from "child_process";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";

export const ARGUMENTS: ArgDefinitions = {
  logFileName: {
    type: ArgType.Value,
    aliases: ["logFileName", "--logFileName", "-f"],
    description: "Log file name to tail (e.g. error.log)",
    required: false,
    default: "error.log",
  },
  instance: {
    type: ArgType.Value,
    aliases: ["instance", "--instance", "-i"],
    description: "Instance name to tail log for",
    required: false,
  },
};

export async function log(config: SdkConfig, input: string = "") {
  const opts = parseArgs(input, ARGUMENTS);
  const logFileName = opts.logFileName || "error.log";
  const instances = opts.instance
    ? config.instances.filter((i) => i.name === opts.instance)
    : config.instances;
  for (const instance of instances) {
    const instanceDir = `${config.sdkHome}/${instance.name}`;
    const logDir = `${instanceDir}/crx-quickstart/logs`;
    const logFile = `${logDir}/${logFileName}`;
    if (fs.existsSync(logFile)) {
      const tail = spawn("tail", ["-F", logFile]);
      tail.stdout.on("data", (data: Buffer) => {
        process.stdout.write(`[${instance.name}] ${data.toString()}`);
      });
      tail.stderr.on("data", (data: Buffer) => {
        process.stderr.write(`[${instance.name}] ${data.toString()}`);
      });
    } else {
      console.error(`[${instance.name}] Log file not found: ${logFile}`);
    }
  }
}
