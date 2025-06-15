/**
 * MavenConfig type for Maven section of config.
 *
 * @property mvnPath - Path to the Maven executable
 * @property args - Additional Maven arguments
 * @property batchMode - Whether to use batch mode
 * @property settingsFile - Maven settings file path
 */
export interface MavenConfig {
  /** Path to the Maven executable */
  mvnPath: string;
  /** Additional Maven arguments */
  args: string[];
  /** Whether to use batch mode */
  batchMode: boolean;
  /** Maven settings file path */
  settingsFile: string;
}
