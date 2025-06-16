# Change Log

All notable changes to the "vscode-aem" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.1] - 2025-06-16

- Bump version to 0.1.1.
- Improved CLI build and publish process for npm compatibility.
- Added npm badge and updated CLI install instructions in README.
- Added .npmignore to restrict npm package contents to CLI only.
- Improved esbuild config for version injection and multi-entry builds.
- Various bug fixes and documentation updates.

## [0.1.0] - 2025-06-16

- Major CLI, library, and test suite refactor for modularity, maintainability, and robust config handling.
- All CLI and library commands (Maven, SDK, Scaffold) are now cross-platform, testable, and follow best practices.
- Expanded and modernized CLI tests for robust argument parsing and alias coverage for all commands, using sinon to mock child_process methods and avoid side effects.
- Added/expanded config CLI tests for `config init`, `config env`, `config env-list`, and environment variable overrides.
- CLI tests now check for correct argument values and ensure no real processes are spawned.
- Improved config loader logic and CLI help output.
- Updated SDK test stubs for proper ChildProcess mocking.
- Added `shell-quote` for robust shell-like argument parsing.
- Added `@types/unzipper` and removed custom d.ts for unzipper.
- Updated build:cli to bundle all dependencies except optional S3 SDK for unzipper.
- Updated version to 0.1.0.
- Various bug fixes, dependency updates, and documentation improvements.

## [0.0.3] - 2025-06-09

- Added `AEM Scaffold` command for project/module scaffolding using the Adobe Maven archetype.
- New settings for Maven output mode, additional Maven arguments, and custom Maven install command.
- Improved README with clearer feature breakdown, usage, and settings documentation.
- Enhanced SDK and Maven configuration options, including more flexible instance and JVM settings.
- Output for Maven commands can now be shown in the Output tab or terminal.
- Improved test coverage for new configuration and command logic.
- Various bug fixes and documentation improvements.

## [0.0.2] - 2025-06-09

- Major refactor for maintainability, modularity, and TypeScript best practices.
- Robust, user-friendly AEM SDK setup, start, stop, status, and log commands with improved error handling and per-instance debug config.
- All Maven command options now parsed from input string; config values for skipTests, dryRun, and defaultGoal are respected and overridable.
- Modularized helpers for extraction, file copying, and error handling.
- Improved command palette/menu structure: all AEM commands are grouped under the "AEM" submenu.
- Comprehensive, organized tests for Maven and SDK logic, including file system and VS Code API mocking.
- Integration-style tests for SDK setup and start using real temporary directories for reliable file system assertions.
- Fixed TypeScript errors in test stubs and mocks; increased test timeouts for async/mocked FS operations.
- Removed legacy/opts-based logic and top-level mock-fs calls to avoid ENOENT errors.
- Improved documentation and code comments throughout the codebase.

## [0.0.1] - 2024-xx-xx

- Initial release: robust module/profile detection, settings, CLI overrides, and error handling.
