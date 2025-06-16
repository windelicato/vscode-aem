import * as vscode from "vscode";
import { SdkStatusCommand } from "../../lib/sdk/commands/status";
import { getFullConfig, getGlobalOutputChannel } from "../extensionUtils";

export function registerSdkStatus(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.sdk.status", async () => {
      const libConfig = getFullConfig();
      const sdkStatusCmd = new SdkStatusCommand(libConfig);
      const globalOutputChannel = getGlobalOutputChannel();
      if (globalOutputChannel) {
        globalOutputChannel.show(true);
        globalOutputChannel.clear();
        globalOutputChannel.appendLine("AEM SDK Instance Status:");
      }
      await sdkStatusCmd.run("", undefined, (instance, status) => {
        if (globalOutputChannel) {
          globalOutputChannel.appendLine(`[${instance}] ${status}`);
        }
      });
    })
  );
}
