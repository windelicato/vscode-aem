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

export const ARGUMENTS: ArgDefinitions = {
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
  sdkHome: {
    type: ArgType.Value,
    aliases: ["sdkHome", "--sdkHome", "-d"],
    description: "AEM SDK home directory",
    required: false,
  },
};

export async function runCommand(
  config: SdkConfig,
  input: string = "",
  progress?: (msg: string) => void
) {
  const opts = parseArgs(input, ARGUMENTS);
  // Use CLI args if provided, else config
  const quickstartPath = expandHome(
    opts.quickstartPath || config.quickstartPath
  );
  const formsAddonPath = expandHome(
    opts.formsAddonPath || config.formsAddonPath
  );
  const sdkHome = expandHome(opts.sdkHome || config.sdkHome);

  if (!quickstartPath || !quickstartPath.toLowerCase().endsWith(".zip")) {
    const msg =
      "quickstartPath must be a .zip file containing the AEM quickstart jar.";
    if (progress) {
      progress(msg);
    }
    console.error(msg);
    return;
  }
  let quickstartJar = await extractFileFromZip(
    quickstartPath,
    sdkHome,
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
      console.error(msg);
      return;
    }
    const formsAddonBase = path.basename(formsAddonPath);
    const sdkHomeFormsAddon = path.join(sdkHome, formsAddonBase);
    if (!fs.existsSync(sdkHomeFormsAddon)) {
      try {
        fs.copyFileSync(formsAddonPath, sdkHomeFormsAddon);
        const msg = `[INFO] Copied Forms Add-on ${formsAddonPath} to ${sdkHomeFormsAddon}`;
        if (progress) {
          progress(msg);
        }
        console.log(msg);
      } catch (e: any) {
        const msg = `[ERROR] Failed to copy Forms Add-on: ${e.message}`;
        if (progress) {
          progress(msg);
        }
        console.error(msg);
      }
    }
    formsAddonFar = await extractFileFromZip(
      sdkHomeFormsAddon,
      sdkHome,
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
      console.log(msg);
    } else {
      const msg = `[INFO] No aem-forms-addon-*.far found in ${formsAddonBase}. Skipping Forms add-on installation.`;
      if (progress) {
        progress(msg);
      }
      console.log(msg);
    }
  }
  // --- Copy quickstart jar and forms add-on far to each instance ---
  const instances = config.instances;
  for (const instance of instances) {
    const instanceDir = path.join(sdkHome, instance.name);
    if (!fs.existsSync(instanceDir)) {
      fs.mkdirSync(instanceDir, { recursive: true });
    }
    // Copy quickstart jar to instance dir with correct name
    const instanceJar = `aem-${instance.name}-p${instance.port}.jar`;
    const destJar = path.join(instanceDir, instanceJar);
    if (!fs.existsSync(destJar)) {
      fs.copyFileSync(quickstartJar, destJar);
      console.log(`[${instance.name}] Copied ${quickstartJar} to ${destJar}`);
    } else {
      console.log(
        `[${instance.name}] ${instanceJar} already exists. Skipping copy.`
      );
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
        console.log(`[${instance.name}] Copied ${formsAddonFar} to ${destFar}`);
      } else {
        console.log(
          `[${instance.name}] ${formsAddonBasename} already exists in install dir. Skipping copy.`
        );
      }
    } else {
      console.log(
        `[${instance.name}] No Forms Add-on .far provided. Skipping.`
      );
    }
  }
  console.log(
    "AEM JARs and Forms Add-on ensured for all instances. The crx-quickstart directory will be created on first start."
  );
}
