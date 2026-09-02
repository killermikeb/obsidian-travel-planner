import { App, PluginSettingTab, Setting } from "obsidian";
import type TravelPlannerPlugin from "./main";

export interface TravelPlannerSettings {
	tripsFolder: string;
	itineraryFolder: string;
	dayPlansFolder: string;
	tagPrefix: string;
	placeLocationField: string;
}

export const DEFAULT_SETTINGS: TravelPlannerSettings = {
	tripsFolder: "Travel/Trips",
	itineraryFolder: "Travel/Itinerary",
	dayPlansFolder: "Travel/Day Plans",
	tagPrefix: "trip",
	placeLocationField: "location",
};

export class TravelPlannerSettingTab extends PluginSettingTab {
	plugin: TravelPlannerPlugin;

	constructor(app: App, plugin: TravelPlannerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Travel Planner" });

		new Setting(containerEl)
			.setName("Trips folder")
			.setDesc("Where new trip notes are created.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.tripsFolder)
					.onChange(async (value) => {
						this.plugin.settings.tripsFolder = value.trim() || DEFAULT_SETTINGS.tripsFolder;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Itinerary items folder")
			.setDesc("Where new itinerary item notes are created.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.itineraryFolder)
					.onChange(async (value) => {
						this.plugin.settings.itineraryFolder =
							value.trim() || DEFAULT_SETTINGS.itineraryFolder;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Day plans folder")
			.setDesc("Where new day plan notes are created.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.dayPlansFolder)
					.onChange(async (value) => {
						this.plugin.settings.dayPlansFolder =
							value.trim() || DEFAULT_SETTINGS.dayPlansFolder;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Trip tag prefix")
			.setDesc(
				"Each trip gets its own tag, '<prefix>/<trip-slug>', stamped onto its itinerary items " +
					"and day plans. Use this tag directly in Map View's query bar (e.g. 'tag:#trip/paris-2026') " +
					"to see only that trip's places on the map.",
			)
			.addText((text) =>
				text.setValue(this.plugin.settings.tagPrefix).onChange(async (value) => {
					this.plugin.settings.tagPrefix = value.trim() || DEFAULT_SETTINGS.tagPrefix;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Place location frontmatter field")
			.setDesc(
				"The frontmatter field Map View reads a note's coordinates from (its default is 'location'). " +
					"Only notes with this field are offered as places when adding an itinerary item.",
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.placeLocationField)
					.onChange(async (value) => {
						this.plugin.settings.placeLocationField =
							value.trim() || DEFAULT_SETTINGS.placeLocationField;
						await this.plugin.saveSettings();
					}),
			);
	}
}
