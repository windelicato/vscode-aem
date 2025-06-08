import * as vscode from 'vscode';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';

export async function log(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }
  showInfo('Run: aem log error.log');
}
