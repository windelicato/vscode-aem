import * as vscode from "vscode";
import { loadConfig } from "../lib/config/config";

let globalOutputChannel: vscode.OutputChannel | undefined;
let globalTerminal: vscode.Terminal | undefined;

export function getFullConfig() {
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith("AEM_")) {
      delete process.env[key];
    }
  });
  const settings = vscode.workspace.getConfiguration("aem");
  return loadConfig(settings);
}

export function getGlobalOutputChannel() {
  if (!globalOutputChannel) {
    globalOutputChannel = vscode.window.createOutputChannel("AEM Maven");
  }
  return globalOutputChannel;
}

export function getGlobalTerminal() {
  if (!globalTerminal) {
    globalTerminal = vscode.window.terminals.find(
      (t) => t.name === "AEM Maven"
    );
    if (!globalTerminal) {
      globalTerminal = vscode.window.createTerminal({ name: "AEM Maven" });
    }
  }
  return globalTerminal;
}
