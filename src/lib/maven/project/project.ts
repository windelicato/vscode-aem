import * as fs from "fs/promises";
import { MavenModule } from "../module/module";
import { parsePomSync } from "../module/parser";
import { resolveProfiles } from "../module/resolver";
import type { PomXml } from "../module/types";
import type { MavenProjectData } from "./types";
import path from "path";

/**
 * Represents a Maven project, including its root and all modules.
 * Provides methods to access modules and to find a Maven project from a directory.
 */
export class MavenProject implements MavenProjectData {
  /**
   * Map of module name or absolute path to MavenModule instance.
   */
  modules: Record<string, MavenModule>;
  /**
   * The root Maven module of the project.
   */
  root: MavenModule;

  /**
   * Constructs a MavenProject from the root module and a list of modules.
   * @param root The root Maven module.
   * @param modules All modules in the project (including root).
   */
  constructor(root: MavenModule, modules: MavenModule[]) {
    this.root = root;
    this.modules = {};
    for (const mod of modules) {
      this.modules[mod.name] = mod;
      this.modules[mod.absolutePath] = mod;
    }
  }

  /**
   * Gets a Maven module by name or absolute path.
   * @param target The module name or absolute path.
   * @returns The MavenModule, or undefined if not found.
   */
  get(target: string): MavenModule | undefined {
    return this.modules[target];
  }

  /**
   * Gets all unique Maven modules in the project.
   * @returns An array of MavenModule instances.
   */
  getAll(): MavenModule[] {
    return Object.values(this.modules).filter(
      (v, i, arr) => arr.indexOf(v) === i
    );
  }

  /**
   * Finds and loads a Maven project by searching for a pom.xml up the directory tree.
   * @param rootDir The directory to start searching from.
   * @returns A MavenProject instance if found, or null if not found.
   */
  static async findProject(rootDir: string): Promise<MavenProject | null> {
    let dir = path.resolve(rootDir);
    const rootPath = path.parse(dir).root;
    while (dir !== rootPath) {
      const pomPath = path.join(dir, "pom.xml");
      const parentPomPath = path.join(dir, "..", "pom.xml");
      try {
        await fs.access(pomPath);
        const pom: PomXml = parsePomSync(pomPath);
        const parentPom: PomXml = parsePomSync(parentPomPath);
        if (pom.project && pom.project.modules) {
          const rootModule = MavenModule.fromData({
            absolutePath: dir,
            relativePath: ".",
            name: path.basename(dir),
            artifactId: pom.project.artifactId ?? path.basename(dir),
            profiles: resolveProfiles(pom, parentPom, true),
            isRoot: true,
          });
          let moduleNames = pom.project.modules.module;
          if (typeof moduleNames === "string") {
            moduleNames = [moduleNames];
          }
          const childModules: MavenModule[] = [];
          if (Array.isArray(moduleNames)) {
            const children = await Promise.all(
              moduleNames.map(async (modName: string) => {
                const absPath = path.join(dir, modName);
                const childPom: PomXml = parsePomSync(
                  path.join(absPath, "pom.xml")
                );
                const childParentPom: PomXml = parsePomSync(
                  path.join(absPath, "..", "pom.xml")
                );
                return MavenModule.fromData({
                  absolutePath: absPath,
                  relativePath: ".",
                  name: path.basename(absPath),
                  artifactId:
                    childPom.project?.artifactId ?? path.basename(absPath),
                  profiles: resolveProfiles(childPom, childParentPom, false),
                  isRoot: false,
                });
              })
            );
            children.forEach((mod: unknown) => {
              if (mod) {
                childModules.push(mod as MavenModule);
              }
            });
          }
          return new MavenProject(rootModule, [rootModule, ...childModules]);
        }
      } catch {
        // ignore
      }
      dir = path.dirname(dir);
    }
    return null;
  }
}
