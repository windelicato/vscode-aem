import * as vscode from "vscode";
import * as path from "path";
// import { AemMavenHelper } from "./aem/maven/helper"; // No longer needed
import { getCommand as getMavenCommand } from "../lib/maven/maven";
import { AemSDKHelper } from "./aem/sdk/helper";
import { loadConfig } from "../lib/config/config";
import { getCommand as getScaffoldCommand } from "../lib/scaffold/scaffold";

// Global output channel and terminal
let globalOutputChannel: vscode.OutputChannel | undefined;
let globalTerminal: vscode.Terminal | undefined;

function getFullConfig() {
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
      vscode.commands.registerCommand(
        "vscode-aem.sdk.setup",
        AemSDKHelper.setup
      ),
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
