import path from "path";
import os from "os";
import { configSchema, loadConfigFile } from "../../lib/config/config";
import fs from "fs";

export function handleConfigCommand(subcmd: string, args: string[]) {
  if (subcmd === "init") {
    // Use env variable if set, otherwise current directory, or argument as path
    let configPath = process.env.AEM_CONFIG_PATH || ".aemrc.json";
    if (args.length > 0 && args[0]) {
      let argPath = args[0];
      if (fs.existsSync(argPath) && fs.lstatSync(argPath).isDirectory()) {
        configPath = path.join(argPath, ".aemrc.json");
      } else {
        configPath = argPath;
      }
    }
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
  } else if (subcmd === "env") {
    // Print environment variable overrides for config fields
    const overrides: Record<string, string> = {};
    for (const [section, schema] of Object.entries(configSchema)) {
      for (const [key, resolver] of Object.entries(schema)) {
        if (resolver.env && process.env[resolver.env] !== undefined) {
          overrides[`${section}.${key}`] = process.env[resolver.env] as string;
        }
      }
    }
    if (Object.keys(overrides).length === 0) {
      console.log("No config environment variable overrides set.");
    } else {
      console.log("Config environment variable overrides:");
      for (const [field, value] of Object.entries(overrides)) {
        console.log(`${field} = ${value}`);
      }
    }
    process.exit(0);
  } else if (subcmd === "env-list") {
    // Print all available config environment variables and their descriptions
    console.log("Available config environment variables:");
    for (const [section, schema] of Object.entries(configSchema)) {
      for (const [key, resolver] of Object.entries(schema)) {
        if (resolver.env) {
          const desc = resolver.description ? ` - ${resolver.description}` : "";
          console.log(`${resolver.env} (${section}.${key})${desc}`);
        }
      }
    }
    process.exit(0);
  } else if (subcmd === "path") {
    // Show the config file path currently in use
    const envConfigPath =
      typeof process !== "undefined" ? process.env.AEM_CONFIG_PATH : undefined;
    let finalConfigPath = ".aemrc.json";
    let configFilePath = "";
    if (envConfigPath) {
      finalConfigPath = envConfigPath;
      configFilePath = path.resolve(process.cwd(), finalConfigPath);
    } else {
      configFilePath = path.resolve(process.cwd(), finalConfigPath);
      if (!fs.existsSync(configFilePath)) {
        const home = process.env.HOME || process.env.USERPROFILE;
        if (home) {
          const homeConfigPath = path.join(home, finalConfigPath);
          if (fs.existsSync(homeConfigPath)) {
            configFilePath = homeConfigPath;
          }
        }
      }
    }
    if (configFilePath && fs.existsSync(configFilePath)) {
      console.log(configFilePath);
    } else {
      console.log("No config file found.");
    }
    process.exit(0);
  } else if (subcmd === "validate") {
    // Validate the config file and report missing/invalid fields
    let configFilePath: string;
    if (args.length > 0 && args[0]) {
      let argPath = args[0];
      if (fs.existsSync(argPath) && fs.lstatSync(argPath).isDirectory()) {
        configFilePath = path.join(argPath, ".aemrc.json");
      } else {
        configFilePath = argPath;
      }
    } else {
      const envConfigPath =
        typeof process !== "undefined"
          ? process.env.AEM_CONFIG_PATH
          : undefined;
      configFilePath = envConfigPath
        ? path.resolve(process.cwd(), envConfigPath)
        : path.resolve(process.cwd(), ".aemrc.json");
    }
    if (!fs.existsSync(configFilePath)) {
      console.error(`No config file found at ${configFilePath}`);
      process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
    let valid = true;
    const errors: string[] = [];
    for (const [section, schema] of Object.entries(configSchema)) {
      const sectionConfig = (config as any)[section] || {};
      for (const [key, resolver] of Object.entries(schema)) {
        const value = sectionConfig[key];
        const defaultIsEmptyString =
          resolver &&
          typeof resolver === "object" &&
          "default" in resolver &&
          resolver.default === "";
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value === "" && !defaultIsEmptyString)
        ) {
          errors.push(`${section}.${key} is missing or empty`);
          valid = false;
        }
      }
    }
    if (valid) {
      console.log("Config is valid.");
    } else {
      console.error("Config validation failed:");
      for (const err of errors) {
        console.error("  - " + err);
      }
      process.exit(1);
    }
    process.exit(0);
  } else {
    throw new Error("Unknown config subcommand: " + subcmd);
  }
}
