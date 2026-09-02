import { App, Notice } from "obsidian";

/**
 * Integration with the Map View plugin (id "obsidian-map-view").
 *
 * Deliberately shallow: Map View doesn't expose a stable JS API for other
 * plugins, so Travel Planner never reaches into its internals. Instead it
 * relies only on Map View's two *documented* surfaces:
 *
 *  - Frontmatter location format (`location: lat,lng`) — place notes just
 *    need this field and Map View already plots them; Travel Planner never
 *    writes it itself, it only reads it to know a note qualifies as a place.
 *  - The query language (`tag:#...`, `path:...`, boolean AND/OR/NOT) — Travel
 *    Planner stamps a `trip/<slug>` tag onto every itinerary item and day
 *    plan it creates, so a single `tag:#trip/<slug>` query isolates that
 *    trip's places on the map, and embedding that query in a `mapview` code
 *    block gives a live filtered map right inside the trip/day-plan note.
 */

export const MAP_VIEW_PLUGIN_ID = "obsidian-map-view";

export function isMapViewInstalled(app: App): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const plugins = (app as any).plugins;
	return Boolean(plugins?.enabledPlugins?.has?.(MAP_VIEW_PLUGIN_ID));
}

export function tripQuery(tag: string): string {
	return `tag:#${tag}`;
}

/** OR's together `path:` filters for a set of note paths, e.g. to compare a day's candidate places on the map. */
export function pathsQuery(paths: string[]): string {
	const escaped = paths.map((p) => `path:"${p.replace(/"/g, '\\"')}"`);
	if (escaped.length === 0) return "";
	if (escaped.length === 1) return escaped[0];
	return `(${escaped.join(" OR ")})`;
}

/** A `mapview` embed block pre-filtered to a query, ready to paste into a note. */
export function mapviewEmbed(query: string): string {
	return ["```mapview", `query: "${query.replace(/"/g, '\\"')}"`, "```"].join("\n");
}

/**
 * Best-effort "open the map" action. Map View registers its own commands
 * under its plugin id, but doesn't document stable command ids, so this
 * looks for any of its commands whose id/name suggests "open the map",
 * runs the first match, and otherwise falls back to copying the query so
 * the user can paste it into Map View's own search bar.
 */
export async function openMapViewWithQuery(app: App, query: string): Promise<void> {
	if (!isMapViewInstalled(app)) {
		new Notice(
			"Map View isn't installed/enabled. Install it from Community Plugins to see this on a map.",
		);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const commands = (app as any).commands?.commands as
		| Record<string, { id: string; name: string }>
		| undefined;
	const candidate = commands
		? Object.values(commands).find(
				(c) => c.id.startsWith(`${MAP_VIEW_PLUGIN_ID}:`) && /open|map/i.test(c.name),
			)
		: undefined;

	if (candidate) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(app as any).commands.executeCommandById(candidate.id);
	}

	await navigator.clipboard.writeText(query);
	new Notice(
		candidate
			? `Opened Map View. Query copied — paste it into the search bar:\n${query}`
			: `Query copied — open Map View and paste it into the search bar:\n${query}`,
		8000,
	);
}
