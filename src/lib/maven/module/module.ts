import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { XMLParser } from "fast-xml-parser";
import type { MavenModuleData } from "./types";

export class MavenModule implements MavenModuleData {
  absolutePath: string;
  name: string;
  artifactId: string;
  profiles: string[];
  pom?: any;
  parentPom?: any;

  private constructor(data: MavenModuleData) {
    this.absolutePath = data.absolutePath;
    this.name = data.name;
    this.artifactId = data.artifactId;
    this.profiles = data.profiles;
    this.pom = data.pom;
    this.parentPom = data.parentPom || null;
  }

  static async load(dir: string): Promise<MavenModule | null> {
    const pomPath = path.join(dir, "pom.xml");
    const parentPomPath = path.join(dir, "..", "pom.xml");
    try {
      await fs.access(pomPath);
      const pom = parsePom(pomPath);
      const parentPom = fsSync.existsSync(parentPomPath)
        ? parsePom(parentPomPath)
        : null;
      const artifactId = path.basename(dir);
      const mavenModule = new MavenModule({
        absolutePath: dir,
        name: path.basename(dir),
        artifactId,
        profiles: [],
        pom,
        parentPom,
      });
      mavenModule.loadProfiles();
      return mavenModule;
    } catch (err) {
      console.error(`Failed to load Maven module at ${pomPath}:`, err);
      return null;
    }
  }

  static readonly PROFILE_RESOLVER_MAP: Record<
    string,
    (this: MavenModule) => boolean
  > = {
    autoInstallPackage: MavenModule.prototype.hasAutoInstallPackage,
    autoInstallSinglePackage: MavenModule.prototype.hasAutoInstallSinglePackage,
    autoInstallBundle: MavenModule.prototype.hasAutoInstallBundle,
    // Add more mappings as needed
  };

  loadProfiles(): void {
    this.profiles = [];
    for (const [profileId, checker] of Object.entries(
      MavenModule.PROFILE_RESOLVER_MAP
    )) {
      if (checker.call(this)) {
        this.profiles.push(profileId);
      }
    }
  }

  private toArray<T>(val: T | T[] | undefined): T[] {
    if (!val) {
      return [];
    }
    return Array.isArray(val) ? val : [val];
  }

  public hasAutoInstallPackage(): boolean {
    const pom = this.pom || {};
    const packaging = pom.project?.packaging;
    const pluginsArr = this.toArray(pom.project?.build?.plugins?.plugin);
    return (
      packaging === "content-package" &&
      pluginsArr.some(
        (p: any) =>
          p?.artifactId === "content-package-maven-plugin" ||
          p?.artifactId === "filevault-package-maven-plugin"
      )
    );
  }
  public hasAutoInstallSinglePackage(): boolean {
    const pom = this.pom || {};
    const moduleProfiles = this.toArray(pom.project?.profiles?.profile);
    // If the module has the profile, return true
    if (
      moduleProfiles.some(
        (prof: any) => prof?.id === "autoInstallSinglePackage"
      )
    ) {
      return true;
    }
    // Always add autoInstallSinglePackage for root pom (parentPom === null)
    if (this.parentPom === null) {
      return true;
    }
    return false;
  }
  public hasAutoInstallBundle(): boolean {
    const pom = this.pom || {};
    const parentPom = this.parentPom || {};
    const packaging = pom.project?.packaging;
    const parentProfiles = this.toArray(parentPom.project?.profiles?.profile);
    const hasProfile = parentProfiles.some(
      (prof: any) => prof?.id === "autoInstallBundle"
    );
    return hasProfile && packaging !== "content-package";
  }
}

export function parsePom(pomPath: string): any {
  try {
    fsSync.accessSync(pomPath);
    const content = fsSync.readFileSync(pomPath, "utf-8");
    const parser = new XMLParser();
    return parser.parse(content);
  } catch {
    return {};
  }
}

export * from "./types";
