# @fjell/express-router - Agentic Guide

## Purpose

Express routing layer for exposing Fjell operations over HTTP.

This guide is optimized for AI-assisted code generation and integration workflows.

## Documentation

- **[Usage Guide](./usage.md)** - API-oriented usage patterns and model-safe examples
- **[Integration Guide](./integration.md)** - Architecture placement, composition rules, and implementation guidance

## Key Capabilities

- Provides routers for generic, primary, and contained item APIs
- Includes standard error handler and app creation helpers
- Bridges library operations to HTTP endpoints with typed contracts

## Installation

```bash
npm install @fjell/express-router
```

## Public API Highlights

- `ItemRouter`, `PItemRouter`, and `CItemRouter` exports
- `createApp`, `errorHandler`, and route types
- Instance and registry helpers for composing route dependencies
