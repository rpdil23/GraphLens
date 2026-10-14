---
name: diagram-design
description: "Load when creating or editing architecture diagrams in docs/diagrams/. Provides the full pastel-glow theme spec, animation rules, and SVG CSS embed template for the GraphRAG-Visualizer diagram suite."
---

# diagram-design

This project maintains an editorial-grade architecture diagram suite in `docs/diagrams/` following the `cathrynlavery/diagram-design` specification with native SVG animation support.

When modifying system architecture, adding new ingress endpoints, changing storage/retrieval engines, or modifying data pipelines, update the corresponding animated SVG diagram in `docs/diagrams/` to keep documentation in sync with the codebase.

## Diagram theme

All diagrams use one light "pastel glow" theme with subtle, continuous flow animations. Copy an existing diagram (`05-performance-or-architecture-benchmark.svg` is the reference) instead of inventing a new look, and never reintroduce the old dark navy theme. Theme changes must not alter content (text, numbers, ports, labels, wiring).

- Canvas: `viewBox="0 0 1600 1024"`, white to `#F7F5FF` gradient (`canvas-grad`), plus three soft radial glows (lavender `#C9BEFF` top right, sky `#BFE3FF` left, peach `#FFD9C2` bottom right). No outer border rectangle.
- Fonts: Inter for everything (800 for titles and big metrics), JetBrains Mono for ports, code, tags and bar values. No serif fonts. Load them with one Google Fonts `@import` (escape `&` as `&amp;`).
- Title: 40px Inter 800, letter-spacing -1.8px, `#0A0A14`, with the second half of the words in purple `#5B4BE8` (`<tspan class="title-accent">`). Subtitle 13px `#475569`. Optional small spaced eyebrow label above the title.
- Text colours: primary `#0A0A14`, secondary `#475569`/`#64748B`. Accent text uses the darker tones: orange `#EA580C`, green `#059669`, blue `#0284C7`, purple `#7C3AED`, amber `#B45309`, rose `#E11D48`. The light tones (`#FB923C`, `#34D399`, `#38BDF8`, `#C084FC`) are unreadable on white, so do not use them for text.
- Cards and panels: white or pastel tint fill (`#FFF4EA` orange, `#EAFBF2` green, `#E8F5FF` blue, `#F3EDFF` purple, `#F7F4FF` neutral), 1px stroke in the accent at about 0.35 opacity (neutral `#E4DEFA`), large radius (cards 20-24, rows 12, small chips 10), and `filter="url(#soft-shadow)"` on large cards and panels (a `feDropShadow` with flood `#6D5BD0` at 0.12).
- Badges and chips: fully rounded pills (rx = height / 2), accent-tinted fill with an accent stroke.
- Bars: rounded (rx 9-10) with the light-to-base accent gradients (`rust-bar-grad`, `blue-bar-grad`, `emerald-bar-grad`); legacy or baseline bars `#CBD5E1`.
- Wires and arrows: keep the accent colours (blue `#0EA5E9`, orange `#F97316`, purple `#A855F7`, emerald `#10B981`, amber `#F59E0B`); lifelines and neutral wires `#C7BFEA` or `#94A3B8`. Table header rows `#EFEAFE`, striped rows `#F7F4FF`.
- Keep value labels inside their panel (check the render); scale bar widths together if a label overflows, so the ratios stay the same.
- Footer: small spaced `#64748B` line at the bottom left, 9px, letter-spacing 4px.

## Animation Rules (Pure Inline SVG)

Every generated SVG must include embedded `<style>` keyframes to bring architecture flows to life without external scripts or video runtimes:

1. **Flowing Wire Paths (Dashed Stream):**
   - Apply `.wire-flow` to data wires and connector arrows.
   - Use `stroke-dasharray: 8 6;` and animate `stroke-dashoffset` in a seamless infinite loop (`2s linear infinite`).
2. **Moving Data Pulses / Packets:**
   - For primary process lifelines, attach an animated packet circle along the path using `<animateMotion dur="2.5s" repeatCount="indefinite">` over the connector's `<mpath href="#path-id"/>`.
3. **Pulsing Nodes & Badges:**
   - Target active endpoints or stage badges with a gentle opacity/glow pulse (`opacity: 0.85` to `1.0`, cycle duration 2s ease-in-out).
4. **SVG CSS Embed Template:**
   ```xml
   <style>
     @keyframes flow {
       to { stroke-dashoffset: -28; }
     }
     .wire-flow {
       stroke-dasharray: 8 6;
       animation: flow 1.2s linear infinite;
     }
     @keyframes soft-pulse {
       0%, 100% { opacity: 0.7; transform: scale(1); }
       50% { opacity: 1; transform: scale(1.015); }
     }
     .pulse-node {
       transform-box: fill-box;
       transform-origin: center;
       animation: soft-pulse 3s ease-in-out infinite;
     }
   </style>
   ```
