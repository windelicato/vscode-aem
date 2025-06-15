import * as vscode from 'vscode';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';

export async function stop(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }
  const sdkHome = config.sdkHome;
  const instances = config.instances;

  let output = vscode.window.createOutputChannel('AEM Stop');
  output.clear();
  output.appendLine('Stopping AEM instances...');

  const fs = require('fs');
  const { spawnSync } = require('child_process');

  for (const instance of instances) {
    const instanceDir = `${sdkHome}/${instance.name}`;
    const stopScript = `${instanceDir}/crx-quickstart/bin/stop`;
    if (fs.existsSync(stopScript) && (fs.statSync(stopScript).mode & 0o111)) {
      output.appendLine(`[${instance.name}] Running stop script: ${stopScript}`);
      const result = spawnSync('./stop', [], {
        cwd: `${instanceDir}/crx-quickstart/bin`,
        stdio: 'pipe',
        shell: false
      });
      if (result.error) {
        output.appendLine(`[${instance.name}] Error running stop script: ${result.error.message}`);
      } else {
        output.appendLine(`[${instance.name}] Stopped AEM ${instance.name}.`);
        if (result.stdout) { output.appendLine(result.stdout.toString()); }
        if (result.stderr) { output.appendLine(result.stderr.toString()); }
      }
    } else {
      output.appendLine(`[${instance.name}] Stop script not found or not executable: ${stopScript}`);
    }
  }
  output.show(true);
}
