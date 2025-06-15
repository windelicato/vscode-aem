import { ResolvedConfig } from "../config/config";
import type { MavenModule } from "./module/module";
import { MavenProject } from "./project/project";
import { execSync } from "child_process";
import path from "path";

/**
 * Options for running a Maven command.
 * @property module - The module name or path to run Maven in.
 * @property profile - The Maven profile to use.
 * @property dryRun - If true, prints the command instead of executing it.
 * @property skipTests - If true, skips tests during Maven build.
 */
type MavenOpts = {
  module?: string;
  profile?: string;
  dryRun?: boolean;
  skipTests?: boolean;
};

/**
 * Runs a Maven command in the context of a resolved Maven project/module.
 *
 * @param config - The resolved configuration object (from config system).
 * @param opts - Options for running Maven (module, profile, dryRun, skipTests).
 * @returns void (prints output or runs Maven command synchronously)
 */
export async function runMaven(config: ResolvedConfig, opts: MavenOpts = {}) {
  const cwd = opts.module ?? config.sdk.sdkHome ?? ".";
  // Use MavenProject.findProject instead of PomModule.findProject
  const project = await MavenProject.findProject(cwd);
  if (!project) {
    console.error(
      "Could not find a Maven project (no root pom.xml with <modules> found)."
    );
    return;
  }

  // Prefer explicit module, else resolve by cwd, else use root
  let target: MavenModule | undefined;
  if (opts.module) {
    target = project.get(opts.module);
  } else {
    // Try to find the module whose path is the parent of cwd
    const cwdResolved = path.resolve(cwd);
    target =
      project
        .getAll()
        .reduce((best: MavenModule | undefined, mod: MavenModule) => {
          const modPath = path.resolve(mod.absolutePath);
          if (cwdResolved.startsWith(modPath)) {
            if (
              !best ||
              modPath.length > path.resolve(best.absolutePath).length
            ) {
              return mod;
            }
          }
          return best;
        }, undefined) || project.root;
  }

  if (!target) {
    console.error("Could not determine target Maven module.");
    return;
  }

  const goal = config.maven.mavenInstallCommand;
  const args = config.maven.mavenArguments;
  const profilePart = opts.profile
    ? `-P${opts.profile}`
    : target.profiles[0]
    ? `-P${target.profiles[0]}`
    : "";
  const skipTestsPart =
    opts.skipTests || config.maven.skipTests ? "-DskipTests" : "";
  const command = `mvn ${args} ${goal} ${profilePart} ${skipTestsPart}`.trim();

  if (opts.dryRun || config.maven.dryRun) {
    console.log(`[DRY RUN] Would run: ${command} in ${target.absolutePath}`);
  } else {
    execSync(command, {
      cwd: path.resolve(target.absolutePath),
      stdio: "inherit",
    });
  }
}
