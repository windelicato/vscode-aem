import * as vscode from 'vscode';
import { AemSDKConfig, AemSDKConfigHelper } from '../config';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';

export async function start(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }
  showInfo('Run: aem start [--debug]');
}
