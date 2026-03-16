# Integration Guide

Guide for integrating `@fjell/express-router` into larger Fjell-based systems.

## Where It Fits

Express routing layer for exposing Fjell operations over HTTP.

## Recommended Integration Pattern

- Keep router-layer validation and auth explicit before invoking operations
- Use shared Fjell HTTP error mapping so client and server semantics stay aligned
- Register routers with dependency-injected operations for testability

## System Composition Checklist

- Define package boundaries: schema/types, transport, operations, adapters, and UI.
- Keep contracts stable by sharing @fjell/types interfaces where applicable.
- Centralize retries/timeouts/logging around infrastructure-facing operations.
- Validate inputs at API boundaries before invoking persistence or provider layers.
- Add contract and integration tests for every generated workflow.

## Cross-Library Pairings

- Pair with @fjell/types for shared contracts.
- Pair with @fjell/validation for input and schema checks.
- Pair with @fjell/logging for observability in integration flows.
- Pair with storage/router/provider packages based on your runtime architecture.

## Integration Example Shape

Use this package behind an application service layer that exposes stable domain methods. Generated code should call those service methods, not raw infrastructure primitives, unless your architecture intentionally keeps infrastructure at the edge.
