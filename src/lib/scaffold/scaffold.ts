import { execSync } from "child_process";
import { parseArgs, ArgType, ArgDefinitions } from "../utils/argParser";
import { Command } from "../base/command";

export class ScaffoldCommand extends Command<typeof ScaffoldCommand.ARGUMENTS> {
  static readonly ARGUMENTS: ArgDefinitions = {
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

  readonly name = "scaffold";
  readonly description = "Scaffold a new AEM project using Maven archetype.";
  readonly arguments = ScaffoldCommand.ARGUMENTS;

  async create(input: string) {
    const opts = parseArgs(input, this.arguments);
    if (opts.errors.length > 0) {
      throw new Error(`Argument parsing errors: ${opts.errors.join(", ")}`);
    }
    const currentDirectory = process.cwd();
    const targetDir = opts.targetDir || currentDirectory;
    const archetypeVersion =
      opts.archetypePluginVersion ||
      this.config.scaffold.archetypePluginVersion;
    let scaffoldArgs: string =
      opts.scaffoldArgs || this.config.scaffold.scaffoldArgs || "";

    if (opts.packageName) {
      scaffoldArgs = scaffoldArgs.replace(/\{packageName\}/g, opts.packageName);
    }
    if (opts.appTitle) {
      scaffoldArgs = scaffoldArgs.replace(/\{appTitle\}/g, opts.appTitle);
    }
    scaffoldArgs = scaffoldArgs
      .replace(/\\\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\\/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const command =
      `mvn -B org.apache.maven.plugins:maven-archetype-plugin:${archetypeVersion}:generate ${scaffoldArgs}`.trim();
    return { cwd: targetDir, command };
  }

  async run(input: string, cwd?: string): Promise<void> {
    const { cwd: runCwd, command } = await this.create(input);
    execSync(command, {
      cwd: runCwd,
      stdio: "inherit",
    });
  }
}
