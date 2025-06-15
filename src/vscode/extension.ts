import * as vscode from "vscode";
import * as path from "path";
// import { AemMavenHelper } from "./aem/maven/helper"; // No longer needed
import { getCommand as getMavenCommand } from "../lib/maven/maven";
import { AemSDKHelper } from "./aem/sdk/helper";
import { loadConfig } from "../lib/config/config";
import { getCommand as getScaffoldCommand } from "../lib/scaffold/scaffold";
import { setup as sdkSetup } from "../lib/sdk/commands/setup";

// Global output channel and terminal
let globalOutputChannel: vscode.OutputChannel | undefined;
let globalTerminal: vscode.Terminal | undefined;

function getFullConfig() {
  // Remove all AEM_ env vars to respect user settings
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith("AEM_")) {
      delete process.env[key];
    }
  });
  // Get all aem settings as a single object
  const settings = vscode.workspace.getConfiguration("aem");
  return loadConfig(settings);
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize global output channel and terminal
  if (!globalOutputChannel) {
    globalOutputChannel = vscode.window.createOutputChannel("AEM Maven");
  }
  if (!globalTerminal) {
    globalTerminal = vscode.window.terminals.find(
      (t) => t.name === "AEM Maven"
    );
    if (!globalTerminal) {
      globalTerminal = vscode.window.createTerminal({ name: "AEM Maven" });
    }
  }

  // Initialize the library configuration
  const aemConfig = getFullConfig();
  console.log("AEM Extension activated with config:", aemConfig);

  // Register the AEM Maven Helper command
  const aemMvnDisposable = vscode.commands.registerCommand(
    "vscode-aem.mvn",
    async (uri?: vscode.Uri) => {
      const libConfig = getFullConfig();
      let input: string | undefined;
      // If invoked from the context menu, do not show the input box
      if (!uri) {
        input = await vscode.window.showInputBox({
          prompt:
            "aem-mvn arguments (e.g. install, build, all, skip-tests, dry-run, or a target module name)",
          placeHolder:
            "install | build | all | skip-tests | dry-run | <target module>",
        });
        if (input === undefined) {
          return;
        }
      } else {
        // Default to no arguments if run from context menu
        input = "";
      }

      // Find the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;

      // Use the right-clicked file/folder as cwd if available
      let cwd = workspaceRoot;
      if (uri && uri.fsPath) {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.type & vscode.FileType.Directory) {
          cwd = uri.fsPath;
        } else {
          cwd = path.dirname(uri.fsPath);
        }
      } else {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          const filePath = activeEditor.document.uri.fsPath;
          cwd = path.dirname(filePath);
        }
      }

      // Use lib/maven's getCommand to build the command and directory
      let cmdResult;
      try {
        cmdResult = await getMavenCommand(libConfig, input || "", cwd);
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to build Maven command: ${err}`);
        return;
      }
      if (!cmdResult) {
        vscode.window.showErrorMessage(
          "Could not determine Maven command or module."
        );
        return;
      }
      const { command, cwd: directory } = cmdResult;
      if (command.startsWith("echo ")) {
        vscode.window.showInformationMessage(command.replace("echo ", ""));
        return;
      }
      const config = vscode.workspace.getConfiguration("aemMaven");
      const outputMode = config.get<"terminal" | "output">(
        "outputMode",
        "terminal"
      );
      if (outputMode === "output") {
        // Use global output channel
        if (globalOutputChannel) {
          globalOutputChannel.show(true);
        }
        const cp = require("child_process").spawn(
          `cd "${directory}" && ${command}`,
          {
            cwd: directory,
            shell: true,
          }
        );
        cp.stdout.on("data", (data: Buffer) => {
          globalOutputChannel?.append(data.toString());
        });
        cp.stderr.on("data", (data: Buffer) => {
          globalOutputChannel?.append(data.toString());
        });
        cp.on("close", (code: number) => {
          globalOutputChannel?.appendLine(`\nProcess exited with code ${code}`);
          if (code !== 0) {
            vscode.window.showErrorMessage(
              `AEM Maven command failed (exit code ${code})`
            );
          }
        });
      } else {
        // Use global terminal
        if (!globalTerminal) {
          globalTerminal = vscode.window.createTerminal({ name: "AEM Maven" });
        }
        globalTerminal.show();
        globalTerminal.sendText(`cd "${directory}" && ${command}`);
      }
    }
  );
  context.subscriptions.push(aemMvnDisposable);

  // Check for required SDK settings before registering SDK commands
  const sdkConfig = vscode.workspace.getConfiguration("aemSDK");
  const sdkHome = sdkConfig.get<string>("sdkHome", "");
  if (!sdkHome) {
    vscode.window.showWarningMessage(
      'AEM SDK: Please set "aemSDK.sdkHome" in your VS Code settings before using SDK commands.'
    );
  } else {
    context.subscriptions.push(
      vscode.commands.registerCommand("vscode-aem.sdk.setup", async () => {
        const libConfig = getFullConfig();
        // Prompt for Quickstart ZIP path, pre-filled from config
        let quickstartPath = await vscode.window.showInputBox({
          prompt:
            "Enter the path to your AEM SDK Quickstart ZIP file (e.g. aem-author-p4502.zip)",
          placeHolder: "/path/to/aem-author-p4502.zip",
          value: libConfig.sdk.quickstartPath || undefined,
          ignoreFocusOut: true,
        });
        if (!quickstartPath) {
          const quickstartUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: "Select AEM SDK Quickstart ZIP",
            filters: { "AEM Quickstart": ["zip"] },
          });
          if (!quickstartUri || quickstartUri.length === 0) {
            vscode.window.showErrorMessage(
              "AEM SDK setup cancelled: No Quickstart file selected."
            );
            return;
          }
          quickstartPath = quickstartUri[0].fsPath;
        }
        // Prompt for Forms Add-on ZIP (optional), pre-filled from config
        let formsAddonPath = await vscode.window.showInputBox({
          prompt:
            "Enter the path to your AEM Forms Add-on ZIP (optional), or leave blank to skip",
          placeHolder: "/path/to/aem-forms-addon.zip",
          value: libConfig.sdk.formsAddonPath || undefined,
          ignoreFocusOut: true,
        });
        if (!formsAddonPath) {
          const formsAddonUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: "Select AEM Forms Add-on (optional)",
            filters: { "AEM Forms Add-on": ["zip"] },
          });
          if (formsAddonUri && formsAddonUri.length > 0) {
            formsAddonPath = formsAddonUri[0].fsPath;
          }
        }

        // Save to config if changed
        const sdkConfig = vscode.workspace.getConfiguration("aem");
        const updates: Record<string, string> = {};
        if (quickstartPath && quickstartPath !== libConfig.sdk.quickstartPath) {
          updates["sdk.quickstartPath"] = quickstartPath;
        }
        if (formsAddonPath && formsAddonPath !== libConfig.sdk.formsAddonPath) {
          updates["sdk.formsAddonPath"] = formsAddonPath;
        }
        for (const key in updates) {
          await sdkConfig.update(
            key,
            updates[key],
            vscode.ConfigurationTarget.Workspace
          );
        }

        // Build CLI-style input string for setup
        let input = `--quickstartPath ${quickstartPath}`;
        if (formsAddonPath) {
          input += ` --formsAddonPath ${formsAddonPath}`;
        }
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "AEM SDK Setup",
            cancellable: false,
          },
          async (progress) => {
            await sdkSetup(getFullConfig().sdk, input, (msg: string) =>
              progress.report({ message: msg })
            );
          }
        );
      }),

      vscode.commands.registerCommand(
        "vscode-aem.sdk.start",
        AemSDKHelper.start
      ),
      vscode.commands.registerCommand(
        "vscode-aem.sdk.status",
        AemSDKHelper.status
      ),
      vscode.commands.registerCommand("vscode-aem.sdk.log", AemSDKHelper.log),
      vscode.commands.registerCommand("vscode-aem.sdk.stop", AemSDKHelper.stop)
    );
  }

  // Register the AEM Scaffold command
  const aemScaffoldDisposable = vscode.commands.registerCommand(
    "vscode-aem.scaffold",
    async () => {
      // Prompt for App Title
      const appTitle = await vscode.window.showInputBox({
        prompt: "Enter the App Title",
        ignoreFocusOut: true,
      });
      if (!appTitle) {
        vscode.window.showWarningMessage("App Title is required.");
        return;
      }
      // Prompt for Java package name
      let packageName = await vscode.window.showInputBox({
        prompt:
          "Short Name (e.g., mysite). Used as 'com.<yours>' for groupId/package, '<yours>' for appId/artifactId.",
        ignoreFocusOut: true,
      });
      if (!packageName) {
        vscode.window.showWarningMessage("Java package name is required.");
        return;
      }
      if (/\s/.test(packageName)) {
        vscode.window.showWarningMessage(
          "Java package name cannot contain spaces."
        );
        return;
      }
      // Find the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      // Build the input string for getCommand
      const input = `--appTitle ${appTitle} --packageName ${packageName}`;
      // Use lib/scaffold's getCommand to build the command and directory
      let cmdResult;
      try {
        cmdResult = getScaffoldCommand(
          aemConfig.scaffold,
          input,
          workspaceRoot
        );
      } catch (err) {
        vscode.window.showErrorMessage(
          `Failed to build scaffold command: ${err}`
        );
        return;
      }
      if (!cmdResult) {
        vscode.window.showErrorMessage("Could not determine scaffold command.");
        return;
      }
      const { command, cwd: directory } = cmdResult;
      // Use global terminal to run the command
      if (!globalTerminal) {
        globalTerminal = vscode.window.createTerminal({ name: "AEM Maven" });
      }
      globalTerminal.show();
      globalTerminal.sendText(`cd "${directory}" && ${command}`);
    }
  );
  context.subscriptions.push(aemScaffoldDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
