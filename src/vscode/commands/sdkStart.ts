import * as vscode from "vscode";
import { runCommand as runStartCommand } from "../../lib/sdk/commands/start";
import { getFullConfig } from "../extensionUtils";

export function registerSdkStart(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.sdk.start", async () => {
      const libConfig = getFullConfig();
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Starting AEM SDK instance(s)...",
          cancellable: false,
        },
        async (progress) => {
          await runStartCommand(libConfig.sdk, "", (instance, msg, done) => {
            progress.report({ message: `[${instance}] ${msg}` });
          });
        }
      );
    })
  );
}
