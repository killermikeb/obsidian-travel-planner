import { App, normalizePath, TFile } from "obsidian";
import { toWikilink, slugify } from "./links";
import { mapviewEmbed, tripQuery } from "./mapview";
import type { TravelPlannerSettings } from "./settings";
import type { ItineraryStatus } from "./types";

async function ensureFolder(app: App, folder: string): Promise<void> {
	const path = normalizePath(folder);
	if (!(await app.vault.adapter.exists(path))) {
		await app.vault.createFolder(path);
	}
}

async function createUniqueFile(app: App, folder: string, baseName: string, content: string): Promise<TFile> {
	await ensureFolder(app, folder);
	let name = baseName;
	let suffix = 2;
	while (await app.vault.adapter.exists(normalizePath(`${folder}/${name}.md`))) {
		name = `${baseName} ${suffix}`;
		suffix += 1;
	}
	return app.vault.create(normalizePath(`${folder}/${name}.md`), content);
}

function yamlString(value: string): string {
	return `"${value.replace(/"/g, '\\"')}"`;
}

export async function createTripNote(
	app: App,
	settings: TravelPlannerSettings,
	name: string,
	start: string,
	end: string,
): Promise<TFile> {
	const slug = slugify(name);
	const tag = `${settings.tagPrefix}/${slug}`;
	const lines = [
		"---",
		"ptp-type: trip",
		`ptp-name: ${yamlString(name)}`,
		`ptp-slug: ${yamlString(slug)}`,
		start ? `ptp-start: ${yamlString(start)}` : "ptp-start:",
		end ? `ptp-end: ${yamlString(end)}` : "ptp-end:",
		`ptp-tag: ${yamlString(tag)}`,
		"tags:",
		`  - ${tag}`,
		"---",
		"",
		`# ${name}`,
		"",
		"Open this trip from the Travel Planner view (ribbon icon, or the",
		"\"Open Travel Planner\" command) to add itinerary items and day plans.",
		"",
		"## Map",
		"",
		mapviewEmbed(tripQuery(tag)),
		"",
	];
	return createUniqueFile(app, settings.tripsFolder, name, lines.join("\n"));
}

export async function createItineraryItemNote(
	app: App,
	settings: TravelPlannerSettings,
	tripFile: TFile,
	tripName: string,
	tripTag: string,
	placeFile: TFile,
	nextPriority: number,
): Promise<TFile> {
	const tripLink = toWikilink(app, tripFile, settings.itineraryFolder);
	const placeLink = toWikilink(app, placeFile, settings.itineraryFolder);
	const lines = [
		"---",
		"ptp-type: itinerary-item",
		`ptp-trip: "${tripLink}"`,
		`ptp-place: "${placeLink}"`,
		"ptp-status: idea",
		`ptp-priority: ${nextPriority}`,
		"ptp-duration-min:",
		"ptp-cost:",
		"ptp-tags: []",
		"tags:",
		`  - ${tripTag}`,
		"---",
		"",
		`# ${placeFile.basename} — ${tripName}`,
		"",
		`Place: ${placeLink}`,
		`Trip: ${tripLink}`,
		"",
		"Notes on why this is worth doing, opening hours, booking links, etc.",
		"",
	];
	return createUniqueFile(
		app,
		settings.itineraryFolder,
		`${placeFile.basename} (${tripName})`,
		lines.join("\n"),
	);
}

export async function createDayPlanNote(
	app: App,
	settings: TravelPlannerSettings,
	tripFile: TFile,
	tripName: string,
	tripTag: string,
	date: string,
): Promise<TFile> {
	const tripLink = toWikilink(app, tripFile, settings.dayPlansFolder);
	const label = date || "Flex day";
	const lines = [
		"---",
		"ptp-type: day-plan",
		`ptp-trip: "${tripLink}"`,
		`ptp-date: ${date ? yamlString(date) : '""'}`,
		"ptp-candidates: []",
		"ptp-chosen:",
		"tags:",
		`  - ${tripTag}`,
		"---",
		"",
		`# ${tripName} — ${label}`,
		"",
		date
			? "A day with a fixed date. Add candidate itinerary items below and mark one chosen once you've decided."
			: "A flex day — no date yet. Keep several candidate itinerary items here until it's clear which day this becomes.",
		"",
	];
	return createUniqueFile(app, settings.dayPlansFolder, `${tripName} — ${label}`, lines.join("\n"));
}

export const ITINERARY_STATUS_LABEL: Record<ItineraryStatus, string> = {
	idea: "Idea",
	considering: "Considering",
	planned: "Planned",
	booked: "Booked",
	skipped: "Skipped",
};
