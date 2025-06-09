# vscode-aem

<p align="center">
  <img src="images/logo.png" width="120" alt="AEM Maven Helper Logo" style="margin-bottom: 1em;"/>
</p>

AEM for Visual Studio Code

> **Note:** This extension is only tested with AEM as a Cloud Service projects and SDKs. Compatibility with older AEM versions or on-premise SDKs is not guaranteed.

## Motivation

Managing local AEM development can be frustrating and error-prone:

- You often need to juggle multiple terminal windows or tabs to control both Author and Publisher instances.
- Each AEM update requires copying and extracting new Quickstart JARs and Forms add-ons into the right directories.
- It's easy to forget to update both instances, or to miss a step when setting up a new environment.
- You frequently have to `cd` into the correct Maven module directory to build or deploy, which interrupts your workflow.
- Running a Maven build in the wrong directory wastes time trying to figure out why your changes didn't update in AEM.
- Switching Maven flags (like `-DskipTests`, `-PautoInstallPackage`, etc.) after every update or for different modules is tedious and error-prone.
- Log tailing, status checks, and restarts require repetitive manual commands for each instance.

These scripts and VS Code tasks are designed to automate and simplify all of these pain points, so you can focus on development instead of environment management.


> **Why not just use the existing Maven plugins for VS Code?**
>
> Existing Maven plugins are not context-aware for AEM projects: they don't detect the correct module based on your file, don't handle AEM-specific profiles, and don't automate multi-instance SDK management. This extension is purpose-built for the AEM developer workflow.

That being said, I developed this for personal use, so don't expect it to be as robust or polished as official extensions.

## Features

- Detects the correct Maven module and profile for AEM projects, even from deep directories
- Lets you run Maven commands for the right module based on your current file or folder
- Supports common AEM profiles and multi-module projects
- Simple word-based command-line options (e.g. `skip-tests`, `dry-run`)
- Handles AEM SDK setup, start, stop, status, and log for local instances
- Allows per-instance debug configuration
- Groups all AEM commands under a single menu in the Command Palette
- Includes integration and unit tests for SDK and Maven logic

## Requirements

- Java and Maven installed and available in your PATH
- AEM Maven project (archetype or similar structure)

## Extension Settings

This extension contributes the following settings:

- `aemMavenHelper.skipTests`: Skip running tests during Maven build (`-DskipTests`). Default: `false`.
- `aemMavenHelper.dryRun`: Show the Maven command that would be run, but do not execute it. Default: `false`.
- `aem.sdkHome`: Path to your AEM SDK home directory. Used for SDK setup/start/stop/status/log commands.
- `aem.quickstartPath`: Path to the AEM Quickstart JAR or ZIP file for SDK setup.
- `aem.formsAddonPath`: Path to the AEM Forms Add-on file for SDK setup (optional).
- `aem.instances`: Array of AEM instance configs (name, port, debugPort, debug). Supports per-instance debug configuration.
- `aem.passwordFile`: Name of the password file to create in each instance directory (default: `aem-password`).
- `aem.jvmOpts`: JVM options to use when starting AEM instances.
- `aem.jvmDebugBaseOpts`: JVM debug options to use when starting instances in debug mode.

## Setting Up a Local AEM Instance (First Time)

Follow these steps to set up your local AEM SDK instance using this extension:

1. **Download the AEM SDK Quickstart JAR/ZIP and (optionally) the Forms Add-on** from the [Adobe Software Distribution portal](https://experience.adobe.com/#/downloads/content/software-distribution/en/aemcloud.html).
2. **Configure the extension settings** (in VS Code, open Settings and search for "AEM"):
   - Set `aem.sdkHome` to the directory where you want your AEM SDK(s) to live (e.g. `/Users/you/aem-sdk`).
   - (Optional) Edit `aem.instances` to configure instance names, ports, and debug settings.
3. **Run the SDK Setup command:**
   - Open the Command Palette (Cmd+Shift+P) and run `AEM: SDK Setup`.
   - If `aem.quickstartPath` or `aem.formsAddonPath` are not set, you will be prompted to provide the path(s) to your Quickstart JAR/ZIP and (optionally) the Forms Add-on file via a file dialog. The Forms Add-on is optional and can be skipped.
   - The extension will extract the Quickstart and Forms Add-on into the correct directories for each instance.
   - You will see progress and error messages in the VS Code output panel.
4. **Start your AEM instances:**
   - Run `AEM: SDK Start` from the Command Palette.
   - The extension will start all configured instances, applying any debug or JVM options as configured.
5. **Check status and logs:**
   - Use `AEM: SDK Status` to see which instances are running.
   - Use `AEM: SDK Log` to view logs for any instance.

> **Tip:** You only need to run SDK Setup again if you update the Quickstart or Forms Add-on files, or want to reset your local SDK environment.


## Commands

This extension provides the following commands (all available from the Command Palette under the "AEM" submenu):

- **AEM: SDK Setup** (`aem.sdk.setup`): Set up the AEM SDK in the configured home directory. Prompts for Quickstart and Forms Add-on files if not configured.
- **AEM: SDK Start** (`aem.sdk.start`): Start all configured AEM SDK instances. Handles per-instance debug config and JVM options.
- **AEM: SDK Stop** (`aem.sdk.stop`): Stop all running AEM SDK instances.  
  _Note: Stopping AEM can take up to a minute to complete, as the process waits for a clean shutdown._
- **AEM: SDK Status** (`aem.sdk.status`): Show the status of all configured AEM SDK instances.
- **AEM: SDK Log** (`aem.sdk.log`): Show logs for a selected AEM SDK instance.
- **AEM Maven Helper** (`vscode-aem.mvn`): Run Maven commands for the correct module/profile based on your current file or directory.

All commands are accessible from the Command Palette (Cmd+Shift+P) and are grouped under the "AEM" submenu for easy access.

## Usage

1. Open your AEM Maven project in VS Code.
2. Open the Command Palette and run `AEM Maven Helper` (or use the command: `vscode-aem.mvn`).
3. Enter the module name and any options (e.g. `ui.apps build skip-tests`).
   - Leave blank to auto-detect the module based on your current file/directory.
   - Use `build` to force a full build (no profile).
   - Use `all` to build the `all` module if present.
   - Use `skip-tests` and/or `dry-run` to override settings for this run.
4. The extension will run the correct Maven command in the integrated terminal, or show you the command if dry run is enabled.

## Example

- From a file in `ui.apps`, running with no arguments will build `ui.apps` with the correct profile.
- From a deep directory (e.g. `ui.apps/deep/nested`), the extension will still detect and build the correct parent module.
- From anywhere, you can run `core skip-tests dry-run` to see the Maven command for the core bundle, skipping tests and not executing.

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
   run-aem-helper.js "ui.apps build skip-tests"
   # or from a deep directory, just run with no args to auto-detect the module
   run-aem-helper.js
   ```

You can also rename the script (e.g. to `aem-maven`) for convenience.

**Note:** All arguments are now parsed as plain words (e.g. `ui.apps build skip-tests`), not as flags with `--`. You can enter module names and options as space-separated words. For example:

- `ui.apps build skip-tests` (builds the `ui.apps` module, skipping tests)
- `core dry-run` (shows the Maven command for the core bundle, does not execute)
- `all` (builds the `all` module if present)

## Known Issues

- Only supports Maven-based AEM projects with standard archetype structure.
- Profile detection relies on standard naming and plugin usage.
- On macOS, even with `-Djava.awt.headless=true`, the Java Dock/taskbar icon may still appear when starting AEM for the first time. This is a limitation of the JVM/AEM startup. To fully suppress the icon, add `-Dapple.awt.UIElement=true` to your JVM options (see extension settings or your `aem.jvmOpts`).

## Release Notes

### 0.0.2
- Major refactor for maintainability, modularity, and TypeScript best practices.
- Robust, user-friendly AEM SDK setup, start, stop, status, and log commands with improved error handling and per-instance debug config.
- All Maven command options now parsed from input string; config values for skipTests, dryRun, and defaultGoal are respected and overridable.
- Modularized helpers for extraction, file copying, and error handling.
- Improved command palette/menu structure: all AEM commands are grouped under the "AEM" submenu.
- Comprehensive, organized tests for Maven and SDK logic, including file system and VS Code API mocking.
- Integration-style tests for SDK setup and start using real temporary directories for reliable file system assertions.
- Fixed TypeScript errors in test stubs and mocks; increased test timeouts for async/mocked FS operations.
- Removed legacy/opts-based logic and top-level mock-fs calls to avoid ENOENT errors.
- Improved documentation and code comments throughout the codebase.

### 0.0.1
- Initial release: robust module/profile detection, settings, CLI overrides, and error handling.

---

**Enjoy fast, error-free AEM Maven builds in VS Code and your shell!**
