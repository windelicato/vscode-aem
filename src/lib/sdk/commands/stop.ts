import { Command } from "../../base/command";
import { SdkConfig } from "../config";
import * as fs from "fs";
import { spawnSync, execSync } from "child_process";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";
import * as path from "path";
import * as os from "os";

export class SdkStopCommand extends Command<
  typeof SdkStopCommand.ARGUMENTS,
  (instance: string, msg: string, done?: boolean) => void
> {
  static readonly ARGUMENTS: ArgDefinitions = {
    instance: {
      type: ArgType.Value,
      aliases: ["instance", "--instance", "-i"],
      description: "Instance name to stop",
      required: false,
    },
  };

  readonly name = "sdk-stop";
  readonly description = "Stop AEM SDK instances.";
  readonly arguments = SdkStopCommand.ARGUMENTS;

  async create(input: string) {
    // Not a shell command, so just return info for the first instance
    return { cwd: process.cwd(), command: "start" };
  }

  async run(
    input: string,
    cwd?: string,
    onProgress?: (instance: string, msg: string, done?: boolean) => void
  ): Promise<void> {
    const opts = parseArgs(input, this.arguments);
    const config = this.config.sdk;
    const instances = opts.instance
      ? config.instances.filter((i) => i.name === opts.instance)
      : config.instances;
    const shutdownPromises: Promise<void>[] = [];
    for (const instance of instances) {
      const instanceDir = path.join(config.sdkHome, instance.name);
      const quickstartBin = path.join(instanceDir, "crx-quickstart", "bin");
      const stopScript = path.join(
        quickstartBin,
        os.platform() === "win32" ? "stop.bat" : "stop"
      );
      const pidFile = path.join(
        instanceDir,
        "crx-quickstart",
        "conf",
        "cq.pid"
      );
      const isWin = os.platform() === "win32";
      const scriptExists = fs.existsSync(stopScript);
      const isExecutable =
        scriptExists && (!isWin ? fs.statSync(stopScript).mode & 0o111 : true);
      if (scriptExists && isExecutable) {
        const result = spawnSync(
          isWin ? "cmd.exe" : os.platform() === "darwin" ? "sh" : "./stop",
          isWin
            ? ["/c", "stop.bat"]
            : os.platform() === "darwin"
            ? [stopScript]
            : [],
          {
            cwd: quickstartBin,
            stdio: "inherit",
            shell: isWin,
          }
        );
        if (result.error) {
          const msg = `[${instance.name}] Error running stop script: ${result.error.message}`;
          if (onProgress) {
            onProgress(instance.name, msg, true);
          } else {
            console.error(msg);
          }
          continue;
        } else {
          const msg = `[${instance.name}] Stop script executed. Checking for running java process...`;
          if (onProgress) {
            onProgress(instance.name, msg);
          } else {
            console.log(msg);
          }
        }
        if (fs.existsSync(pidFile)) {
          const pid = fs.readFileSync(pidFile, "utf8").trim();
          shutdownPromises.push(
            new Promise((resolve) => {
              let done = false;
              const checkInterval = setInterval(() => {
                if (done) {
                  return;
                }
                let running = false;
                try {
                  if (isWin) {
                    const output = execSync(
                      `tasklist /FI "PID eq ${pid}" /FO LIST`
                    ).toString();
                    running = output.includes("java.exe");
                  } else {
                    const output = execSync(`ps -p ${pid} -o comm=`).toString();
                    running = output.includes("java");
                  }
                } catch {
                  running = false;
                }
                if (running) {
                  if (onProgress) {
                    onProgress(
                      instance.name,
                      `Waiting for java process PID ${pid} to exit...`
                    );
                  }
                } else {
                  if (onProgress) {
                    onProgress(
                      instance.name,
                      `Java process PID ${pid} has stopped.`,
                      true
                    );
                  } else {
                    console.log(
                      `[${instance.name}] Java process PID ${pid} has stopped.`
                    );
                  }
                  clearInterval(checkInterval);
                  done = true;
                  resolve();
                }
              }, 2000);
            })
          );
        } else {
          const msg = `[${instance.name}] PID file not found, cannot check java process.`;
          if (onProgress) {
            onProgress(instance.name, msg, true);
          } else {
            console.log(msg);
          }
        }
      } else {
        const msg = `[${instance.name}] Stop script not found or not executable: ${stopScript}`;
        if (onProgress) {
          onProgress(instance.name, msg, true);
        } else {
          console.log(msg);
        }
      }
    }
    if (shutdownPromises.length > 0) {
      await Promise.all(shutdownPromises);
    }
  }
}
