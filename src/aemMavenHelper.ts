import * as path from 'path';
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export class AemMavenHelper {
  workspaceRoot: string;
  startDir: string;

  constructor(workspaceRoot: string, startDir: string) {
    this.workspaceRoot = workspaceRoot;
    this.startDir = startDir;
  }

  findModulePom(): string | null {
    let currentDir = this.workspaceRoot;
    const relPath = path.relative(this.workspaceRoot, this.startDir);
    if (!relPath || relPath === '') {
      const pomPath = path.join(currentDir, 'pom.xml');
      return fs.existsSync(pomPath) ? currentDir : null;
    }
    const segments = relPath.split(path.sep);
    const parser = new XMLParser();
    for (const segment of segments) {
      const pomPath = path.join(currentDir, 'pom.xml');
      if (!fs.existsSync(pomPath)) { return null; }
      const pomContent = fs.readFileSync(pomPath, 'utf8');
      let modules: string[] = [];
      try {
        const pom = parser.parse(pomContent);
        const rawModules = pom.project?.modules?.module;
        if (Array.isArray(rawModules)) {
          modules = rawModules;
        } else if (typeof rawModules === 'string') {
          modules = [rawModules];
        }
      } catch (e) {
        return null;
      }
      if (!modules.includes(segment)) {
        return null;
      }
      currentDir = path.join(currentDir, segment);
    }
    const finalPom = path.join(currentDir, 'pom.xml');
    return fs.existsSync(finalPom) ? currentDir : null;
  }

  selectProfile(moduleDir: string): string | null {
    const pomPath = path.join(moduleDir, 'pom.xml');
    const parentPomPath = path.join(moduleDir, '..', 'pom.xml');
    if (!fs.existsSync(pomPath)) { return null; }
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

    const profiles = pom.project?.profiles?.profile;
    const profilesArr = Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
    for (const prof of profilesArr) {
      if (prof.id === 'autoInstallSinglePackage') {
        return '-PautoInstallSinglePackage';
      }
    }
    for (const prof of profilesArr) {
      if (prof.id === 'autoInstallPackage') {
        return '-PautoInstallPackage';
      }
    }
    const packaging = pom.project?.packaging;
    const plugins = pom.project?.build?.plugins?.plugin;
    const pluginsArr = Array.isArray(plugins) ? plugins : plugins ? [plugins] : [];
    if (packaging === 'content-package' && pluginsArr.some((p: any) => p.artifactId === 'content-package-maven-plugin' || p.artifactId === 'filevault-package-maven-plugin')) {
      return '-PautoInstallPackage';
    }
    const parentProfiles = parentPom.project?.profiles?.profile;
    const parentProfilesArr = Array.isArray(parentProfiles) ? parentProfiles : parentProfiles ? [parentProfiles] : [];
    const hasAutoInstallBundle = parentProfilesArr.some((prof: any) => prof.id === 'autoInstallBundle');
    const hasSlingMavenPlugin = pluginsArr.some((p: any) => p.artifactId === 'sling-maven-plugin');
    if (hasAutoInstallBundle && hasSlingMavenPlugin) {
      return '-PautoInstallBundle';
    }
    return null;
  }

  buildCommand(input: string): { moduleDir: string | null, mvnCmd: string, error?: string } {
    let moduleDir = this.findModulePom();
    if (this.startDir === this.workspaceRoot) {
      moduleDir = path.join(this.workspaceRoot, 'all');
    }
    if (!moduleDir) {
      return { moduleDir: null, mvnCmd: '', error: 'Could not find a pom.xml from current directory.' };
    }
    let mvnCmd = 'mvn clean install';
    let mvnCmdOpts = '';
    if (!input.includes('--build')) {
      const profile = this.selectProfile(moduleDir);
      if (profile) {
        mvnCmdOpts += ' ' + profile;
      } else {
        return { moduleDir, mvnCmd: '', error: "'install' command requires autoInstallSinglePackage, autoInstallBundle, or autoInstallPackage profile in pom.xml or its parent." };
      }
    }
    if (input.includes('--skip-tests')) {
      mvnCmdOpts += ' -DskipTests';
    }
    return { moduleDir, mvnCmd: (mvnCmd + mvnCmdOpts).trim() };
  }

  static parseArgs(input: string): { moduleArg?: string, flags: string[] } {
    const args = input.trim().split(/\s+/);
    let moduleArg: string | undefined;
    const flags: string[] = [];
    for (const arg of args) {
      if (arg.startsWith('--')) {
        flags.push(arg);
      } else if (!moduleArg) {
        moduleArg = arg;
      }
    }
    return { moduleArg, flags };
  }
}
