import { execSync } from "child_process";
import path from "path";
import { parseArgs, ArgType, ArgDefinitions } from "../utils/argParser";
import { ScaffoldConfig } from "./config";

export const ARGUMENTS: ArgDefinitions = {
  appTitle: {
    type: ArgType.Value,
    aliases: ["appTitle", "--appTitle", "-t"],
    description: "App Title for the new project",
    required: true,
  },
  packageName: {
    type: ArgType.Value,
    aliases: ["packageName", "--packageName", "-p"],
    description: "Java package name (e.g., mysite)",
    required: true,
  },
  scaffoldArgs: {
    type: ArgType.Value,
    aliases: ["scaffoldArgs", "--scaffoldArgs", "-a"],
    description: "Arguments for the scaffold command",
    required: false,
  },
  archetypePluginVersion: {
    type: ArgType.Value,
    aliases: ["archetypePluginVersion", "--archetypePluginVersion", "-v"],
    description: "Version of the archetype plugin",
    default: "3.3.1",
    required: false,
  },
  targetDir: {
    type: ArgType.Positional,
    description: "Target directory for scaffolding (positional argument)",
  },
};

export function getCommand(
  config: ScaffoldConfig,
  input: string = "",
  cwd?: string
) {
  const opts = parseArgs(input, ARGUMENTS);
  if (opts.errors.length > 0) {
    throw new Error(`Argument parsing errors: ${opts.errors.join(", ")}`);
  }
  const currentDirectory = cwd ? path.resolve(cwd) : process.cwd();
  const targetDir = opts.targetDir || currentDirectory;
  const archetypeVersion =
    opts.archetypePluginVersion || config.archetypePluginVersion;
  let scaffoldArgs: string = opts.scaffoldArgs || config.scaffoldArgs || "";

  // Replace placeholders in scaffoldArgs with project arguments
  if (opts.packageName) {
    scaffoldArgs = scaffoldArgs.replace(/\{packageName\}/g, opts.packageName);
  }
  if (opts.appTitle) {
    scaffoldArgs = scaffoldArgs.replace(/\{appTitle\}/g, opts.appTitle);
  }
  // Normalize scaffoldArgs: replace newlines and backslashes with spaces
  scaffoldArgs = scaffoldArgs
    .replace(/\\\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\\/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Compose the command
  const command =
    `mvn -B org.apache.maven.plugins:maven-archetype-plugin:${archetypeVersion}:generate ${scaffoldArgs}`.trim();
  return { cwd: targetDir, command };
}

export function runCommand(
  config: ScaffoldConfig,
  input: string = "",
  cwd?: string
) {
  const { cwd: runCwd, command } = getCommand(config, input, cwd);
  execSync(command, {
    cwd: path.resolve(runCwd),
    stdio: "inherit",
  });
}
