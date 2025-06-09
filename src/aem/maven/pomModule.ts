import * as path from 'path';
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export class PomModule {
  absolutePath: string;
  relativePath: string;
  name: string; // directory name
  artifactId: string; // from pom.xml
  profiles: string[];
  isRoot: boolean;

  constructor(params: {
    absolutePath: string;
    relativePath: string;
    name: string;
    artifactId: string;
    profiles?: string[];
    isRoot?: boolean;
  }) {
    this.absolutePath = params.absolutePath;
    this.relativePath = params.relativePath;
    this.name = params.name;
    this.artifactId = params.artifactId;
    this.profiles = params.profiles || [];
    this.isRoot = params.isRoot ?? false;
    this.findProfiles(); // Find profiles on construction
  }

  findProfiles() {
    const pomPath = path.join(this.absolutePath, 'pom.xml');
    const parentPomPath = path.join(this.absolutePath, '..', 'pom.xml');
    if (!fs.existsSync(pomPath)) {
      this.profiles = [];
      return;
    }
    const pomContent = fs.readFileSync(pomPath, 'utf8');
    let parentPomContent = '';
    if (fs.existsSync(parentPomPath)) {
      parentPomContent = fs.readFileSync(parentPomPath, 'utf8');
    }
    const parser = new XMLParser();
    let pom: any = {};
    let parentPom: any = {};
    try {
      pom = parser.parse(pomContent);
    } catch (e) {}
    try {
      parentPom = parser.parse(parentPomContent);
    } catch (e) {}

    const profiles: string[] = [];
    // 1. Prefer autoInstallSinglePackage if present in module
    const moduleProfiles = pom.project?.profiles?.profile;
    const moduleProfilesArr = Array.isArray(moduleProfiles) ? moduleProfiles : moduleProfiles ? [moduleProfiles] : [];
    if (moduleProfilesArr.some((prof: any) => prof.id === 'autoInstallSinglePackage')) {
      profiles.push('autoInstallSinglePackage');
    }
    // Always add autoInstallSinglePackage for root pom
    if (this.isRoot && !profiles.includes('autoInstallSinglePackage')) {
      profiles.push('autoInstallSinglePackage');
    }
    // 2. Prefer autoInstallPackage if present in module
    if (moduleProfilesArr.some((prof: any) => prof.id === 'autoInstallPackage')) {
      profiles.push('autoInstallPackage');
    }
    // 3. If no specific profile, check content-package conditions
    const packaging = pom.project?.packaging;
    const plugins = pom.project?.build?.plugins?.plugin;
    const pluginsArr = Array.isArray(plugins) ? plugins : plugins ? [plugins] : [];
    if (
      packaging === 'content-package' &&
      pluginsArr.some((p: any) =>
        p.artifactId === 'content-package-maven-plugin' ||
        p.artifactId === 'filevault-package-maven-plugin')
    ) {
      if (!profiles.includes('autoInstallPackage')) {
        profiles.push('autoInstallPackage');
      }
    }
    // 4. Prefer autoInstallBundle for bundles (with sling-maven-plugin and not content-package)
    const parentProfiles = parentPom.project?.profiles?.profile;
    const parentProfilesArr = Array.isArray(parentProfiles) ? parentProfiles : parentProfiles ? [parentProfiles] : [];
    const hasAutoInstallBundle = parentProfilesArr.some((prof: any) => prof.id === 'autoInstallBundle');
    const hasSlingMavenPlugin = pluginsArr.some((p: any) => p.artifactId === 'sling-maven-plugin');
    if (hasAutoInstallBundle && hasSlingMavenPlugin) {
      profiles.push('autoInstallBundle');
    }
    this.profiles = profiles;
  }
}
