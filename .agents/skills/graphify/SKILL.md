---
name: graphify
description: "Use for any question about a codebase, its architecture, file relationships, or project content — especially when graphify-out/ exists, where the question should be treated as a graphify query first. Turns any input (code, docs, papers, images, videos) into a persistent knowledge graph with god nodes, community detection, and query/path/explain tools."
---

# /graphify

Turn any folder of files into a navigable knowledge graph with community detection, an honest audit trail, and three outputs: interactive HTML, GraphRAG-ready JSON, and a plain-language GRAPH_REPORT.md.

## Usage

```
/graphify                                             # full pipeline on current directory
/graphify <path>                                      # full pipeline on specific path
/graphify https://github.com/<owner>/<repo>           # clone repo then run full pipeline
/graphify <path> --mode deep                          # thorough extraction, richer INFERRED edges
/graphify <path> --update                             # incremental - re-extract only new/changed files
/graphify <path> --directed                           # build directed graph (preserves edge direction)
/graphify <path> --cluster-only                       # rerun clustering on existing graph
/graphify <path> --no-viz                             # skip visualization, just report + JSON
/graphify <path> --wiki                               # build agent-crawlable wiki
/graphify <path> --obsidian --obsidian-dir <dir>      # write Obsidian vault to custom path
/graphify add <url>                                   # fetch URL, save to ./raw, update graph
/graphify query "<question>"                          # BFS traversal - broad context
/graphify query "<question>" --dfs                    # DFS - trace a specific path
/graphify query "<question>" --budget 1500            # cap answer at N tokens
/graphify path "AuthModule" "Database"                # shortest path between two concepts
/graphify explain "SwinTransformer"                   # plain-language explanation of a node
```

Full flag reference: see `references/full-pipeline.md` § Usage.

## Fast Path — Existing Graph (Most Common Case)

If `graphify-out/graph.json` exists AND the user's request is a natural-language question about the codebase (e.g. "How does X work?", "What calls Y?", "Trace the data flow through Z") and NOT an explicit rebuild command (`--update`, `--cluster-only`, or a bare path/URL): **skip to `## For /graphify query` immediately.** Do not detect, do not rebuild.

If the user invoked `/graphify --help` or `/graphify -h`, print the Usage section above verbatim and stop.

## For /graphify query

When `graphify-out/graph.json` already exists, answer from the graph:

```bash
graphify query "<question>"
```

Before traversal, expand the question against the graph's own vocabulary so a wording mismatch does not collapse the answer to noise. If the `graphify query` CLI is unavailable, fall back to an inline NetworkX traversal of `graphify-out/graph.json`. Answer using only what the graph output contains, and quote `source_location` when citing a specific fact. For BFS/DFS traversal modes, `--budget` cap, NetworkX fallback, `save-result` feedback, and `/graphify path` and `/graphify explain` flows, see `references/query.md`.

After answering, pick the single most interesting suggested question from the report and ask:
> "The most interesting question this graph can answer: **[question]**. Want me to trace it?"

## For a Fresh Build or --update

Read `references/full-pipeline.md` for the complete Steps 0–9 pipeline (install, detect, extract, build, cluster, label, visualize, manifest, clean up). Also see:
- `references/update.md` — `--update` and `--cluster-only` flows
- `references/exports.md` — `--wiki`, `--neo4j`, `--falkordb`, `--svg`, `--graphml`, `--mcp`
- `references/github-and-merge.md` — GitHub URL clone and multi-repo merge
- `references/transcribe.md` — video/audio transcription (Step 2.5)
- `references/extraction-spec.md` — subagent prompt and JSON schema
- `references/add-watch.md` — `/graphify add` and `--watch`
- `references/hooks.md` — post-commit hook and CLAUDE.md integration

## Mandatory Sync After Code Changes

After modifying code files, always run:
```bash
graphify update .
```
This is AST-only, offline, 0 API cost. Never skip this step.

## Honesty Rules

- Never invent an edge. If unsure, use AMBIGUOUS.
- Never skip the corpus check warning.
- Always show token cost in the report.
- Never hide cohesion scores behind symbols - show the raw number.
- Never run HTML viz on a graph with more than 5,000 nodes without warning the user.
