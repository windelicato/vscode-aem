import * as vscode from "vscode";
import { runCommand as runStopCommand } from "../../lib/sdk/commands/stop";
import { getFullConfig } from "../extensionUtils";

export function registerSdkStop(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.sdk.stop", async () => {
      const libConfig = getFullConfig();
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Stopping AEM SDK instance(s)...",
          cancellable: false,
        },
        async (progress) => {
          await runStopCommand(libConfig.sdk, "", (instance, msg, done) => {
            progress.report({ message: `[${instance}] ${msg}` });
          });
        }
      );
    })
  );
}
