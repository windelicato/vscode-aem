import * as vscode from "vscode";
import { ScaffoldCommand } from "../../lib/scaffold/scaffold";
import { getFullConfig, getGlobalTerminal } from "../extensionUtils";

export function registerScaffold(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.scaffold", async () => {
      const aemConfig = getFullConfig();
      const appTitle = await vscode.window.showInputBox({
        prompt: "Enter the App Title",
        ignoreFocusOut: true,
      });
      if (!appTitle) {
        vscode.window.showWarningMessage("App Title is required.");
        return;
      }
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
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const input = `--appTitle ${appTitle} --packageName ${packageName}`;
      let cmdResult;
      try {
        const scaffoldCmd = new ScaffoldCommand(aemConfig);
        cmdResult = await scaffoldCmd.create(input);
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
      // Use global terminal
      const globalTerminal = getGlobalTerminal();
      globalTerminal.show();
      globalTerminal.sendText(`cd "${directory}" && ${command}`);
    })
  );
}
