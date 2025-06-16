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

## CLI Integration

This extension includes `run-aem-helper.js` to run Maven logic from your terminal:

1. **Make it executable:**

   ```sh
   chmod +x run-aem-helper.js
   ```

2. **(Optional) Add to PATH:**

   ```sh
   export PATH="/path/to/vscode-aem:$PATH"
   ```

   Then:

   ```sh
   source ~/.zshrc  # or ~/.bashrc
   ```

3. **Run from anywhere:**

   ```sh
   run-aem-helper.js "ui.apps build skip-tests"
   run-aem-helper.js  # auto-detects current module
   ```

> **Note:** Arguments are plain words (e.g., `core dry-run`). Flags like `--skip-tests` are not required.

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

## Extension Settings

### Maven

- `aemMavenHelper.skipTests`
- `aemMavenHelper.dryRun`
- `aemMavenHelper.defaultGoal`
- `aemMaven.outputMode`
- `aemMaven.mavenArguments`
- `aemMaven.mavenInstallCommand`

### Scaffolding

- `aemScaffold.scaffoldArgs`
- `aemScaffold.archetypePluginVersion`

### SDK

- `aemSDK.home`
- `aemSDK.instances`
- `aemSDK.requiredJavaVersion`
- `aemSDK.passwordFile`
- `aemSDK.jvmOpts`
- `aemSDK.jvmDebugBaseOpts`
- `aemSDK.quickstartPath`
- `aemSDK.formsAddonPath`

---

## Known Issues

- Only supports Maven-based AEM projects with standard archetype structure.
- Profile detection assumes conventional profile names and plugin usage.
- On macOS, Java may still appear in the Dock even with `-Djava.awt.headless=true`. Add `-Dapple.awt.UIElement=true` to fully suppress the Dock icon.

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
