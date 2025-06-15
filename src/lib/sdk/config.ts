import { FieldResolver } from '../config/types';

export interface SdkInstanceConfig {
  name: string;
  port: number;
  debugPort: number;
  debug: boolean;
}

export interface SdkConfig {
  sdkHome: string;
  instances: SdkInstanceConfig[];
  requiredJavaVersion: number;
  passwordFile: string;
  jvmOpts: string;
  jvmDebugBaseOpts: string;
  quickstartPath: string;
  formsAddonPath: string;
}

export const sdkSchema: {
  [K in keyof SdkConfig]: FieldResolver<SdkConfig[K]>;
} = {
  sdkHome: {
    env: 'AEM_SDK_HOME',
    default: '',
    description: 'AEM SDK home directory',
  },
  instances: {
    env: 'AEM_SDK_INSTANCES',
    default: [
      { name: 'author', port: 4502, debugPort: 5005, debug: false },
      { name: 'publish', port: 4503, debugPort: 5006, debug: false },
    ],
    description: 'AEM SDK instances configuration',
  },
  requiredJavaVersion: {
    env: 'AEM_SDK_REQUIRED_JAVA_VERSION',
    default: 11,
    description: 'Required Java version for AEM SDK',
  },
  passwordFile: {
    env: 'AEM_SDK_PASSWORD_FILE',
    default: 'aem-password',
    description: 'Password file for AEM SDK',
  },
  jvmOpts: {
    env: 'AEM_SDK_JVM_OPTS',
    default: '-Djava.awt.headless=true',
    description: 'JVM options for AEM SDK',
  },
  jvmDebugBaseOpts: {
    env: 'AEM_SDK_JVM_DEBUG_BASE_OPTS',
    default: '-Djava.awt.headless=true -agentlib:jdwp=transport=dt_socket,server=y,suspend=n',
    description: 'Base JVM debug options for AEM SDK',
  },
  quickstartPath: {
    env: 'AEM_SDK_QUICKSTART_PATH',
    default: '',
    description: 'Path to AEM quickstart jar',
  },
  formsAddonPath: {
    env: 'AEM_SDK_FORMS_ADDON_PATH',
    default: '',
    description: 'Path to AEM Forms add-on',
  },
};
