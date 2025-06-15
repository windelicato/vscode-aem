import * as fs from "fs/promises";
import { MavenModule } from "../module/module";
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
   * Constructs a MavenProject from a list of modules.
   * @param modules All modules in the project (including root).
   */
  private constructor(modules: MavenModule[]) {
    this.modules = {};
    for (const mod of modules) {
      this.modules[mod.name] = mod;
    }
  }

  /**
   * Returns the root Maven module (where parentPom === null).
   */
  getRootModule(): MavenModule | undefined {
    return this.getAll().find((mod) => mod.parentPom === null);
  }

  /**
   * Gets a Maven module by name.
   * @param name The module name.
   * @returns The MavenModule, or undefined if not found.
   */
  getModule(name: string): MavenModule | undefined {
    return this.modules[name];
  }

  /**
   * Gets all Maven modules in the project.
   * @returns An array of MavenModule instances.
   */
  getAll(): MavenModule[] {
    return Object.values(this.modules);
  }

  /**
   * Loads a Maven project by searching for a pom.xml up the directory tree.
   * @param dirPath The directory to start searching from.
   * @returns A MavenProject instance if found, or null if not found.
   */
  static async load(dirPath: string): Promise<MavenProject | null> {
    let dir = path.resolve(dirPath);
    const rootPath = path.parse(dir).root;
    while (dir !== rootPath) {
      const pomPath = path.join(dir, "pom.xml");
      await fs.access(pomPath);
      const module = await MavenModule.load(dir);

      // Wait until we have a root module
      if (!module || module.parentPom) {
        dir = path.dirname(dir);
        continue;
      }

      // Extract and load child modules in one loop
      let childModules: MavenModule[] = [];
      const pom = module.pom;
      if (pom && pom.project && pom.project.modules) {
        const mods = pom.project.modules.module;
        if (Array.isArray(mods)) {
          for (const modName of mods) {
            const child = await MavenModule.load(path.join(dir, modName));
            if (child) {
              childModules.push(child);
            }
          }
        } else if (typeof mods === "string") {
          const child = await MavenModule.load(path.join(dir, mods));
          if (child) {
            childModules.push(child);
          }
        }
      }
      return new MavenProject([module, ...childModules]);
    }

    // Return the MavenProject with root and children
    return null;
  }

  /**
   * Finds the deepest module whose absolutePath is a parent of the given path.
   * @param searchPath The path to search for.
   * @returns The deepest MavenModule or undefined.
   */
  findModuleByPath(searchPath: string): MavenModule | undefined {
    const resolved = path.resolve(searchPath);
    return this.getAll().reduce(
      (best: MavenModule | undefined, mod: MavenModule) => {
        const modPath = path.resolve(mod.absolutePath);
        if (resolved.startsWith(modPath)) {
          if (
            !best ||
            modPath.length > path.resolve(best.absolutePath).length
          ) {
            return mod;
          }
        }
        return best;
      },
      undefined
    );
  }
}
