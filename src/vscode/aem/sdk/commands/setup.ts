import * as vscode from 'vscode';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';
import * as fs from 'fs';
import * as path from 'path';
import * as unzipper from 'unzipper';

function expandHome(filePath: string): string {
  if (!filePath) { return filePath; }
  if (filePath.startsWith('~')) {
    return path.join(process.env.HOME || process.env.USERPROFILE || '', filePath.slice(1));
  }
  return filePath;
}

// Shared extraction logic for extracting a single file from a zip to a destination directory
async function extractFileFromZip(zipPath: string, destDir: string, filePattern: RegExp, infoLabel: string): Promise<string | undefined> {
  return await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Extracting ${infoLabel} from ${path.basename(zipPath)}`,
    cancellable: false
  }, async (progress) => {
    try {
      const directory: any = await unzipper.Open.file(zipPath);
      const entry = directory.files.find((f: any) => filePattern.test(f.path));
      if (!entry) {
        showError(`[ERROR] No ${infoLabel} found in ${path.basename(zipPath)}.`);
        return undefined;
      }
      const dest = path.join(destDir, path.basename(entry.path));
      if (!fs.existsSync(dest)) {
        progress.report({ message: `Extracting ${entry.path}...` });
        showInfo(`[INFO] Extracting ${entry.path} from ${path.basename(zipPath)} to ${destDir}...`);
        await new Promise((resolve, reject) => {
          let finished = false;
          const outStream = fs.createWriteStream(dest);
          const onError = (err: any) => {
            if (!finished) {
              finished = true;
              showError(`[ERROR] Extraction failed: ${err.message}`);
              reject(err);
            }
          };
          outStream.once('error', onError);
          const inStream = entry.stream();
          inStream.once('error', onError);
          outStream.on('finish', () => {
            if (!finished) {
              finished = true;
              resolve(undefined);
            }
          });
          inStream.pipe(outStream);
          setTimeout(() => {
            if (!finished) {
              finished = true;
              showError('[ERROR] Extraction timed out.');
              reject(new Error('Extraction timed out'));
            }
          }, 60000);
        });
        progress.report({ message: `Extraction complete.` });
      }
      return dest;
    } catch (e: any) {
      showError(`[ERROR] Failed to extract ${infoLabel}: ${e.message}`);
      return undefined;
    }
  });
}

// Generalized function to ensure a file is copied to an instance directory if not already present
async function ensureFileCopiedToInstance(
  srcFile: string,
  instanceName: string,
  instanceDir: string,
  destFileName: string,
  label: string
) {
  if (!fs.existsSync(instanceDir)) {
    fs.mkdirSync(instanceDir, { recursive: true });
  }
  const dest = path.join(instanceDir, destFileName);
  if (fs.existsSync(dest)) {
    showInfo(`[${instanceName}] ${label} already exists. Skipping copy for ${instanceName}.`);
  } else {
    try {
      fs.copyFileSync(srcFile, dest);
      showInfo(`[${instanceName}] Copied ${srcFile} to ${dest}.`);
    } catch (e: any) {
      showError(`[${instanceName}] ERROR: Failed to copy ${srcFile} to ${dest}: ${e.message}`);
    }
  }
}

export async function setup(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }

  // Use resource URI or null for resource-scoped config
  const resource = uri ?? null;

  // Access settings in a more standard, readable way
  const prevQuickstart = vscode.workspace.getConfiguration('aemSDK').get<string>('quickstartPath', '') || '';
  const prevFormsAddon = vscode.workspace.getConfiguration('aemSDK').get<string>('formsAddonPath', '') || '';

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
    await vscode.workspace.getConfiguration('aemSDK').update('quickstartPath', quickstartPath, vscode.ConfigurationTarget.Workspace);
    await vscode.workspace.getConfiguration('aemSDK').update('formsAddonPath', formsAddonPath || '', vscode.ConfigurationTarget.Workspace);
    showInfo('AEM SDK paths saved to your workspace settings.');
  } else {
    showInfo('AEM SDK setup: using existing saved paths.');
  }

  let msg = `Run: aem setup "${quickstartPath}"`;
  if (formsAddonPath) {
    msg += ` "${formsAddonPath}"`;
  }
  showInfo(msg);

  // --- Ensure Quickstart JAR and copy to instances ---
  const sdkHome = config.sdkHome;
  const instances = config.instances;

  if (quickstartPath) { quickstartPath = expandHome(quickstartPath); }
  if (formsAddonPath) { formsAddonPath = expandHome(formsAddonPath); }

  // --- Ensure Quickstart JAR and copy to instances ---
  let quickstartJar: string | undefined = quickstartPath;
  if (quickstartPath.toLowerCase().endsWith('.zip')) {
    quickstartJar = await extractFileFromZip(
      quickstartPath,
      sdkHome,
      /^aem-sdk-quickstart-[0-9a-zA-Z_.-]+\.jar$/,
      'aem-sdk-quickstart-*.jar'
    );
    if (!quickstartJar) { return; }
  }
  if (!fs.existsSync(quickstartJar)) {
    showError(`File not found: ${quickstartJar}`);
    return;
  }

  // --- Ensure Forms Add-on ZIP/FAR is in sdkHome and extract if needed ---
  let formsAddonFar: string | undefined;
  if (formsAddonPath) {
    const formsAddonBase = path.basename(formsAddonPath);
    const sdkHomeFormsAddon = path.join(sdkHome, formsAddonBase);
    if (!fs.existsSync(sdkHomeFormsAddon)) {
      try {
        fs.copyFileSync(formsAddonPath, sdkHomeFormsAddon);
        showInfo(`[INFO] Copied Forms Add-on ${formsAddonPath} to ${sdkHomeFormsAddon}`);
      } catch (e: any) {
        showError(`[ERROR] Failed to copy Forms Add-on: ${e.message}`);
      }
    }
    if (formsAddonBase.toLowerCase().endsWith('.zip')) {
      // Extract .far from the ZIP
      formsAddonFar = await extractFileFromZip(
        sdkHomeFormsAddon,
        sdkHome,
        /^aem-forms-addon-.*\.far$/,
        'aem-forms-addon-*.far'
      );
      if (formsAddonFar) {
        showInfo(`[INFO] Extracted ${path.basename(formsAddonFar)} from ${formsAddonBase}.`);
      } else {
        showInfo(`[INFO] No aem-forms-addon-*.far found in ${formsAddonBase}. Skipping Forms add-on installation.`);
      }
    } else if (formsAddonBase.toLowerCase().endsWith('.far')) {
      formsAddonFar = sdkHomeFormsAddon;
    }
  }

  for (const instance of instances) {
    const instanceDir = path.join(sdkHome, instance.name);
    const instanceJar = `aem-${instance.name}-p${instance.port}.jar`;
    await ensureFileCopiedToInstance(quickstartJar, instance.name, instanceDir, instanceJar, instanceJar);

    // Forms Add-on logic (no fallback, only use formsAddonFar if provided)
    if (formsAddonFar) {
      const formsAddonBasename = path.basename(formsAddonFar);
      const installDir = path.join(instanceDir, 'crx-quickstart', 'install');
      await ensureFileCopiedToInstance(
        formsAddonFar,
        instance.name,
        installDir,
        formsAddonBasename,
        formsAddonBasename
      );
    } else {
      showInfo(`[INFO] No Forms Add-on .far provided for instance ${instance.name}. Skipping.`);
    }
  }
  showInfo('AEM JARs and Forms Add-on ensured for all instances. The crx-quickstart directory will be created on first start.');
}