import type { MavenModule } from "../module/module";

/**
 * Interface for MavenProject data structure.
 * @property modules - Map of module name or absolute path to MavenModule instance.
 * @property root - The root Maven module of the project.
 */
export interface MavenProjectData {
  modules: Record<string, MavenModule>;
  root: MavenModule;
}
