import * as vscode from "vscode";
import { SdkStartCommand } from "../../lib/sdk/commands/start";
import { getFullConfig } from "../extensionUtils";

export function registerSdkStart(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.sdk.start", async () => {
      const libConfig = getFullConfig();
      const sdkStartCmd = new SdkStartCommand(libConfig);
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Starting AEM SDK instance(s)...",
          cancellable: false,
        },
        async (progress) => {
          await sdkStartCmd.run("", undefined, (instance, msg, done) => {
            progress.report({ message: `[${instance}] ${msg}` });
          });
        }
      );
    })
  );
}
