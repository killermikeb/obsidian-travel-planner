/**
 * Frontmatter-level data model. Trips, itinerary items and day plans are all
 * ordinary notes in the vault; these interfaces describe the frontmatter
 * fields Travel Planner reads/writes on them. `ptp-type` marks which kind of
 * note it is so the index can find them with a plain frontmatter scan.
 */

export type PtpType = "trip" | "itinerary-item" | "day-plan";

export type ItineraryStatus = "idea" | "considering" | "planned" | "booked" | "skipped";

export interface TripFrontmatter {
	"ptp-type": "trip";
	"ptp-name": string;
	"ptp-slug": string;
	"ptp-start"?: string; // ISO date, optional
	"ptp-end"?: string; // ISO date, optional
	"ptp-tag": string; // e.g. "trip/paris-2026" - used for Map View queries
}

export interface ItineraryItemFrontmatter {
	"ptp-type": "itinerary-item";
	"ptp-trip": string; // wikilink to the trip note, as a raw string e.g. "[[Paris 2026]]"
	"ptp-place": string; // wikilink to the place note carrying the location
	"ptp-status": ItineraryStatus;
	"ptp-priority": number; // lower sorts first; used for manual ranking
	"ptp-duration-min"?: number; // estimated minutes on-site
	"ptp-cost"?: number;
	"ptp-tags"?: string[];
}

export interface DayPlanFrontmatter {
	"ptp-type": "day-plan";
	"ptp-trip": string; // wikilink to the trip note
	"ptp-date": string; // ISO date, or "" for a flex/unscheduled day
	"ptp-candidates": string[]; // wikilinks to itinerary-item notes
	"ptp-chosen"?: string; // wikilink to the chosen itinerary-item note, once decided
}

export interface TripRecord {
	file: string; // vault path
	name: string;
	slug: string;
	tag: string;
	start?: string;
	end?: string;
}

export interface ItineraryItemRecord {
	file: string;
	tripLink: string;
	placeLink: string;
	status: ItineraryStatus;
	priority: number;
	durationMin?: number;
	cost?: number;
	tags: string[];
	displayName: string;
}

export interface DayPlanRecord {
	file: string;
	tripLink: string;
	date: string;
	candidates: string[];
	chosen?: string;
	displayName: string;
}

export const ITINERARY_STATUSES: ItineraryStatus[] = [
	"idea",
	"considering",
	"planned",
	"booked",
	"skipped",
];
