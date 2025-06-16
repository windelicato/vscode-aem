#!/usr/bin/env node
import { Command } from "commander";
import { registerSdkCommands } from "./commands/sdk";
import { registerMavenCommands } from "./commands/maven";
import { registerScaffoldCommand } from "./commands/scaffold";

const program = new Command();
program.name("aem").description("AEM Local Dev CLI").version("0.0.1");

registerSdkCommands(program);
registerMavenCommands(program);
registerScaffoldCommand(program);

program.parseAsync(process.argv);
