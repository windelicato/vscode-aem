import { Command } from "../base/command";
import type { MavenModule } from "./module";
import { MavenProject } from "./project";
import { execSync } from "child_process";
import path from "path";
import { parseArgs, ArgType, ArgDefinitions } from "../utils/argParser";

export class MavenCommand extends Command<typeof MavenCommand.ARGUMENTS> {
  static readonly ARGUMENTS: ArgDefinitions = {
    skipTests: {
      type: ArgType.Flag,
      aliases: ["skip-tests", "--skip-tests", "-s"],
      description: "Skip tests during Maven build",
      default: false,
    },
    dryRun: {
      type: ArgType.Flag,
      aliases: ["dry-run", "--dry-run", "-d"],
      description: "Run Maven in dry-run mode",
      default: false,
    },
    build: {
      type: ArgType.Flag,
      aliases: ["build", "--build", "-b"],
      description: "Use the build goal instead of the default",
    },
    module: {
      type: ArgType.Positional,
      description: "Target Maven module (positional argument)",
    },
  };

  readonly name = "maven";
  readonly description =
    "Run Maven commands in the context of a resolved Maven project/module.";
  readonly arguments = MavenCommand.ARGUMENTS;

  async create(input: string) {
    const opts = parseArgs(input, this.arguments);
    if (opts.errors.length > 0) {
      throw new Error(`Argument parsing errors: ${opts.errors.join(", ")}`);
    }
    const currentDirectory = process.cwd();
    const project = await MavenProject.load(currentDirectory);
    if (!project) {
      throw new Error(
        "Could not find a Maven project (no root pom.xml with <modules> found)."
      );
    }
    let target: MavenModule | undefined;
    if (opts.module) {
      if (opts.module === "all") {
        target = project.getRootModule();
      } else {
        target = project.getModule(opts.module as string);
      }
    } else {
      target = project.findModuleByPath(currentDirectory);
      if (!target) {
        throw new Error(
          `Could not find a Maven module for the current working directory: ${currentDirectory}`
        );
      }
    }
    if (!target) {
      throw new Error("Could not determine target Maven module.");
    }
    const goal = opts.build ? "install" : this.config.maven.mavenInstallCommand;
    const args = this.config.maven.mavenArguments;
    const profilePart = target.targetProfile ? `-P${target.targetProfile}` : "";
    const skipTestsPart =
      opts.skipTests || this.config.maven.skipTests ? "-DskipTests" : "";
    const command =
      `mvn ${args} ${goal} ${profilePart} ${skipTestsPart}`.trim();
    if (opts.dryRun || this.config.maven.dryRun) {
      const echoCmd = `echo [DRY RUN] Would run: ${command} in ${target.absolutePath}`;
      return { cwd: target.absolutePath, command: echoCmd };
    }
    return { cwd: target.absolutePath, command };
  }

  async run(input: string, cwd?: string): Promise<void> {
    const { cwd: runCwd, command } = await this.create(input);
    // If dry run, just print the command, don't execute
    if (command.startsWith('echo [DRY RUN]')) {
      console.log(command.replace(/^echo /, ''));
      return;
    }
    execSync(command, {
      cwd: runCwd,
      stdio: "inherit",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });
  }
}
