import { configSchema } from "../../lib/config/config";
import fs from "fs";

export function handleConfigCommand(subcmd: string, args: string[]) {
  if (subcmd === "init") {
    const configPath = ".aemrc.json";
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
  } else {
    throw new Error("Unknown config subcommand: " + subcmd);
  }
}
