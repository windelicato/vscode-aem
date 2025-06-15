import * as vscode from "vscode";
import { registerSdkSetup } from "./commands/sdkSetup";
import { registerSdkStart } from "./commands/sdkStart";
import { registerSdkStop } from "./commands/sdkStop";
import { registerSdkStatus } from "./commands/sdkStatus";
import { registerSdkLog } from "./commands/sdkLog";
import { registerMaven } from "./commands/maven";
import { registerScaffold } from "./commands/scaffold";
import {
  getFullConfig,
  getGlobalOutputChannel,
  getGlobalTerminal,
} from "./extensionUtils";

// Initialize global output channel and terminal
getGlobalOutputChannel();
getGlobalTerminal();

export function activate(context: vscode.ExtensionContext) {
  // Initialize the library configuration
  const aemConfig = getFullConfig();
  console.log("AEM Extension activated with config:", aemConfig);

  // Register modularized commands
  registerMaven(context);
  registerScaffold(context);
  registerSdkSetup(context);
  registerSdkStart(context);
  registerSdkStop(context);
  registerSdkStatus(context);
  registerSdkLog(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
