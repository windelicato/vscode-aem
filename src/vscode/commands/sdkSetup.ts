import * as vscode from "vscode";
import { runCommand as runSetupCommand } from "../../lib/sdk/commands/setup";
import { getFullConfig } from "../extensionUtils";

export function registerSdkSetup(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-aem.sdk.setup", async () => {
      const libConfig = getFullConfig();
      let quickstartPath = await vscode.window.showInputBox({
        prompt:
          "Enter the path to your AEM SDK Quickstart ZIP file (e.g. aem-author-p4502.zip)",
        placeHolder: "/path/to/aem-author-p4502.zip",
        value: libConfig.sdk.quickstartPath || undefined,
        ignoreFocusOut: true,
      });
      if (!quickstartPath) {
        const quickstartUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: "Select AEM SDK Quickstart ZIP",
          filters: { "AEM Quickstart": ["zip"] },
        });
        if (!quickstartUri || quickstartUri.length === 0) {
          vscode.window.showErrorMessage(
            "AEM SDK setup cancelled: No Quickstart file selected."
          );
          return;
        }
        quickstartPath = quickstartUri[0].fsPath;
      }
      let formsAddonPath = await vscode.window.showInputBox({
        prompt:
          "Enter the path to your AEM Forms Add-on ZIP (optional), or leave blank to skip",
        placeHolder: "/path/to/aem-forms-addon.zip",
        value: libConfig.sdk.formsAddonPath || undefined,
        ignoreFocusOut: true,
      });
      if (!formsAddonPath) {
        const formsAddonUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: "Select AEM Forms Add-on (optional)",
          filters: { "AEM Forms Add-on": ["zip"] },
        });
        if (formsAddonUri && formsAddonUri.length > 0) {
          formsAddonPath = formsAddonUri[0].fsPath;
        }
      }
      const sdkConfig = vscode.workspace.getConfiguration("aem");
      const updates: Record<string, string> = {};
      if (quickstartPath && quickstartPath !== libConfig.sdk.quickstartPath) {
        updates["sdk.quickstartPath"] = quickstartPath;
      }
      if (formsAddonPath && formsAddonPath !== libConfig.sdk.formsAddonPath) {
        updates["sdk.formsAddonPath"] = formsAddonPath;
      }
      for (const key in updates) {
        await sdkConfig.update(
          key,
          updates[key],
          vscode.ConfigurationTarget.Workspace
        );
      }
      let input = `--quickstartPath ${quickstartPath}`;
      if (formsAddonPath) {
        input += ` --formsAddonPath ${formsAddonPath}`;
      }
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "AEM SDK Setup",
          cancellable: false,
        },
        async (progress) => {
          await runSetupCommand(getFullConfig().sdk, input, (msg: string) =>
            progress.report({ message: msg })
          );
        }
      );
    })
  );
}
