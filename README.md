# Travel Planner

An [Obsidian](https://obsidian.md/) plugin for planning trips against the
notes already in your vault. Places are just notes — the same ones
[Map View](https://github.com/esm7/obsidian-map-view) already plots on a
map — and Travel Planner adds trips, itinerary items, and day plans on top
of them, as notes of their own, linked together the normal Obsidian way.

## Why notes, not a separate database

Everything Travel Planner creates is a real markdown note with frontmatter:
you can search it, link to it, put it in the graph view, and edit it by hand
if the plugin's UI doesn't cover something. The plugin's job is to keep
those notes' frontmatter consistent and give you a fast view for the things
that would be tedious as raw note-editing: reordering priorities, comparing
options side by side, and moving itinerary items between day plans.

## What it does

- **Trips.** A trip note (`ptp-type: trip`) with a name, optional start/end
  dates, and its own tag (`trip/<slug>`).
- **Itinerary items.** A note per place-you're-considering-for-a-trip
  (`ptp-type: itinerary-item`), linking to the trip and to a place note
  already in your vault (any note with a `location` frontmatter field — the
  same field Map View reads). Each has a status (Idea → Considering →
  Planned → Booked, or Skipped), a manual priority order, and optional
  duration/cost estimates.
- **Prioritise & compare.** The Itinerary tab lets you reorder items
  (↑/↓, which just swaps their `ptp-priority`), change status inline, and
  select two or more to open a side-by-side comparison table.
- **Day plans.** A day plan note (`ptp-type: day-plan`) holds a set of
  candidate itinerary items for either a specific date or an unscheduled
  **flex day** — somewhere to keep several options together until it's
  clear which day they belong to. Mark one candidate "chosen" once you've
  decided, or leave it open and compare candidates on the map.

All of this lives in one view (map-pin icon in the ribbon, or run
**"Open Travel Planner"** from the command palette): pick a trip from the
dropdown, switch between the Itinerary and Day Plans tabs.

## Pairing with Map View

Travel Planner doesn't draw a map itself — [Map View](https://obsidian.md/plugins?id=obsidian-map-view)
does that, and does it well. Travel Planner never reaches into Map View's
internals (it has no published API for other plugins); instead it only uses
two things Map View documents and keeps stable:

- **The `location` frontmatter field.** Any note with a `location:
  lat,lng` field (Map View's format) is offered as a place when you add an
  itinerary item. Travel Planner never touches this field — your place
  notes already have it from using Map View normally.
- **Map View's query language.** Every itinerary item and day plan gets its
  trip's `trip/<slug>` tag, so a `tag:#trip/<slug>` query isolates one
  trip's places. Trip notes get a live `mapview` embed block pre-filled
  with that query, so opening a trip note shows its map right there. The
  "Open trip in Map View" and "Compare on map" buttons in the plugin view
  do the same thing for the full trip or for one day's candidates
  (via an OR'd `path:` query over just those candidates' place notes) —
  copying the query to your clipboard and, where possible, opening Map
  View for you to paste it in.

If Map View changes its query syntax or embed format, only
`src/mapview.ts` needs to change — everything else in the plugin talks to
it only through that file.

## Data model

| Note kind | `ptp-type` | Key frontmatter | Lives in |
| --- | --- | --- | --- |
| Trip | `trip` | `ptp-name`, `ptp-slug`, `ptp-start`, `ptp-end`, `ptp-tag` | *Trips folder* |
| Itinerary item | `itinerary-item` | `ptp-trip` (link), `ptp-place` (link), `ptp-status`, `ptp-priority`, `ptp-duration-min`, `ptp-cost` | *Itinerary folder* |
| Day plan | `day-plan` | `ptp-trip` (link), `ptp-date` (empty = flex), `ptp-candidates` (links), `ptp-chosen` (link) | *Day Plans folder* |

Folder locations, the tag prefix, and the place-location field name are all
configurable in the plugin's settings tab.

## Development

No test suite — this is a small, UI-driven plugin; verify changes by loading
it into a real vault.

```bash
npm install
npm run dev      # esbuild watch build
npm run build    # typecheck + production build
npm run typecheck
```

To try it in Obsidian, copy (or symlink) `manifest.json`, `main.js`, and
`styles.css` into `<vault>/.obsidian/plugins/travel-planner/` and enable the
plugin from Community Plugins. Install Map View too, to see the map
integration in action.

See `CLAUDE.md` for the conventions this codebase follows.

## License

MIT — see [LICENSE](LICENSE).
