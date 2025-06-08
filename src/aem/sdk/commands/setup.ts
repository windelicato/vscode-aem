import * as vscode from 'vscode';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';

export async function setup(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }

  const sdkConfig = vscode.workspace.getConfiguration('aemSDK');
  const prevQuickstart = sdkConfig.get<string>('quickstartPath', '');
  const prevFormsAddon = sdkConfig.get<string>('formsAddonPath', '');

  // Prompt for Quickstart JAR/ZIP path with context
  let quickstartPath: string | undefined;
  quickstartPath = await vscode.window.showInputBox({
    prompt: 'Enter the path to your AEM SDK Quickstart JAR or ZIP file (e.g. aem-author-p4502.jar)',
    placeHolder: prevQuickstart || '/path/to/aem-author-p4502.jar or .zip',
    value: prevQuickstart || undefined,
    ignoreFocusOut: true
  });
  if (!quickstartPath) {
    // Fallback: show file picker if user cancels or leaves blank
    const quickstartUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select AEM SDK Quickstart JAR or ZIP',
      filters: {
        'AEM Quickstart': ['jar', 'zip']
      }
    });
    if (!quickstartUri || quickstartUri.length === 0) {
      showError('AEM SDK setup cancelled: No Quickstart file selected.');
      return;
    }
    quickstartPath = quickstartUri[0].fsPath;
  }

  // Prompt for Forms Add-on (optional) with context
  let formsAddonPath: string | undefined;
  formsAddonPath = await vscode.window.showInputBox({
    prompt: 'Enter the path to your AEM Forms Add-on (optional, .far or .zip), or leave blank to skip',
    placeHolder: prevFormsAddon || '/path/to/aem-forms-addon.far or .zip',
    value: prevFormsAddon || undefined,
    ignoreFocusOut: true
  });
  if (!formsAddonPath) {
    // Fallback: show file picker if user cancels or leaves blank
    const formsAddonUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select AEM Forms Add-on (optional)',
      filters: {
        'AEM Forms Add-on': ['far', 'zip']
      }
    });
    if (formsAddonUri && formsAddonUri.length > 0) {
      formsAddonPath = formsAddonUri[0].fsPath;
    }
  }

  // If config exists, prompt to overwrite
  let shouldSave = true;
  if ((prevQuickstart && prevQuickstart !== quickstartPath) || (prevFormsAddon && prevFormsAddon !== formsAddonPath)) {
    const confirm = await vscode.window.showQuickPick([
      'Yes, overwrite my saved SDK paths',
      'No, do not overwrite'
    ], {
      placeHolder: 'You already have SDK paths saved in your settings. Overwrite with new values?'
    });
    shouldSave = confirm === 'Yes, overwrite my saved SDK paths';
  }

  if (shouldSave) {
    await sdkConfig.update('quickstartPath', quickstartPath, vscode.ConfigurationTarget.Workspace);
    await sdkConfig.update('formsAddonPath', formsAddonPath || '', vscode.ConfigurationTarget.Workspace);
    showInfo('AEM SDK paths saved to your workspace settings.');
  } else {
    showInfo('AEM SDK setup: using existing saved paths.');
  }

  let msg = `Run: aem setup "${quickstartPath}"`;
  if (formsAddonPath) {
    msg += ` "${formsAddonPath}"`;
  }
  showInfo(msg);
}
