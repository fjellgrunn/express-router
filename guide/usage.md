# Usage Guide

Comprehensive usage guidance for `@fjell/express-router`.

## Installation

```bash
npm install @fjell/express-router
```

## API Highlights

- `ItemRouter`, `PItemRouter`, and `CItemRouter` exports
- `createApp`, `errorHandler`, and route types
- Instance and registry helpers for composing route dependencies

## Quick Example

```ts
import { createApp, PItemRouter, errorHandler } from "@fjell/express-router";

const app = createApp();
app.use("/api/widgets", PItemRouter({ operations }));
app.use(errorHandler());

app.listen(3000);
```

## Model Consumption Rules

1. Import from the package root (`@fjell/express-router`) instead of deep-internal paths unless explicitly documented.
2. Keep usage aligned with exported public symbols listed in this guide.
3. Prefer explicit typing at package boundaries so generated code remains robust during upgrades.
4. Keep error handling deterministic and map infrastructure failures into domain-level errors.
5. Co-locate integration wrappers in your app so model-generated code has one canonical entry point.

## Best Practices

- Keep examples and abstractions consistent with existing Fjell package conventions.
- Favor composable wrappers over one-off inline integration logic.
- Add targeted tests around generated integration code paths.
