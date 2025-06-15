import { SdkConfig } from "../config";
import * as fs from "fs";
import { spawnSync } from "child_process";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";

export const ARGUMENTS: ArgDefinitions = {
  instance: {
    type: ArgType.Value,
    aliases: ["instance", "--instance", "-i"],
    description: "Instance name to stop",
    required: false,
  },
};

export async function stop(config: SdkConfig, input: string = "") {
  const opts = parseArgs(input, ARGUMENTS);
  const instances = opts.instance
    ? config.instances.filter((i) => i.name === opts.instance)
    : config.instances;
  for (const instance of instances) {
    const instanceDir = `${config.sdkHome}/${instance.name}`;
    const stopScript = `${instanceDir}/crx-quickstart/bin/stop`;
    if (fs.existsSync(stopScript) && fs.statSync(stopScript).mode & 0o111) {
      const result = spawnSync("./stop", [], {
        cwd: `${instanceDir}/crx-quickstart/bin`,
        stdio: "inherit",
        shell: false,
      });
      if (result.error) {
        console.error(
          `[${instance.name}] Error running stop script: ${result.error.message}`
        );
      } else {
        console.log(`[${instance.name}] Stopped AEM ${instance.name}.`);
      }
    } else {
      console.log(
        `[${instance.name}] Stop script not found or not executable: ${stopScript}`
      );
    }
  }
}
