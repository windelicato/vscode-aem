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
};

/**
 * Runs a Maven command in the context of a resolved Maven project/module.
 *
 * @param config - The resolved configuration object (from config system).
 * @param opts - Options for running Maven (module, dryRun, skipTests).
 * @returns void (prints output or runs Maven command synchronously)
 */
export async function getCommand(config: ResolvedConfig, input: string = "") {
  const opts = parseInput(input);
  const cwd = path.resolve(opts.targetModule ?? ".");
  // Use MavenProject.load instead of PomModule.findProject
  const project = await MavenProject.load(cwd);
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
    target = project.findModuleByPath(cwd);
    if (!target) {
      console.error(
        `Could not find a Maven module for the current working directory: ${cwd}`
      );
      return;
    }
  }

  if (!target) {
    console.error("Could not determine target Maven module.");
    return;
  }

  const goal = config.maven.mavenInstallCommand;
  const args = config.maven.mavenArguments;
  const profilePart = target.profiles[0] ? `-P${target.profiles[0]}` : "";
  const skipTestsPart =
    opts.skipTests || config.maven.skipTests ? "-DskipTests" : "";

  const command = `mvn ${args} ${goal} ${profilePart} ${skipTestsPart}`.trim();

  if (opts.dryRun || config.maven.dryRun) {
    const echoCmd = `echo [DRY RUN] Would run: ${command} in ${cwd}`;
    return { cwd: target.absolutePath, command: echoCmd };
  }

  return { cwd: target.absolutePath, command };
}

export async function runCommand(config: ResolvedConfig, input: string = "") {
  try {
    const result = await getCommand(config, input);
    if (!result) {
      return;
    }
    const { cwd, command } = result;
    execSync(command, {
      cwd: path.resolve(cwd),
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
  let targetModule: string | undefined = undefined;
  for (const arg of args) {
    if (/^--?skip-tests$/.test(arg)) {
      skipTests = true;
    } else if (/^--?dry-run$/.test(arg)) {
      dryRun = true;
    } else if (!arg.startsWith("-") && !targetModule) {
      targetModule = arg;
    }
  }
  return { skipTests, dryRun, targetModule };
}
