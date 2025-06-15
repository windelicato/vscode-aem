import * as fs from "fs/promises";
import * as path from "path";
import { resolveProfiles } from "./resolver";
import type { MavenModuleData } from "./types";
import { MavenProject } from "../project/project";
import { parsePomSync } from "./parser";

export class MavenModule implements MavenModuleData {
  absolutePath: string;
  relativePath: string;
  name: string;
  artifactId: string;
  profiles: string[];
  isRoot: boolean;

  private constructor(data: MavenModuleData) {
    this.absolutePath = data.absolutePath;
    this.relativePath = data.relativePath;
    this.name = data.name;
    this.artifactId = data.artifactId;
    this.profiles = data.profiles;
    this.isRoot = data.isRoot;
  }

  static fromData(data: MavenModuleData): MavenModule {
    return new MavenModule(data);
  }

  static async fromDirectory(
    dir: string,
    isRoot = false
  ): Promise<MavenModule | null> {
    const pomPath = path.join(dir, "pom.xml");
    const parentPomPath = path.join(dir, "..", "pom.xml");
    try {
      await fs.access(pomPath);
      const pom = parsePomSync(pomPath);
      const parentPom = parsePomSync(parentPomPath);
      const artifactId = path.basename(dir);
      const profiles = resolveProfiles(pom, parentPom, isRoot);
      return new MavenModule({
        absolutePath: dir,
        relativePath: ".",
        name: path.basename(dir),
        artifactId,
        profiles,
        isRoot,
      });
    } catch {
      return null;
    }
  }

  static async findProject(rootDir: string): Promise<MavenProject | null> {
    return MavenProject.findProject(rootDir);
  }
}

export * from "./types";
export * from "./parser";
export * from "./resolver";
