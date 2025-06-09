export interface InstanceConfig {
  name: string;
  port: number;
  debugPort: number;
  debug?: boolean;
}

export interface AemSDKConfig {
  sdkHome: string;
  requiredJavaVersion: number;
  passwordFile: string;
  jvmOpts: string;
  jvmDebugBaseOpts: string;
  instances: InstanceConfig[];
  quickstartPath?: string;
  formsAddonPath?: string;
}

export class AemSDKConfigHelper {
  static getConfig(): AemSDKConfig {
    // Try VS Code settings first
    let config: any = {};
    // Dynamically require vscode for CLI compatibility
    let vscode: any;
    try { vscode = require('vscode'); } catch { vscode = undefined; }
    if (vscode && vscode.workspace && vscode.workspace.getConfiguration) {
      const sdkConfig = vscode.workspace.getConfiguration('aemSDK');
      config = {
        sdkHome: sdkConfig.get('sdkHome', ''),
        requiredJavaVersion: sdkConfig.get('requiredJavaVersion', 11),
        passwordFile: sdkConfig.get('passwordFile', 'aem-password'),
        jvmOpts: sdkConfig.get('jvmOpts', '-Djava.awt.headless=true'),
        jvmDebugBaseOpts: sdkConfig.get('jvmDebugBaseOpts', '-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n'),
        instances: sdkConfig.get('instances', [
          { name: 'author', port: 4502, debugPort: 5005, debug: false },
          { name: 'publisher', port: 4503, debugPort: 5006, debug: false }
        ]),
        quickstartPath: sdkConfig.get('quickstartPath', ''),
        formsAddonPath: sdkConfig.get('formsAddonPath', '')
      };
    } else {
      // Fallback to environment variables for CLI
      config = {
        sdkHome: process.env.AEM_SDK_HOME || '',
        requiredJavaVersion: Number(process.env.AEM_JAVA_VERSION) || 11,
        passwordFile: process.env.AEM_PASSWORD_FILE || 'aem-password',
        jvmOpts: process.env.AEM_JVM_OPTS || '-Djava.awt.headless=true',
        jvmDebugBaseOpts: process.env.AEM_JVM_DEBUG_BASE_OPTS || '-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n',
        instances: process.env.AEM_SDK_INSTANCES ? JSON.parse(process.env.AEM_SDK_INSTANCES) : [
          { name: 'author', port: 4502, debugPort: 5005, debug: false },
          { name: 'publisher', port: 4503, debugPort: 5006, debug: false }
        ],
        quickstartPath: process.env.AEM_SDK_QUICKSTART_PATH || '',
        formsAddonPath: process.env.AEM_SDK_FORMS_ADDON_PATH || ''
      };
    }
    return config as AemSDKConfig;
  }

  static validateConfig(config: AemSDKConfig) {
    if (!config.sdkHome) {
      throw new Error('AEM SDK: "sdkHome" is not set. Please set it in VS Code settings or the AEM_SDK_HOME environment variable.');
    }
    if (!config.instances || !Array.isArray(config.instances) || config.instances.length === 0) {
      throw new Error('AEM SDK: "instances" is not set or empty. Please set it in VS Code settings.');
    }
  }
}
