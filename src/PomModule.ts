import * as path from 'path';
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export class PomModule {
  absolutePath: string;
  relativePath: string;
  name: string; // directory name
  artifactId: string; // from pom.xml
  profiles: string[];
  isRoot: boolean;

  constructor(params: {
    absolutePath: string;
    relativePath: string;
    name: string;
    artifactId: string;
    profiles?: string[];
    isRoot?: boolean;
  }) {
    this.absolutePath = params.absolutePath;
    this.relativePath = params.relativePath;
    this.name = params.name;
    this.artifactId = params.artifactId;
    this.profiles = params.profiles || [];
    this.isRoot = params.isRoot ?? false;
    this.findProfiles(); // Find profiles on construction
  }

  findProfiles() {
    const pomPath = path.join(this.absolutePath, 'pom.xml');
    const parentPomPath = path.join(this.absolutePath, '..', 'pom.xml');
    if (!fs.existsSync(pomPath)) {
      this.profiles = [];
      return;
    }
    const pomContent = fs.readFileSync(pomPath, 'utf8');
    let parentPomContent = '';
    if (fs.existsSync(parentPomPath)) {
      parentPomContent = fs.readFileSync(parentPomPath, 'utf8');
    }
    const parser = new XMLParser();
    let pom: any = {};
    let parentPom: any = {};
    try {
      pom = parser.parse(pomContent);
    } catch (e) {}
    try {
      parentPom = parser.parse(parentPomContent);
    } catch (e) {}

    const profiles: string[] = [];
    const profilesArr = Array.isArray(pom.project?.profiles?.profile)
      ? pom.project.profiles.profile
      : pom.project?.profiles?.profile
      ? [pom.project.profiles.profile]
      : [];
    for (const prof of profilesArr) {
      if (prof.id) { profiles.push(prof.id); }
    }
    const parentProfilesArr = Array.isArray(parentPom.project?.profiles?.profile)
      ? parentPom.project.profiles.profile
      : parentPom.project?.profiles?.profile
      ? [parentPom.project.profiles.profile]
      : [];
    for (const prof of parentProfilesArr) {
      if (prof.id && !profiles.includes(prof.id)) { profiles.push(prof.id); }
    }
    this.profiles = profiles;
  }
}
