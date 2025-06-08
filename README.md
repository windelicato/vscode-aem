# vscode-aem

<img src="images/logo.png" width="120" alt="AEM Maven Helper Logo" />

AEM Maven Helper for Visual Studio Code

## Features

- **Automatic Maven module and profile detection** for AEM projects (including deep directory detection)
- **Profile selection** matching AEM best practices: autoInstallSinglePackage, autoInstallPackage, autoInstallBundle, and content-package detection
- **Run Maven commands** for the correct module based on your current file or directory
- **VS Code settings** for `skipTests` and `dryRun` (can be overridden per command)
- **Command-line overrides** for `--skip-tests` and `--dry-run` in the input box
- **Error handling and user feedback** for missing modules, profiles, or misconfigurations
- **Works with multi-module AEM Maven projects** (including archetype-based projects)

## Requirements

- Java and Maven installed and available in your PATH
- AEM Maven project (archetype or similar structure)

## Extension Settings

This extension contributes the following settings:

- `aemMavenHelper.skipTests`: Skip running tests during Maven build (`-DskipTests`). Default: `false`.
- `aemMavenHelper.dryRun`: Show the Maven command that would be run, but do not execute it. Default: `false`.

You can override these settings per command by adding `--skip-tests` or `--dry-run` in the input box.

## Usage

1. Open your AEM Maven project in VS Code.
2. Open the Command Palette and run `AEM Maven Helper` (or use the command: `vscode-aem.mvn`).
3. Enter the module name and any flags (e.g. `ui.apps --build --skip-tests`).
   - Leave blank to auto-detect the module based on your current file/directory.
   - Use `--build` to force a full build (no profile).
   - Use `--all` to build the `all` module if present.
   - Use `--skip-tests` and/or `--dry-run` to override settings for this run.
4. The extension will run the correct Maven command in the integrated terminal, or show you the command if dry run is enabled.

## Example

- From a file in `ui.apps`, running with no arguments will build `ui.apps` with the correct profile.
- From a deep directory (e.g. `ui.apps/deep/nested`), the extension will still detect and build the correct parent module.
- From anywhere, you can run `core --skip-tests --dry-run` to see the Maven command for the core bundle, skipping tests and not executing.

## Running from the Shell (CLI)

You can also use the included `run-aem-helper.js` script to run the same Maven logic from your terminal:

1. **Make it executable:**
   ```sh
   chmod +x run-aem-helper.js
   ```
2. **(Optional) Add to your PATH:**
   Add this to your `~/.zshrc` or `~/.bashrc`:
   ```sh
   export PATH="/Users/wei66/src/aem/vscode-aem:$PATH"
   ```
   Then reload your shell:
   ```sh
   source ~/.zshrc
   # or
   source ~/.bashrc
   ```
3. **Run from anywhere:**
   ```sh
   run-aem-helper.js "ui.apps --build --skip-tests"
   # or from a deep directory, just run with no args to auto-detect the module
   run-aem-helper.js
   ```

You can also rename the script (e.g. to `aem-maven`) for convenience.

## Known Issues

- Only supports Maven-based AEM projects with standard archetype structure.
- Profile detection relies on standard naming and plugin usage.

## Release Notes

### 0.0.1
- Initial release: robust module/profile detection, settings, CLI overrides, and error handling.

---

**Enjoy fast, error-free AEM Maven builds in VS Code and your shell!**
