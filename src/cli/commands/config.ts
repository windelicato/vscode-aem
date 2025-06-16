import path from "path";
import os from "os";
import { configSchema, loadConfigFile } from "../../lib/config/config";
import fs from "fs";

export function handleConfigCommand(subcmd: string, args: string[]) {
  if (subcmd === "init") {
    // Use env variable if set, otherwise current directory
    const configPath = process.env.AEM_CONFIG_PATH || ".aemrc.json";
    const defaultConfig = Object.fromEntries(
      Object.entries(configSchema).map(([section, schema]) => [
        section,
        Object.fromEntries(
          Object.entries(schema).map(([key, resolver]) => [
            key,
            resolver.default,
          ])
        ),
      ])
    );
    if (fs.existsSync(configPath)) {
      console.error(`${configPath} already exists. Aborting.`);
      process.exit(1);
    }
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Default config written to ${configPath}`);
    process.exit(0);
  } else if (subcmd === "show") {
    // Print the fully resolved config
    const config = loadConfigFile();
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  } else {
    throw new Error("Unknown config subcommand: " + subcmd);
  }
}
