# vscode-aem

<p align="center">
  <img src="images/logo.png" width="120" alt="AEM Maven Helper Logo" style="margin-bottom: 1em;"/>
</p>
<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=windelicato.vscode-aem">
    <img src="https://img.shields.io/visual-studio-marketplace/v/windelicato.vscode-aem?label=VS%20Code%20Marketplace" alt="VS Code Marketplace" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=windelicato.vscode-aem">
    <img src="https://img.shields.io/visual-studio-marketplace/d/windelicato.vscode-aem?label=Installs" alt="Installs" />
  </a>
  <a href="https://github.com/windelicato/vscode-aem/actions/workflows/publish.yml">
   <img src="https://github.com/windelicato/vscode-aem/actions/workflows/publish.yml/badge.svg" alt="Build Status" />
  </a>
  <a href="https://github.com/windelicato/vscode-aem/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/windelicato/vscode-aem.svg" alt="License" />
  </a>
  <a href="https://github.com/windelicato/vscode-aem">
    <img src="https://img.shields.io/github/stars/windelicato/vscode-aem?style=social" alt="GitHub stars" />
  </a>
</p>

Lightweight tools for working with AEM projects and SDKs inside Visual Studio Code.

> **Note:** This extension is designed for AEM as a Cloud Service projects. Compatibility with older or on-premise AEM versions is not guaranteed.

## Features

- **Context-aware Maven module and profile detection**
  Detects the correct Maven module and profile based on the current file or directory.

- **Build and deploy commands**
  Provides commands to build or deploy specific modules using standard AEM profiles (`autoInstallSinglePackage`, `autoInstallPackage`, `autoInstallBundle`).

- **Flexible build options**
  Supports optional flags like `skip-tests` and `dry-run` via the command palette or terminal.

- **AEM SDK instance management**
  Start, stop, and monitor local AEM SDK instances (author/publish) with configurable ports and debug settings.

- **SDK extraction and setup**
  Extract and install the AEM SDK Quickstart and optional Forms Add-on.

- **Instance status and log tailing**
  View running status and logs directly in VS Code.

- **Project and module scaffolding**
  Scaffold new AEM projects and modules using the Adobe Maven archetype.

- **CLI integration**
  Includes an optional CLI script to run Maven commands outside of VS Code with the same logic.

---

## Requirements

- Java and Maven installed and available in your `PATH`
- AEM Maven project (archetype or similar structure)

---

## Getting Started

Open your AEM Maven project in VS Code and run the `AEM Maven Helper` command from the Command Palette (`Cmd+Shift+P`).

You can leave the input blank to auto-detect the module based on your current file, or specify a module and options directly (e.g., `ui.apps skip-tests`).

This is the fastest way to trigger a build or deployment using the correct profile without needing to navigate manually.

---

## AEM Maven Helper

Use the `AEM Maven Helper` command to run Maven builds based on the file or folder you’re working in.

### Usage

1. Open your AEM Maven project in VS Code.
2. Run `AEM Maven Helper` from the Command Palette.
3. Enter module name and options (e.g., `ui.apps build skip-tests`).

   - Leave blank to auto-detect the module.
   - Use `build` to build without install profile.
   - Use `all` to build the `all` module.
   - Add `skip-tests` or `dry-run` as needed.

4. The extension will run or display the appropriate Maven command.

### Example

- From inside `ui.apps`, no input will build it with the correct profile.
- From `ui.apps/some/nested/path`, it will detect and build the right parent module.
- Run `core skip-tests dry-run` to preview the command for `core` without executing.

---

## AEM SDK Helper

### Setting Up a Local AEM Instance (First Time)

1. **Download the AEM SDK Quickstart and (optionally) the Forms Add-on**
   From the [Adobe Software Distribution portal](https://experience.adobe.com/#/downloads/content/software-distribution/en/aemcloud.html).

2. **Configure extension settings**

   - Set `aemSDK.home` to the directory where SDKs should be installed (e.g. `/Users/you/aem-sdk`).
   - (Optional) Edit `aemSDK.instances` to configure instance names, ports, and debug options.

3. **Run the SDK Setup command**

   - Open the Command Palette and run `AEM: SDK Setup`.
   - If `aemSDK.quickstartPath` or `aemSDK.formsAddonPath` are not configured, you’ll be prompted to select files.
   - The extension will extract and configure the SDK for each instance.

4. **Start your AEM instances**

   - Run `AEM: SDK Start` from the Command Palette.

5. **Check instance status and logs**

   - Use `AEM: SDK Status` and `AEM: SDK Log` as needed.

> **Tip:** Only re-run SDK Setup if updating the Quickstart or Forms Add-on.

### SDK Commands

| Command           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `AEM: SDK Setup`  | Extracts and configures the AEM SDK and Forms Add-on |
| `AEM: SDK Start`  | Starts configured AEM SDK instances                  |
| `AEM: SDK Stop`   | Gracefully stops running instances                   |
| `AEM: SDK Status` | Displays current status of all instances             |
| `AEM: SDK Log`    | Opens instance log in the editor                     |

---

## AEM Scaffolding Helper

Use the `AEM: Scaffold` command to create new AEM projects or modules with Adobe’s official archetype.

### Scaffolding Commands

- **AEM Scaffold** (`vscode-aem.scaffold`)
  Launches an interactive prompt to scaffold a new AEM project. It will ask for:

  - App Title (e.g., `My Site`)
  - Java package (e.g., `example.mysite`). This will be used as `com.example.mysite` for `-DgroupId` and `-Dpackage`.

  The command runs `mvn -B org.apache.maven.plugins:maven-archetype-plugin:${archetypePluginVersion}:generate` using your configured settings.

> You can customize the archetype version and parameters via:
>
> - `aemScaffold.archetypePluginVersion`
> - `aemScaffold.scaffoldArgs`

---

# CLI Usage & Configuration

The CLI now supports the full app configuration and all SDK/Maven/scaffold commands. You can use the CLI for local automation, scripting, or CI/CD.

## Running the CLI

You can run the CLI entry point (e.g. `aem`) from your project root or any directory. All commands and options available in the VS Code extension are also available in the CLI.

Example:

```sh
aem sdk start
aem sdk stop --instance author
aem maven ui.apps build skip-tests
aem scaffold project
```

## Configuration Commands

The CLI provides a set of `aem config` subcommands to help you manage and inspect your configuration:

- `aem config init [path]` Generate a default config file at the given path. If [path] is a directory, the file will be created as `.aemrc.json` inside that directory. If omitted, defaults to `.aemrc.json` in the current directory or the path set by `AEM_CONFIG_PATH`.
- `aem config show` Show the fully resolved config (including env overrides and defaults).
- `aem config path` Show the config file path currently in use.
- `aem config validate [path]` Validate the config file at the given path. If [path] is a directory, `.aemrc.json` in that directory will be validated. If omitted, defaults to `.aemrc.json` in the current directory or the path set by `AEM_CONFIG_PATH`.
- `aem config env` Show environment variable overrides currently set for config fields.
- `aem config env-list` List all available config environment variables and their descriptions.

## Configuration

The CLI and extension share a unified configuration system. Configuration is loaded from (in order of precedence):

1. The file specified by the `AEM_CONFIG_PATH` environment variable (if set)
2. `.aemrc.json` in the current working directory
3. `.aemrc.json` in your home directory

---

## Known Issues

- Only supports Maven-based AEM projects with standard archetype structure.
- Profile detection assumes conventional profile names and plugin usage.
- On macOS, Java may not boot in the background on first run

---

## Motivation

Managing local AEM development can be tedious:

- Juggling multiple terminals to control Author and Publish
- Copying and extracting new SDK files manually
- Forgetting steps or flags when switching environments
- Running Maven in the wrong directory and wondering why changes didn’t apply
- Repeatedly typing the same flags (`-DskipTests`, `-PautoInstallPackage`, etc.)

This extension automates those workflows to help you stay focused on development.

> **Why not use existing Maven extensions?**
> General Maven plugins don’t handle AEM-specific profiles or SDK automation. This one is built specifically for the AEM developer workflow.

---

_This extension was developed for personal use. It may not be as robust as official tools, but it aims to simplify common AEM dev tasks inside VS Code._
