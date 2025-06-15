import { SdkConfig } from "../config";
import * as fs from "fs";
import { spawn } from "child_process";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";

export const ARGUMENTS: ArgDefinitions = {
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

export async function start(config: SdkConfig, input: string = "") {
  const opts = parseArgs(input, ARGUMENTS);

  // Optionally filter instances
  const instances = opts.instance
    ? config.instances.filter((i) => i.name === opts.instance)
    : config.instances;
  for (const instance of instances) {
    const instanceDir = `${config.sdkHome}/${instance.name}`;
    const startScript = `${instanceDir}/crx-quickstart/bin/start`;
    const pidFile = `${instanceDir}/crx-quickstart/conf/cq.pid`;
    const passwordFilePath = `${instanceDir}/${config.passwordFile}`;
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
    if (fs.existsSync(startScript) && fs.statSync(startScript).mode & 0o111) {
      const proc = spawn("./start", [], {
        cwd: `${instanceDir}/crx-quickstart/bin`,
        stdio: "inherit",
        shell: false,
      });
      proc.on("close", (code) => {
        console.log(`[${instance.name}] Start script exited with code ${code}`);
      });
    } else {
      // Fallback to java -jar
      const jar = `aem-${instance.name}-p${instance.port}.jar`;
      const jarPath = `${instanceDir}/${jar}`;
      const proc = spawn("java", ["-jar", jarPath, jvmOpts], {
        cwd: instanceDir,
        stdio: "inherit",
      });
      proc.on("close", (code) => {
        console.log(`[${instance.name}] java -jar exited with code ${code}`);
      });
    }
  }
}
