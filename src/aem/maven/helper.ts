import * as path from 'path';
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { PomModule } from './pomModule';
import { getMavenConfig } from './config';

export class AemMavenHelper {
  // Store last error statically
  private static _error?: string;

  private static showError(msg: string) {
    AemMavenHelper._error = msg;
    try {
      // @ts-ignore
      if (typeof vscode !== 'undefined' && vscode.window && vscode.window.showErrorMessage) {
        // @ts-ignore
        vscode.window.showErrorMessage(msg);
      } else {
        console.error(msg);
      }
    } catch {
      console.error(msg);
    }
  }

  static getError(): string | undefined { return this._error; }

  static parseInputArgs(input: string) {
    const args = input.trim().split(/\s+/);
    let targetModule: string | undefined;
    const flags: string[] = [];
    let skipTestsOverride: boolean | undefined = undefined;
    let dryRunOverride: boolean | undefined = undefined;
    let defaultGoalOverride: 'build' | 'install' | undefined = undefined;
    for (const arg of args) {
      if (arg === 'install' || arg === 'build') {
        flags.push('--build');
        defaultGoalOverride = arg as 'build' | 'install';
      } else if (arg === 'all') {
        flags.push('--all');
      } else if (arg === 'skip-tests' || arg === '--skip-tests') {
        skipTestsOverride = true;
      } else if (arg === 'dry-run' || arg === '--dry-run') {
        dryRunOverride = true;
      } else if (!arg.startsWith('-') && !targetModule) {
        targetModule = arg;
      }
    }
    // Merge with config here
    const mavenConfig = getMavenConfig();
    const skipTests = skipTestsOverride !== undefined ? skipTestsOverride : mavenConfig.skipTests;
    const dryRun = dryRunOverride !== undefined ? dryRunOverride : mavenConfig.dryRun;
    const defaultGoal = defaultGoalOverride !== undefined ? defaultGoalOverride : mavenConfig.defaultGoal;
    return {
      targetModule,
      flags,
      settings: {
        skipTests,
        dryRun,
        defaultGoal
      }
    };
  }

  static buildCommand({ cwd, input }: { cwd: string, input: string }): { command: string, directory: string, error?: string } {
    this._error = undefined;
    const { targetModule, flags, settings } = this.parseInputArgs(input);
    const modules = this.findModules(cwd);
    let target: PomModule | undefined;
    if (flags.includes('--all')) {
      target = modules.find(m => m.name === 'all');
    } else if (targetModule) {
      target = modules.find(m => m.name === targetModule);
    } else {
      const cwdResolved = path.resolve(cwd);
      const isParent = (parent: string, child: string) => {
        const rel = path.relative(parent, child);
        return !rel.startsWith('..') && !path.isAbsolute(rel);
      };
      target = modules.reduce((best, mod) => {
        const modPath = path.resolve(mod.absolutePath);
        if (isParent(modPath, cwdResolved)) {
          if (!best || modPath.length > path.resolve(best.absolutePath).length) {
            return mod;
          }
        }
        return best;
      }, undefined as PomModule | undefined) || modules.find(m => m.isRoot);
      if (target && target.isRoot) {
        const allModule = modules.find(m => m.name === 'all');
        if (allModule) {
          target = allModule;
        }
      }
    }
    if (!target) {
      this.showError('Could not determine target module.');
      return { command: '', directory: '', error: this._error };
    }
    let command = '';
    let directory = target.absolutePath;
    if (flags.includes('--build')) {
      command = settings.defaultGoal === 'build' ? 'mvn clean install' : 'mvn install';
    } else if (target.profiles && target.profiles.length > 0) {
      command = `mvn clean install -P${target.profiles[0]}`;
    } else {
      this.showError('No Maven profiles found for this module. Please check your pom.xml.');
      return { command: '', directory, error: this._error };
    }
    if (settings.skipTests) {
      command += ' -DskipTests';
    }
    if (settings.dryRun) {
      command = `echo [DRY RUN] Would run: ${command} in ${directory}`;
    }
    return { command, directory, error: this._error };
  }

  // Find root pom by traversing up until we find a pom.xml with <modules>
  // Returns array of PomModule
  static findModules(startDir: string): PomModule[] {
    let dir = path.resolve(startDir);
    const rootPath = path.parse(dir).root;
    const modules: PomModule[] = [];
    while (dir !== rootPath) {
      const pomPath = path.join(dir, 'pom.xml');
      if (fs.existsSync(pomPath)) {
        try {
          const pomContent = fs.readFileSync(pomPath, 'utf8');
          const parser = new XMLParser();
          const pom = parser.parse(pomContent);
          if (pom.project && pom.project.modules) {
            const rootModule = new PomModule({
              absolutePath: dir,
              relativePath: '.',
              name: path.basename(dir),
              artifactId: pom.project.artifactId,
            }) as any;
            rootModule.isRoot = true;
            modules.push(rootModule);
            let moduleNames = pom.project.modules.module;
            if (typeof moduleNames === 'string') { moduleNames = [moduleNames]; }
            if (Array.isArray(moduleNames)) {
              for (const modName of moduleNames) {
                const absPath = path.join(dir, modName);
                let childArtifactId = modName;
                const childPomPath = path.join(absPath, 'pom.xml');
                if (fs.existsSync(childPomPath)) {
                  try {
                    const childPomContent = fs.readFileSync(childPomPath, 'utf8');
                    const childPom = parser.parse(childPomContent);
                    if (childPom.project && childPom.project.artifactId) {
                      childArtifactId = childPom.project.artifactId;
                    }
                  } catch {}
                }
                const childModule = new PomModule({
                  absolutePath: absPath,
                  relativePath: modName,
                  name: modName,
                  artifactId: childArtifactId
                }) as any;
                childModule.isRoot = false;
                modules.push(childModule);
              }
            }
            return modules;
          }
        } catch {}
      }
      dir = path.dirname(dir);
    }
    return modules;
  }
}
