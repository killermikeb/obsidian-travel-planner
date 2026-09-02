import { App, TFile } from "obsidian";

/**
 * `app.vault.create()` resolves once the file is written, but the metadata
 * cache parses its frontmatter asynchronously afterwards — reading it back
 * immediately (e.g. via VaultIndex) can still see no `ptp-type` for a
 * moment. Await this right after creating a note before relying on it
 * showing up in the index.
 */
export function waitForFileMetadata(app: App, file: TFile): Promise<void> {
	if (app.metadataCache.getFileCache(file)?.frontmatter) return Promise.resolve();
	return new Promise((resolve) => {
		const ref = app.metadataCache.on("changed", (changed) => {
			if (changed.path === file.path) {
				app.metadataCache.offref(ref);
				resolve();
			}
		});
	});
}
import type {
	DayPlanRecord,
	ItineraryItemRecord,
	ItineraryStatus,
	TripRecord,
} from "./types";
import { resolveWikilink } from "./links";

/**
 * Scans the vault's metadata cache for Travel Planner notes (marked by their
 * `ptp-type` frontmatter field) and builds a plain in-memory index. Rebuilt
 * on demand — the vault is small enough (a handful of trips at a time) that
 * there's no need for incremental updates; views just re-scan when shown or
 * after an edit they made themselves.
 */
export class VaultIndex {
	constructor(private app: App) {}

	private frontmatterOf(file: TFile): Record<string, unknown> | undefined {
		return this.app.metadataCache.getFileCache(file)?.frontmatter as
			| Record<string, unknown>
			| undefined;
	}

	getTrips(): TripRecord[] {
		const trips: TripRecord[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			const fm = this.frontmatterOf(file);
			if (!fm || fm["ptp-type"] !== "trip") continue;
			trips.push({
				file: file.path,
				name: String(fm["ptp-name"] ?? file.basename),
				slug: String(fm["ptp-slug"] ?? file.basename),
				tag: String(fm["ptp-tag"] ?? ""),
				start: fm["ptp-start"] ? String(fm["ptp-start"]) : undefined,
				end: fm["ptp-end"] ? String(fm["ptp-end"]) : undefined,
			});
		}
		trips.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "") || a.name.localeCompare(b.name));
		return trips;
	}

	getItineraryItems(tripFile: string): ItineraryItemRecord[] {
		const items: ItineraryItemRecord[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			const fm = this.frontmatterOf(file);
			if (!fm || fm["ptp-type"] !== "itinerary-item") continue;
			const tripLink = String(fm["ptp-trip"] ?? "");
			const resolvedTrip = resolveWikilink(this.app, tripLink, file.path);
			if (!resolvedTrip || resolvedTrip.path !== tripFile) continue;

			const placeLink = String(fm["ptp-place"] ?? "");
			const placeFile = resolveWikilink(this.app, placeLink, file.path);
			items.push({
				file: file.path,
				tripLink,
				placeLink,
				status: (fm["ptp-status"] as ItineraryStatus) ?? "idea",
				priority: Number(fm["ptp-priority"] ?? 0),
				durationMin: fm["ptp-duration-min"] != null ? Number(fm["ptp-duration-min"]) : undefined,
				cost: fm["ptp-cost"] != null ? Number(fm["ptp-cost"]) : undefined,
				tags: Array.isArray(fm["ptp-tags"]) ? (fm["ptp-tags"] as string[]) : [],
				displayName: placeFile ? placeFile.basename : file.basename,
			});
		}
		items.sort((a, b) => a.priority - b.priority);
		return items;
	}

	getDayPlans(tripFile: string): DayPlanRecord[] {
		const plans: DayPlanRecord[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			const fm = this.frontmatterOf(file);
			if (!fm || fm["ptp-type"] !== "day-plan") continue;
			const tripLink = String(fm["ptp-trip"] ?? "");
			const resolvedTrip = resolveWikilink(this.app, tripLink, file.path);
			if (!resolvedTrip || resolvedTrip.path !== tripFile) continue;

			plans.push({
				file: file.path,
				tripLink,
				date: String(fm["ptp-date"] ?? ""),
				candidates: Array.isArray(fm["ptp-candidates"]) ? (fm["ptp-candidates"] as string[]) : [],
				chosen: fm["ptp-chosen"] ? String(fm["ptp-chosen"]) : undefined,
				displayName: file.basename,
			});
		}
		plans.sort((a, b) => {
			if (a.date && b.date) return a.date.localeCompare(b.date);
			if (a.date) return -1;
			if (b.date) return 1;
			return a.displayName.localeCompare(b.displayName);
		});
		return plans;
	}

	/** Every markdown file carrying the configured Map-View location field. */
	getPlaceCandidates(locationField: string): TFile[] {
		const files: TFile[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			const fm = this.frontmatterOf(file);
			if (fm && fm[locationField] != null) files.push(file);
		}
		return files;
	}

	itineraryItemFileFromLink(link: string, sourcePath: string): TFile | null {
		return resolveWikilink(this.app, link, sourcePath);
	}
}
