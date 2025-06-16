import { Command } from "../../base/command";
import { SdkConfig } from "../config";
import * as fs from "fs";
import * as path from "path";
import { parseArgs, ArgType, ArgDefinitions } from "../../utils/argParser";
import { extractFileFromZip } from "../../utils/zipUtils";

function expandHome(filePath: string): string {
  if (!filePath) {
    return filePath;
  }
  if (filePath.startsWith("~")) {
    return path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      filePath.slice(1)
    );
  }
  return filePath;
}

export class SdkSetupCommand extends Command<
  typeof SdkSetupCommand.ARGUMENTS,
  (msg: string) => void
> {
  static readonly ARGUMENTS: ArgDefinitions = {
    quickstartPath: {
      type: ArgType.Value,
      aliases: ["quickstartPath", "--quickstartPath", "-q"],
      description: "Path to AEM quickstart zip",
      required: false,
    },
    formsAddonPath: {
      type: ArgType.Value,
      aliases: ["formsAddonPath", "--formsAddonPath", "-f"],
      description: "Path to AEM Forms add-on zip",
      required: false,
    },
    home: {
      type: ArgType.Value,
      aliases: ["home", "--home", "-d"],
      description: "AEM SDK home directory",
      required: false,
    },
  };

  readonly name = "sdk-setup";
  readonly description =
    "Setup AEM SDK quickstart and forms add-on for all instances.";
  readonly arguments = SdkSetupCommand.ARGUMENTS;

  async create(input: string) {
    // Not a shell command, so just return info
    return { cwd: process.cwd(), command: "sdk-setup" };
  }

  async run(
    input: string,
    cwd?: string,
    progress?: (msg: string) => void
  ): Promise<void> {
    const opts = parseArgs(input, this.arguments);
    const config = this.config.sdk;
    const quickstartPath = expandHome(
      opts.quickstartPath || config.quickstartPath
    );
    const formsAddonPath = expandHome(
      opts.formsAddonPath || config.formsAddonPath
    );
    const home = expandHome(opts.home || config.home);

    if (!quickstartPath || !quickstartPath.toLowerCase().endsWith(".zip")) {
      const msg =
        "quickstartPath must be a .zip file containing the AEM quickstart jar.";
      if (progress) {
        progress(msg);
      }
      if (!progress) {
        console.error(msg);
      }
      return;
    }
    let quickstartJar = await extractFileFromZip(
      quickstartPath,
      home,
      /^aem-sdk-quickstart-[0-9a-zA-Z_.-]+\.jar$/,
      "aem-sdk-quickstart-*.jar",
      progress
    );
    if (!quickstartJar) {
      return;
    }

    let formsAddonFar: string | undefined;
    if (formsAddonPath) {
      if (!formsAddonPath.toLowerCase().endsWith(".zip")) {
        const msg =
          "formsAddonPath must be a .zip file containing the AEM Forms add-on .far.";
        if (progress) {
          progress(msg);
        }
        if (!progress) {
          console.error(msg);
        }
        return;
      }
      const formsAddonBase = path.basename(formsAddonPath);
      const homeFormsAddon = path.join(home, formsAddonBase);
      if (!fs.existsSync(homeFormsAddon)) {
        try {
          fs.copyFileSync(formsAddonPath, homeFormsAddon);
          const msg = `[INFO] Copied Forms Add-on ${formsAddonPath} to ${homeFormsAddon}`;
          if (progress) {
            progress(msg);
          }
          if (!progress) {
            console.log(msg);
          }
        } catch (e: any) {
          const msg = `[ERROR] Failed to copy Forms Add-on: ${e.message}`;
          if (progress) {
            progress(msg);
          }
          if (!progress) {
            console.error(msg);
          }
        }
      }
      formsAddonFar = await extractFileFromZip(
        homeFormsAddon,
        home,
        /^aem-forms-addon-.*\.far$/,
        "aem-forms-addon-*.far",
        progress
      );
      if (formsAddonFar) {
        const msg = `[INFO] Extracted ${path.basename(
          formsAddonFar
        )} from ${formsAddonBase}.`;
        if (progress) {
          progress(msg);
        }
        if (!progress) {
          console.log(msg);
        }
      } else {
        const msg = `[INFO] No aem-forms-addon-*.far found in ${formsAddonBase}. Skipping Forms add-on installation.`;
        if (progress) {
          progress(msg);
        }
        if (!progress) {
          console.log(msg);
        }
      }
    }
    // --- Copy quickstart jar and forms add-on far to each instance ---
    const instances = config.instances;
    for (const instance of instances) {
      const instanceDir = path.join(home, instance.name);
      if (!fs.existsSync(instanceDir)) {
        fs.mkdirSync(instanceDir, { recursive: true });
      }
      // Copy quickstart jar to instance dir with correct name
      const instanceJar = `aem-${instance.name}-p${instance.port}.jar`;
      const destJar = path.join(instanceDir, instanceJar);
      if (!fs.existsSync(destJar)) {
        fs.copyFileSync(quickstartJar, destJar);
        if (!progress) {
          console.log(
            `[${instance.name}] Copied ${quickstartJar} to ${destJar}`
          );
        }
      } else {
        if (!progress) {
          console.log(
            `[${instance.name}] ${instanceJar} already exists. Skipping copy.`
          );
        }
      }
      // Copy forms add-on far to crx-quickstart/install if present
      if (formsAddonFar) {
        const formsAddonBasename = path.basename(formsAddonFar);
        const installDir = path.join(instanceDir, "crx-quickstart", "install");
        if (!fs.existsSync(installDir)) {
          fs.mkdirSync(installDir, { recursive: true });
        }
        const destFar = path.join(installDir, formsAddonBasename);
        if (!fs.existsSync(destFar)) {
          fs.copyFileSync(formsAddonFar, destFar);
          if (!progress) {
            console.log(
              `[${instance.name}] Copied ${formsAddonFar} to ${destFar}`
            );
          }
        } else {
          if (!progress) {
            console.log(
              `[${instance.name}] ${formsAddonBasename} already exists in install dir. Skipping copy.`
            );
          }
        }
      } else {
        if (!progress) {
          console.log(
            `[${instance.name}] No Forms Add-on .far provided. Skipping.`
          );
        }
      }
    }
    if (!progress) {
      console.log(
        "AEM JARs and Forms Add-on ensured for all instances. The crx-quickstart directory will be created on first start."
      );
    }
    // Ensure process exits after setup completes
    process.exit(0);
  }
}
