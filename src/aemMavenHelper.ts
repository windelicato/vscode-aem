import * as path from 'path';
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { PomModule } from './PomModule';

export class AemMavenHelper {
  // Private fields
  private _cwd: string = '';
  private _flags: string[] = [];
  private _modules: PomModule[] = [];
  private _targetModule?: string;
  private _error?: string;

  // Only these are public
  constructor(cwd?: string) {
    if (cwd) {
      this._cwd = cwd;
    } else {
      this._cwd = process.cwd();
    }
    this.findModules(this._cwd);
  }

  public getError(): string | undefined { return this._error; }

  public parseInputArgs(input: string, opts?: { skipTests?: boolean; dryRun?: boolean }) {
    const args = input.trim().split(/\s+/);
    let moduleName: string | undefined;
    const flags: string[] = [];
    let skipTestsOverride: boolean | undefined = opts?.skipTests;
    let dryRunOverride: boolean | undefined = opts?.dryRun;
    for (const arg of args) {
      if (arg.startsWith('--')) {
        if (arg === '--build' || arg === '--all') {
          flags.push(arg);
        } else if (arg === '--skip-tests') {
          skipTestsOverride = true;
        } else if (arg === '--dry-run') {
          dryRunOverride = true;
        }
      } else if (!moduleName) {
        this._targetModule = arg;
      }
    }
    this._flags = flags;
    // Store settings for skipTests and dryRun, allowing CLI override
    (this as any)._settings = {
      skipTests: skipTestsOverride,
      dryRun: dryRunOverride
    };
  }

  public buildCommand(): { command: string, directory: string, error?: string } {
    let command = '';
    let directory = '';
    let targetModule: PomModule | undefined;
    this._error = undefined;

    // Find the target module based on flags and input
    if (this._flags.includes('--all')) {
      targetModule = this._modules.find(m => m.name === 'all');
    } else if (this._targetModule) {
      targetModule = this._modules.find(m => m.name === this._targetModule);
    } else {
      // If no target specified, find the module whose absolutePath is a parent of cwd and has the longest matching path
      const cwdResolved = path.resolve(this._cwd);
      const isParent = (parent: string, child: string) => {
        const rel = path.relative(parent, child);
        return !rel.startsWith('..') && !path.isAbsolute(rel);
      };
      targetModule = this._modules.reduce((best, mod) => {
        const modPath = path.resolve(mod.absolutePath);
        if (isParent(modPath, cwdResolved)) {
          if (!best || modPath.length > path.resolve(best.absolutePath).length) {
            return mod;
          }
        }
        return best;
      }, undefined as PomModule | undefined) || this._modules.find(m => m.isRoot);
      // If resolved to root pom, prefer 'all' module if it exists
      if (targetModule && targetModule.isRoot) {
        const allModule = this._modules.find(m => m.name === 'all');
        if (allModule) {
          targetModule = allModule;
        }
      }
    }

    if (!targetModule) {
      this._error = 'Could not determine target module.';
      return { command: '', directory: '', error: this._error };
    }

    directory = targetModule.absolutePath;

    // Build the base command
    if (this._flags.includes('--build')) {
      command = 'mvn clean install';
    } else if (targetModule.profiles && targetModule.profiles.length > 0) {
      command = `mvn clean install -P${targetModule.profiles[0]}`;
    } else {
      this._error = 'No Maven profiles found for this module. Please check your pom.xml.';
      return { command: '', directory, error: this._error };
    }

    // Add skip tests if setting is enabled
    const settings = (this as any)._settings || {};
    if (settings.skipTests) {
      command += ' -DskipTests';
    }

    // Handle dry-run if setting is enabled
    if (settings.dryRun) {
      command = `echo [DRY RUN] Would run: ${command} in ${directory}`;
    }

    return { command, directory, error: this._error };
  }


  // Find root pom by traversing up until we find a pom.xml with <modules>
  // Sets this.rootModule and this.modules
  private findModules(startDir: string): void {
    let dir = path.resolve(startDir);
    const rootPath = path.parse(dir).root;
    this._modules = [];
    while (dir !== rootPath) {
      const pomPath = path.join(dir, 'pom.xml');
      if (fs.existsSync(pomPath)) {
        try {
          const pomContent = fs.readFileSync(pomPath, 'utf8');
          const parser = new XMLParser();
          const pom = parser.parse(pomContent);
          if (pom.project && pom.project.modules) {
            // Create root PomModule and mark as root
            const rootModule = new PomModule({
              absolutePath: dir,
              relativePath: '.',
              name: path.basename(dir),
              artifactId: pom.project.artifactId,
            }) as any;
            rootModule.isRoot = true;
            this._modules = [rootModule];
            // Collect child modules
            let moduleNames = pom.project.modules.module;
            if (typeof moduleNames === 'string') { moduleNames = [moduleNames]; }
            if (Array.isArray(moduleNames)) {
              for (const modName of moduleNames) {
                const absPath = path.join(dir, modName);
                let childArtifactId = modName;
                // Try to read the artifactId from the child's pom.xml (not the parent)
                const childPomPath = path.join(absPath, 'pom.xml');
                if (fs.existsSync(childPomPath)) {
                  try {
                    const childPomContent = fs.readFileSync(childPomPath, 'utf8');
                    const childPom = parser.parse(childPomContent);
                    if (childPom.project && childPom.project.artifactId) {
                      childArtifactId = childPom.project.artifactId;
                    }
                  } catch (e) {
                    // ignore parse errors, fallback to modName
                  }
                }
                const childModule = new PomModule({
                  absolutePath: absPath,
                  relativePath: modName,
                  name: modName,
                  artifactId: childArtifactId
                }) as any;
                childModule.isRoot = false;
                this._modules.push(childModule);
              }
            }
            return;
          }
        } catch (e) {
          // ignore parse errors, keep traversing
        }
      }
      dir = path.dirname(dir);
    }
    // If not found, set to empty
    this._modules = [];
  }
}
