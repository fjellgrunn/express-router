# Changelog

All notable changes to `@fjell/express-router` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Redact sensitive request headers (`authorization`, `cookie`, etc.) in error logs by default
- Do not log request bodies by default (`logRequestBody` opt-in); redact common secret fields in query/params/body when logged
- Avoid echoing full request body into error response `operation.params` unless `logRequestBody` is enabled

### Changed
- Bump express to 5.2.x and vitest/eslint toolchain within current majors
- Exclude `examples/**` from coverage; set src-only thresholds (lines/functions/statements 85, branches 72)

### Added
- CHANGELOG.md and explicit `package.json` `files` whitelist
