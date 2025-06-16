import * as vscode from "vscode";
import * as path from "path";
import { MavenCommand } from "../../lib/maven/maven";
import {
  getFullConfig,
  getGlobalOutputChannel,
  getGlobalTerminal,
} from "../extensionUtils";

export function registerMaven(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-aem.mvn",
      async (uri?: vscode.Uri) => {
        const libConfig = getFullConfig();
        let input: string | undefined;
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
          input = "";
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          vscode.window.showErrorMessage("No workspace folder found.");
          return;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
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
        let cmdResult;
        try {
          const mavenCmd = new MavenCommand(libConfig);
          cmdResult = await mavenCmd.create(input || "");
        } catch (err) {
          vscode.window.showErrorMessage(
            `Failed to build Maven command: ${err}`
          );
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
          const globalOutputChannel = getGlobalOutputChannel();
          if (globalOutputChannel) {
            globalOutputChannel.show(true);
          }
          const cp = require("child_process").spawn(
            `cd "${directory}" && ${command}`,
            { cwd: directory, shell: true }
          );
          cp.stdout.on("data", (data: Buffer) => {
            globalOutputChannel?.append(data.toString());
          });
          cp.stderr.on("data", (data: Buffer) => {
            globalOutputChannel?.append(data.toString());
          });
          cp.on("close", (code: number) => {
            globalOutputChannel?.appendLine(
              `\nProcess exited with code ${code}`
            );
            if (code !== 0) {
              vscode.window.showErrorMessage(
                `AEM Maven command failed (exit code ${code})`
              );
            }
          });
        } else {
          // Use global terminal
          const globalTerminal = getGlobalTerminal();
          globalTerminal.show();
          globalTerminal.sendText(`cd "${directory}" && ${command}`);
        }
      }
    )
  );
}
