# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Travel Planner is an Obsidian plugin for planning trips against a vault's own
notes. Places live as ordinary notes carrying a Map View-compatible
`location` frontmatter field; the plugin adds three more note kinds on top —
**trips**, **itinerary items** (a place being considered for a trip, with
status/priority/cost/duration), and **day plans** (a set of candidate
itinerary items for a specific date, or an unscheduled "flex" day) — all
plain markdown notes with structured frontmatter, tied together by wikilinks.
A single `ItemView` (`src/views/TravelPlannerView.ts`) is the whole UI:
pick a trip, switch between an Itinerary tab and a Day Plans tab.

It deliberately does not depend on Map View's internals (no stable JS API is
published for other plugins to call). It only relies on two documented,
version-stable Map View surfaces: the `location` frontmatter format, and its
query language (`tag:...`, `path:...`, boolean `AND`/`OR`). See the comment
at the top of `src/mapview.ts` before changing anything there.

## Commands

Standard Obsidian plugin tooling — no test suite.

- **Install deps:** `npm install`
- **Typecheck:** `npm run typecheck`
- **Dev build (watch):** `npm run dev`
- **Production build:** `npm run build` (typechecks, then bundles `src/main.ts` → `main.js` via esbuild)
- **Try it in a vault:** symlink or copy `manifest.json`, `main.js`, and `styles.css` into
  `<vault>/.obsidian/plugins/travel-planner/`, then enable it from Obsidian's
  Community Plugins settings. Install the (separate) Map View plugin too, to see the map itself.

## Conventions & Patterns

- **Notes are the data model.** Every trip/itinerary-item/day-plan is a real
  vault note; the plugin only ever reads/writes via `app.fileManager.processFrontMatter`
  (never raw string edits to existing files) and `app.vault.create` for new
  ones. `ptp-type` in frontmatter marks which of the three a note is —
  `src/vaultIndex.ts` finds all of them with a metadata-cache scan (no
  separate index file to keep in sync).
- **Relationships are `[[wikilinks]]`, not IDs.** `ptp-trip` on an itinerary
  item/day-plan and `ptp-place` on an itinerary item store real Obsidian
  links (built with `toWikilink`, resolved with `resolveWikilink` in
  `src/links.ts`), so renaming a note in Obsidian keeps working instead of
  silently breaking a foreign key.
- **One view, two tabs, full re-render.** `TravelPlannerView` re-renders its
  whole `contentEl` from scratch on any state change rather than doing
  incremental DOM diffing — the data volumes here (a handful of trips, tens
  of itinerary items) make that the simpler and entirely fast-enough choice.
  Follow the same pattern rather than introducing partial updates.
- **Map View integration stays at arm's length.** `src/mapview.ts` builds
  query strings and `mapview` embed blocks; it never imports Map View's
  types or touches its plugin instance beyond checking it's enabled and
  best-effort running one of its own commands. If you need a new kind of
  integration, extend the query-building helpers there rather than reaching
  into `app.plugins.plugins["obsidian-map-view"]` internals.

## Known Pitfalls / Recurring Errors

- **`npm install` in this sandboxed dev environment can resolve `typescript`
  to a much newer major (seen: `^5.6.0` installing 7.0.2) than the range in
  `package.json` asks for**, and TS 7 rejects this project's
  `moduleResolution`/`baseUrl` settings outright. If `npm run typecheck`
  fails with `TS5102`/`TS5108` right after a fresh install, check
  `node_modules/typescript/package.json`'s version before assuming the
  tsconfig is wrong — pin with `npm install --save-dev typescript@5.6.3` (or
  whatever 5.x is current) to fix it.

## Docs Index

No `docs/` directory — this file and the root `README.md` (user-facing: data
model, setup, Map View pairing) cover it.
