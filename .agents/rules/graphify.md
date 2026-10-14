---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- For codebase or architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (CLI) or `query_graph` (MCP). Use `graphify path "<A>" "<B>"` / `shortest_path` for relationships and `graphify explain "<concept>"` / `get_node` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context
- **Mandatory Sync**: After modifying, creating, or deleting code files in any session or turn, ALWAYS run `graphify update .` before concluding your response. This is a single-step, AST-only command (offline, 0 API cost) that extracts changed AST nodes, re-clusters communities, and updates `graph.json`, `graph.html`, and `GRAPH_REPORT.md`. Never skip this step.
