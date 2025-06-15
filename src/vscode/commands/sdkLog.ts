import * as vscode from "vscode";
import { runCommand as runLogCommand } from "../../lib/sdk/commands/log";
import { getFullConfig } from "../extensionUtils";

export function registerSdkLog(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.sdk.log", async () => {
      const libConfig = getFullConfig();
      const logFileName = await vscode.window.showInputBox({
        prompt:
          "Enter the log file name to tail (e.g. error.log, stdout.log, request.log)",
        placeHolder: "error.log",
        value: "error.log",
        ignoreFocusOut: true,
      });
      if (!logFileName) {
        vscode.window.showErrorMessage("No log file name provided.");
        return;
      }
      const instanceName = await vscode.window.showInputBox({
        prompt:
          "Enter the instance name to tail (optional, e.g. author, publish)",
        placeHolder: "author | publish | (leave blank for all)",
        ignoreFocusOut: true,
      });
      const logOutputChannel = vscode.window.createOutputChannel(
        `AEM Log: [${logFileName}]`
      );
      logOutputChannel.show(true);
      logOutputChannel.clear();
      logOutputChannel.appendLine(
        `Tailing log file: ${logFileName}` +
          (instanceName
            ? ` for instance: ${instanceName}`
            : " for all instances")
      );
      let inputArgs = `--logFileName ${logFileName}`;
      if (instanceName) {
        inputArgs += ` --instance ${instanceName}`;
      }
      await runLogCommand(
        libConfig.sdk,
        inputArgs,
        (instance, data, isError) => {
          logOutputChannel.append(`[${instance}] ${data}`);
        }
      );
    })
  );
}
