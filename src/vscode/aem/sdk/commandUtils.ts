import * as vscode from 'vscode';
import { AemSDKConfig, AemSDKConfigHelper } from './config';

export function getValidatedConfig(): AemSDKConfig | undefined {
  try {
    const config = AemSDKConfigHelper.getConfig();
    AemSDKConfigHelper.validateConfig(config);
    return config;
  } catch (e: any) {
    showError(e.message);
    return undefined;
  }
}

export function showInfo(msg: string) {
  if (typeof vscode !== 'undefined' && vscode.window && vscode.window.showInformationMessage) {
    vscode.window.showInformationMessage(msg);
  } else {
    console.log(msg);
  }
}

export function showError(msg: string) {
  if (typeof vscode !== 'undefined' && vscode.window && vscode.window.showErrorMessage) {
    vscode.window.showErrorMessage(msg);
  } else {
    console.error(msg);
  }
}
