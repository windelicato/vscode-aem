import * as vscode from "vscode";
import { SdkStopCommand } from "../../lib/sdk/commands/stop";
import { getFullConfig } from "../extensionUtils";

export function registerSdkStop(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.sdk.stop", async () => {
      const libConfig = getFullConfig();
      const sdkStopCmd = new SdkStopCommand(libConfig);
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Stopping AEM SDK instance(s)...",
          cancellable: false,
        },
        async (progress) => {
          await sdkStopCmd.run("", undefined, (instance, msg, done) => {
            progress.report({ message: `[${instance}] ${msg}` });
          });
        }
      );
    })
  );
}
