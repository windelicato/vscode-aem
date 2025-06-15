import * as vscode from "vscode";
import * as path from "path";
import { AemMavenHelper } from "./aem/maven/helper";
import { AemSDKHelper } from "./aem/sdk/helper";
import { AemScaffoldHelper } from "./aem/scaffold/helper";
import { loadConfig } from "../lib/config/config";

function getFullConfig() {
  // Get all aem settings as a single object
  const settings = vscode.workspace.getConfiguration("aem");
  return loadConfig(settings);
}

export function activate(context: vscode.ExtensionContext) {
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
        cwd = uri.fsPath;
      } else {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          const filePath = activeEditor.document.uri.fsPath;
          cwd = path.dirname(filePath);
        }
      }

      // Use AemMavenHelper to build the command and directory
      const { command, directory, error } = AemMavenHelper.buildCommand({
        cwd,
        input: input || "",
      });
      if (error) {
        vscode.window.showErrorMessage(error);
        return;
      }
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
        const outputChannel = vscode.window.createOutputChannel("AEM Maven");
        outputChannel.show(true);
        const cp = require("child_process").spawn(
          `cd "${directory}" && ${command}`,
          {
            cwd: directory,
            shell: true,
          }
        );
        cp.stdout.on("data", (data: Buffer) => {
          outputChannel.append(data.toString());
        });
        cp.stderr.on("data", (data: Buffer) => {
          outputChannel.append(data.toString());
        });
        cp.on("close", (code: number) => {
          outputChannel.appendLine(`\nProcess exited with code ${code}`);
          if (code !== 0) {
            vscode.window.showErrorMessage(
              `AEM Maven command failed (exit code ${code})`
            );
          }
        });
      } else {
        let terminal = vscode.window.terminals.find(
          (t) => t.name === "AEM Maven"
        );
        if (!terminal) {
          terminal = vscode.window.createTerminal({ name: "AEM Maven" });
        }
        terminal.show();
        terminal.sendText(`cd "${directory}" && ${command}`);
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
      await AemScaffoldHelper.runScaffold();
    }
  );
  context.subscriptions.push(aemScaffoldDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
