/**
 * Internal type for MavenModule abstraction, representing a Maven module's metadata.
 * @property absolutePath - Absolute path to the module directory.
 * @property name - Module name.
 * @property artifactId - Maven artifactId.
 * @property profiles - Effective Maven profiles for this module.
 */
export interface MavenModuleData {
  absolutePath: string;
  name: string;
  artifactId: string;
  profiles: string[];
  pom?: any;
  parentPom?: any;
}
