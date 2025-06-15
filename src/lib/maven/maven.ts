import { ResolvedConfig } from "../config/config";
import type { MavenModule } from "./module/module";
import { MavenProject } from "./project/project";
import { execSync } from "child_process";
import path from "path";

/**
 * Options for running a Maven command.
 * @property module - The module name or path to run Maven in.
 * @property dryRun - If true, prints the command instead of executing it.
 * @property skipTests - If true, skips tests during Maven build.
 */
export type MavenOpts = {
  targetModule?: string;
  skipTests?: boolean;
  dryRun?: boolean;
  build?: boolean;
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
  const opts = parseInput(input);
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
  if (opts.targetModule) {
    target = project.getModule(opts.targetModule);
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
    });
  } catch (error) {
    console.error("Error running Maven command:", error);
  }
}

export function parseInput(input: string): MavenOpts {
  const args = input.trim().split(/\s+/);
  let skipTests = false;
  let dryRun = false;
  let build = false;
  let targetModule: string | undefined = undefined;
  for (const arg of args) {
    if (/^--?skip-tests$/.test(arg) || arg === "-s" || arg === "skip-tests") {
      skipTests = true;
    } else if (/^--?dry-run$/.test(arg) || arg === "-d" || arg === "dry-run") {
      dryRun = true;
    } else if (/^--?build$/.test(arg) || arg === "-b" || arg === "build") {
      build = true;
    } else if (!arg.startsWith("-") && !targetModule) {
      targetModule = arg;
    }
  }
  return { skipTests, dryRun, build, targetModule };
}
