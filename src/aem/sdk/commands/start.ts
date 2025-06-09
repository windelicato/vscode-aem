import * as vscode from 'vscode';
import { AemSDKConfig, AemSDKConfigHelper } from '../config';
import { getValidatedConfig, showInfo, showError } from '../commandUtils';

export async function start(uri?: any) {
  const config = getValidatedConfig();
  if (!config) { return; }
  showInfo('Run: aem start');

  const sdkHome = config.sdkHome;
  const passwordFile = config.passwordFile || 'aem-password';
  const jvmOpts = config.jvmOpts || '-Djava.awt.headless=true';
  const jvmDebugBaseOpts = config.jvmDebugBaseOpts || '-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n';
  const instances = config.instances;

  for (const instance of instances) {
    const instanceDir = `${sdkHome}/${instance.name}`;
    const instanceJar = `aem-${instance.name}-p${instance.port}.jar`;
    const instanceJarPath = `${instanceDir}/${instanceJar}`;
    const startScript = `${instanceDir}/crx-quickstart/bin/start`;
    const pidFile = `${instanceDir}/crx-quickstart/conf/cq.pid`;
    const passwordFilePath = `${instanceDir}/${passwordFile}`;
    const isDebug = instance.debug === true;
    // If debug, prepend jvmOpts to jvmDebugBaseOpts
    const opts = isDebug ? `${jvmOpts} ${jvmDebugBaseOpts}` : jvmOpts;

    // Ensure instance directory exists before writing files
    if (!require('fs').existsSync(instanceDir)) {
      require('fs').mkdirSync(instanceDir, { recursive: true });
    }

    // Ensure password file exists
    if (!require('fs').existsSync(passwordFilePath)) {
      require('fs').writeFileSync(passwordFilePath, 'admin');
      showInfo(`[${instance.name}] Created password file: ${passwordFilePath}`);
    }

    // Start logic: use start script if available, else java -jar
    if (require('fs').existsSync(startScript) && require('fs').statSync(startScript).mode & 0o111) {
      // Use start script
      const envVars = {
        CQ_PORT: String(instance.port),
        CQ_JVM_OPTS: opts
      } as Record<string, string>;
      if (process.env.AEM_HOST) {
        envVars.CQ_HOST = process.env.AEM_HOST;
      }
      const debugCmd = `cd '${instanceDir}/crx-quickstart/bin' && CQ_PORT=${envVars.CQ_PORT} CQ_JVM_OPTS='${envVars.CQ_JVM_OPTS}'${envVars.CQ_HOST ? ` CQ_HOST='${envVars.CQ_HOST}'` : ''} ./start`;
      console.debug(`[${instance.name}] Start script command: ${debugCmd}`);
      showInfo(`[${instance.name}] Starting via start script: ${startScript}`);
      const child = require('child_process').spawn('./start', [], {
        cwd: `${instanceDir}/crx-quickstart/bin`,
        env: { ...process.env, ...envVars },
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      showInfo(`[${instance.name}] Started with PID: ${child.pid}`);
    } else {
      // First run: use java -jar
      const debugCmd = `cd '${instanceDir}' && java ${opts} -jar '${instanceJarPath}'`;
      console.debug(`[${instance.name}] First run command: ${debugCmd}`);
      showInfo(`[${instance.name}] First run: using java -jar.`);
      const child = require('child_process').spawn(
        `java ${opts} -jar '${instanceJarPath}'`,
        {
          cwd: instanceDir,
          detached: true,
          stdio: 'ignore',
          shell: true
        }
      );
      child.unref();
      showInfo(`[${instance.name}] Started with PID: ${child.pid}`);
      // Ensure conf dir exists and write pid file
      const confDir = `${instanceDir}/crx-quickstart/conf`;
      if (!require('fs').existsSync(confDir)) {
        require('fs').mkdirSync(confDir, { recursive: true });
      }
      require('fs').writeFileSync(pidFile, String(child.pid));
    }
  }
}