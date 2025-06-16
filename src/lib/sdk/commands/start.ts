import { Command } from "../../base/command";
import { SdkConfig } from "../config";
import * as fs from "fs";
import { spawn } from "child_process";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";
import * as path from "path";
import * as os from "os";

export class SdkStartCommand extends Command<
  typeof SdkStartCommand.ARGUMENTS,
  (instance: string, msg: string, done?: boolean) => void
> {
  static readonly ARGUMENTS: ArgDefinitions = {
    instance: {
      type: ArgType.Value,
      aliases: ["instance", "--instance", "-i"],
      description: "Instance name to start (author, publish, etc)",
      required: false,
    },
    debug: {
      type: ArgType.Flag,
      aliases: ["debug", "--debug"],
      description: "Start in debug mode",
      required: false,
    },
  };

  readonly name = "sdk-start";
  readonly description = "Start AEM SDK instances.";
  readonly arguments = SdkStartCommand.ARGUMENTS;

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
    const startupPromises: Promise<void>[] = [];
    for (const instance of instances) {
      const instanceDir = path.join(config.home, instance.name);
      const quickstartBin = path.join(instanceDir, "crx-quickstart", "bin");
      const startScript = path.join(
        quickstartBin,
        os.platform() === "win32" ? "start.bat" : "start"
      );
      const pidFile = path.join(
        instanceDir,
        "crx-quickstart",
        "conf",
        "cq.pid"
      );
      const passwordFilePath = path.join(instanceDir, config.passwordFile);
      const isDebug = opts.debug || instance.debug === true;
      const jvmOpts = isDebug
        ? `${config.jvmOpts} ${config.jvmDebugBaseOpts}`
        : config.jvmOpts;
      if (!fs.existsSync(instanceDir)) {
        fs.mkdirSync(instanceDir, { recursive: true });
      }
      if (!fs.existsSync(passwordFilePath)) {
        fs.writeFileSync(passwordFilePath, "admin");
        console.log(
          `[${instance.name}] Created password file: ${passwordFilePath}`
        );
      }
      const isWin = os.platform() === "win32";
      const scriptExists = fs.existsSync(startScript);
      const isExecutable =
        scriptExists && (!isWin ? fs.statSync(startScript).mode & 0o111 : true);
      let child;
      if (scriptExists && isExecutable) {
        // Use start script
        child = spawn(
          isWin ? "cmd.exe" : os.platform() === "darwin" ? "sh" : "./start",
          isWin
            ? ["/c", "start.bat"]
            : os.platform() === "darwin"
            ? [startScript]
            : [],
          {
            cwd: quickstartBin,
            detached: false,
            stdio: "inherit",
            shell: isWin,
          }
        );
        child.on("close", (code) => {
          console.log(
            `[${instance.name}] Start script exited with code ${code}`
          );
        });
        child.unref();
        if (onProgress) {
          onProgress(instance.name, `Started with PID: ${child.pid}`);
        }
      } else {
        // Fallback to java -jar
        const jar = `aem-${instance.name}-p${instance.port}.jar`;
        const jarPath = path.join(instanceDir, jar);
        const javaArgs = jvmOpts
          ? jvmOpts.split(" ").concat(["-jar", jarPath])
          : ["-jar", jarPath];
        child = spawn("java", javaArgs, {
          cwd: instanceDir,
          detached: false,
          stdio: "inherit",
          shell: isWin,
        });
        child.on("close", (code) => {
          console.log(`[${instance.name}] java -jar exited with code ${code}`);
        });
        child.unref();
        if (onProgress) {
          onProgress(instance.name, `Started with PID: ${child.pid}`);
        }
        // Ensure conf dir exists and write pid file
        const confDir = `${instanceDir}/crx-quickstart/conf`;
        if (!require("fs").existsSync(confDir)) {
          require("fs").mkdirSync(confDir, { recursive: true });
        }
        require("fs").writeFileSync(pidFile, String(child.pid));
        console.log(`[${instance.name}] PID file written: ${pidFile}`);
      }
      // Progress spinner: watch stdout.log for "Startup completed" after start
      if (onProgress) {
        const logDir = path.join(instanceDir, "crx-quickstart", "logs");
        const stdoutLog = path.join(logDir, "stdout.log");
        const startTime = Date.now();
        startupPromises.push(
          new Promise((resolve) => {
            if (!fs.existsSync(stdoutLog)) {
              onProgress(
                instance.name,
                "Waiting for stdout.log to be created..."
              );
            }
            const { spawn } = require("child_process");
            const tailCmd =
              process.platform === "win32" ? "powershell" : "tail";
            const tailArgs =
              process.platform === "win32"
                ? [
                    "-NoProfile",
                    "-NoLogo",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command",
                    `Get-Content -Path '${stdoutLog}' -Wait -Tail 10`,
                  ]
                : ["-F", stdoutLog];
            const tail = spawn(tailCmd, tailArgs, {
              shell: process.platform === "win32",
            });
            tail.stdout.on("data", (data: Buffer) => {
              const lines = data.toString().split(/\r?\n/);
              for (const line of lines) {
                if (!line) {
                  continue;
                }
                // Parse timestamp from log line
                const match = line.match(
                  /^(\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}\.\d{3}) \*INFO \* \[main\] Startup completed/
                );
                if (match) {
                  // Optionally, check timestamp is after startTime (if log format allows)
                  onProgress(instance.name, "Startup completed!", true);
                  tail.kill();
                  resolve();
                  return;
                }
                onProgress(instance.name, line);
              }
            });
            tail.stderr.on("data", (data: Buffer) => {
              onProgress(instance.name, data.toString(), true);
            });
          })
        );
      }
    }
    if (startupPromises.length > 0) {
      await Promise.all(startupPromises);
    }
  }
}
