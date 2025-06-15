// parser.ts (restored)
import * as fsSync from "fs";
import * as fs from "fs/promises";
import type { PomXml } from "./types";
import { XMLParser } from "fast-xml-parser";
import path from "path";
import { resolveProfiles } from "./resolver";
import { MavenModule } from "./module";

/**
 * Parses a pom.xml file asynchronously and returns its contents as a PomXml object.
 * @param pomPath - Path to the pom.xml file.
 * @returns The parsed PomXml object, or an empty object if parsing fails.
 */
export async function parsePom(pomPath: string): Promise<PomXml> {
  try {
    await fs.access(pomPath);
    const content = await fs.readFile(pomPath, "utf-8");
    const parser = new XMLParser();
    return parser.parse(content);
  } catch {
    return {};
  }
}

/**
 * Parses a pom.xml file synchronously and returns its contents as a PomXml object.
 * @param pomPath - Path to the pom.xml file.
 * @returns The parsed PomXml object, or an empty object if parsing fails.
 */
export function parsePomSync(pomPath: string): PomXml {
  try {
    fsSync.accessSync(pomPath);
    const content = fsSync.readFileSync(pomPath, "utf-8");
    const parser = new XMLParser();
    return parser.parse(content);
  } catch {
    return {};
  }
}

/**
 * Parses a Maven module from a directory, resolving its POM and parent POM, and returns a MavenModule instance.
 * @param dir - Directory containing the pom.xml.
 * @param isRoot - Whether this is the root module.
 * @returns The MavenModule instance, or null if not found.
 */
export async function parseMavenModule(
  dir: string,
  isRoot = false
): Promise<MavenModule | null> {
  const pomPath = path.join(dir, "pom.xml");
  try {
    await fs.access(pomPath);
    const pom: PomXml = await parsePom(pomPath);
    const artifactId = pom.project?.artifactId ?? path.basename(dir);
    const parentPomPath = path.join(dir, "..", "pom.xml");
    const parentPom: PomXml = await parsePom(parentPomPath);
    return MavenModule.fromData({
      absolutePath: dir,
      relativePath: ".",
      name: path.basename(dir),
      artifactId,
      profiles: resolveProfiles(pom, parentPom, isRoot),
      isRoot,
    });
  } catch (err) {
    // Optionally log error: console.error(err);
    console.error(`Failed to parse POM at ${pomPath}:`, err);
    return null;
  }
}
