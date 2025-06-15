import { ResolvedConfig } from "../config/config";
import type { MavenModule } from "./module";
import { MavenProject } from "./project";
import { execSync } from "child_process";
import path from "path";
import { parseArgs, ArgType, ArgDefinitions } from "../utils/argParser";

const ARGUMENTS: ArgDefinitions = {
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

/**
 * Runs a Maven command in the context of a resolved Maven project/module.
 *
 * @param config - The resolved configuration object (from config system).
 * @param input - Input string for Maven options.
 * @param cwd - Optional working directory to resolve modules from.
 * @returns Object with cwd and command, or undefined if not found.
 */
export async function getCommand(
  config: ResolvedConfig,
  input: string = "",
  cwd?: string
) {
  const opts = parseArgs(input, ARGUMENTS);
  if (opts.errors.length > 0) {
    throw new Error(`Argument parsing errors: ${opts.errors.join(", ")}`);
  }
  // Use provided cwd or default to process.cwd()
  const currentDirectory = cwd ? path.resolve(cwd) : process.cwd();
  const project = await MavenProject.load(currentDirectory);
  if (!project) {
    console.error(
      "Could not find a Maven project (no root pom.xml with <modules> found)."
    );
    return;
  }

  // Prefer explicit module, else resolve by cwd, else use root
  let target: MavenModule | undefined;
  if (opts.module) {
    if (opts.module === "all") {
      target = project.getRootModule();
    } else {
      target = project.getModule(opts.module as string);
    }
  } else {
    // Use the new helper to find the module whose path is the parent of cwd
    target = project.findModuleByPath(currentDirectory);
    if (!target) {
      console.error(
        `Could not find a Maven module for the current working directory: ${currentDirectory}`
      );
      return;
    }
  }

  if (!target) {
    console.error("Could not determine target Maven module.");
    return;
  }

  const goal = opts.build ? "install" : config.maven.mavenInstallCommand;
  const args = config.maven.mavenArguments;
  const profilePart = target.targetProfile ? `-P${target.targetProfile}` : "";
  const skipTestsPart =
    opts.skipTests || config.maven.skipTests ? "-DskipTests" : "";

  const command = `mvn ${args} ${goal} ${profilePart} ${skipTestsPart}`.trim();

  if (opts.dryRun || config.maven.dryRun) {
    const echoCmd = `echo [DRY RUN] Would run: ${command} in ${target.absolutePath}`;
    return { cwd: target.absolutePath, command: echoCmd };
  }

  return { cwd: target.absolutePath, command };
}

/**
 * Runs the Maven command synchronously in the resolved directory.
 * @param config - The resolved configuration object (from config system).
 * @param input - Input string for Maven options.
 * @param cwd - Optional working directory to resolve modules from.
 */
export async function runCommand(
  config: ResolvedConfig,
  input: string = "",
  cwd?: string
) {
  try {
    const result = await getCommand(config, input, cwd);
    if (!result) {
      return;
    }
    const { cwd: runCwd, command } = result;
    execSync(command, {
      cwd: path.resolve(runCwd),
      stdio: "inherit",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });
  } catch (error) {
    console.error("Error running Maven command:", error);
  }
}
