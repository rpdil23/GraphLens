# AGENTS.md - GraphLens Directives & Engineering Rules

## Caveman response style

For every new conversation in this repository, read and apply the
Caveman skill at:
.agents/skills/caveman/SKILL.md

Use Caveman style for chat replies by default. Preserve all technical
details. Keep code, comments, documentation, and other saved content
in normal prose. Continue following all engineering rules below.

If I say "stop caveman" or "normal mode", stop using this style for
the remainder of the conversation unless I enable it again.

---

## graphify
See `.agents/rules/graphify.md` (always-on rule) for graphify query/update directives.

---

## Architecture README sync
`README.md` in this repo is the **master architecture document** for GraphLens (React frontend, 2D/3D force graph visualization, Microsoft GraphRAG Parquet artifact parsers, and Graphify codebase knowledge graph support).
After a significant feature or change in this repo, update `README.md` in the same change. Significant means: a new data source format or loader; a new rendering engine/view; changes to the graph data model; major state management or caching changes; build flags or deployment workflow updates; or notable performance optimizations. Skip refactors, bug fixes, and minor UI adjustments.
Rules:
- Verify against code, `package.json`, and `.env.example`, not against old docs. Do not copy unverified numbers, ports, or versions.
- If you only changed code and did not touch `README.md`, explain in your final summary why none was needed.

## Code Structure
See `.agents/rules/code-structure.md` (always-on rule) for layer boundaries, the oversized-file list, function/file size limits, and development-mode verification steps.
