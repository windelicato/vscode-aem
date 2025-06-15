import { SdkConfig } from "../config";
import * as fs from "fs";
import { spawn } from "child_process";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";
import * as path from "path";
import * as os from "os";

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

export async function runCommand(
  config: SdkConfig,
  input: string = "",
  onData?: (instance: string, data: string, isError?: boolean) => void
) {
  const opts = parseArgs(input, ARGUMENTS);
  const logFileName = opts.logFileName || "error.log";
  const instances = opts.instance
    ? config.instances.filter((i) => i.name === opts.instance)
    : config.instances;
  for (const instance of instances) {
    const instanceDir = path.join(config.sdkHome, instance.name);
    const logDir = path.join(instanceDir, "crx-quickstart", "logs");
    const logFile = path.join(logDir, logFileName);
    if (fs.existsSync(logFile)) {
      let tailCmd: string, tailArgs: string[];
      if (os.platform() === "win32") {
        tailCmd = "powershell";
        tailArgs = [
          "-NoProfile",
          "-NoLogo",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          `Get-Content -Path '${logFile}' -Wait -Tail 10`,
        ];
      } else {
        tailCmd = "tail";
        tailArgs = ["-F", logFile];
      }
      const tail = spawn(tailCmd, tailArgs, {
        shell: os.platform() === "win32",
      });
      tail.stdout.on("data", (data: Buffer) => {
        if (onData) {
          onData(instance.name, data.toString(), false);
        } else {
          process.stdout.write(`[${instance.name}] ${data.toString()}`);
        }
      });
      tail.stderr.on("data", (data: Buffer) => {
        if (onData) {
          onData(instance.name, data.toString(), true);
        } else {
          process.stderr.write(`[${instance.name}] ${data.toString()}`);
        }
      });
    } else {
      const msg = `[${instance.name}] Log file not found: ${logFile}`;
      if (onData) {
        onData(instance.name, msg, true);
      } else {
        console.error(msg);
      }
    }
  }
}
