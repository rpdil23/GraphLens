---
trigger: always_on
description: Architectural layers, oversized files, size limits, and verification commands.
---

# Code Structure & Boundaries

## 1. Layer Boundaries
Unidirectional import hierarchy:
`layout -> components -> hooks -> utils -> models`

- **`models/`**: Pure TypeScript types & interfaces. No runtime dependencies on other app layers.
- **`utils/`**: Stateless helper functions (parquet parsing, data sanitization). No hooks or UI component imports.
- **`hooks/`**: Business and state logic (`useGraphData`, `useFileHandler`). Import models and utils; no direct JSX/DOM rendering.
- **`components/`**: UI presentation and event handling. Import hooks, utils, and models.
- **`layout/`**: Root application shell (`App.tsx`). Composes top-level state, layout, and providers.

*Never introduce cyclic imports or import upward across layer boundaries.*

## 2. Size Limits
- **Max file size**: 300 lines. Split larger logic into focused modules.
- **Max function/component size**: 50 lines. Extract sub-components, custom hooks, or utility functions.

## 3. Oversized Files (Grandfathered)
Files exceeding limits. Do not expand further; extract sub-modules when modifying:
- `src/app/components/GraphViewer.tsx` (1144 lines) - 2D/3D force graph rendering and canvas controls.
- `src/app/hooks/useGraphData.ts` (421 lines) - Graph state management and filtering.
- `src/app/components/DataTableContainer.tsx` (372 lines) - Multi-table container and tabs.
- `src/app/components/GraphReportView.tsx` (327 lines) - Graph report viewer.
- `src/app/components/DetailDrawer.tsx` (312 lines) - Entity and relationship details panel.

## 4. Verification Steps
Run before committing changes:
- **Typecheck**: `npx tsc --noEmit`
- **Build**: `npm run build`
- **Test**: `npm test -- --watchAll=false`
