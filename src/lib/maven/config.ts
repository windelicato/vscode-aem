import { FieldResolver } from '../config/types';

export interface MavenConfig {
  skipTests: boolean;
  dryRun: boolean;
  defaultGoal: string;
  outputMode: string;
  mavenArguments: string;
  mavenInstallCommand: string;
}

/**
 * Schema for Maven config section, with env var mapping and defaults.
 */
export const mavenSchema: {
  [K in keyof MavenConfig]: FieldResolver<MavenConfig[K]>;
} = {
  skipTests: {
    env: 'AEM_MAVENHELPER_SKIP_TESTS',
    default: false,
    description: 'Skip tests during Maven build',
  },
  dryRun: {
    env: 'AEM_MAVENHELPER_DRY_RUN',
    default: false,
    description: 'Run Maven in dry-run mode',
  },
  defaultGoal: {
    env: 'AEM_MAVENHELPER_DEFAULT_GOAL',
    default: 'install',
    description: 'Default Maven goal',
  },
  outputMode: {
    env: 'AEM_MAVEN_OUTPUT_MODE',
    default: 'terminal',
    description: 'Output mode for Maven commands',
  },
  mavenArguments: {
    env: 'AEM_MAVEN_ARGUMENTS',
    default: '',
    description: 'Additional Maven arguments',
  },
  mavenInstallCommand: {
    env: 'AEM_MAVEN_INSTALL_COMMAND',
    default: 'clean install',
    description: 'Maven install command',
  },
};
