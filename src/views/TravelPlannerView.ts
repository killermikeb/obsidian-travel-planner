import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import type TravelPlannerPlugin from "../main";
import { VaultIndex, waitForFileMetadata } from "../vaultIndex";
import { resolveWikilink, toWikilink } from "../links";
import {
	createDayPlanNote,
	createItineraryItemNote,
	createTripNote,
	ITINERARY_STATUS_LABEL,
} from "../noteFactory";
import { ITINERARY_STATUSES, type ItineraryItemRecord, type ItineraryStatus } from "../types";
import { openMapViewWithQuery, pathsQuery, tripQuery } from "../mapview";
import { PlaceSuggestModal } from "../modals/PlaceSuggestModal";
import { ItinerarySuggestModal } from "../modals/ItinerarySuggestModal";
import { NewTripModal } from "../modals/NewTripModal";
import { NewDayPlanModal } from "../modals/NewDayPlanModal";
import { CompareModal } from "../modals/CompareModal";

export const TRAVEL_PLANNER_VIEW_TYPE = "travel-planner-view";

type Tab = "itinerary" | "dayplans";

export class TravelPlannerView extends ItemView {
	private index: VaultIndex;
	private selectedTripPath: string | null = null;
	private activeTab: Tab = "itinerary";
	private compareSelection = new Set<string>();

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: TravelPlannerPlugin,
	) {
		super(leaf);
		this.index = new VaultIndex(this.app);
	}

	getViewType(): string {
		return TRAVEL_PLANNER_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Travel Planner";
	}

	getIcon(): string {
		return "map-pin";
	}

	async onOpen(): Promise<void> {
		this.registerEvent(this.app.metadataCache.on("changed", () => this.render()));
		this.registerEvent(this.app.vault.on("delete", () => this.render()));
		this.render();
	}

	refresh(): void {
		this.render();
	}

	private render(): void {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("ptp-view");

		const trips = this.index.getTrips();
		if (this.selectedTripPath && !trips.some((t) => t.file === this.selectedTripPath)) {
			this.selectedTripPath = null;
		}

		const header = container.createDiv({ cls: "ptp-header" });
		header.createEl("h3", { text: "Travel Planner" });

		const tripRow = container.createDiv({ cls: "ptp-trip-row" });
		const select = tripRow.createEl("select");
		select.createEl("option", { text: trips.length ? "Choose a trip…" : "No trips yet", value: "" });
		for (const trip of trips) {
			const option = select.createEl("option", { text: trip.name, value: trip.file });
			if (trip.file === this.selectedTripPath) option.selected = true;
		}
		select.onchange = () => {
			this.selectedTripPath = select.value || null;
			this.compareSelection.clear();
			this.render();
		};

		tripRow.createEl("button", { text: "+ New trip" }).onclick = () => {
			new NewTripModal(this.app, async (name, start, end) => {
				const file = await createTripNote(this.app, this.plugin.settings, name, start, end);
				await waitForFileMetadata(this.app, file);
				this.selectedTripPath = file.path;
				this.render();
			}).open();
		};

		const trip = trips.find((t) => t.file === this.selectedTripPath);
		if (!trip) {
			container.createEl("p", {
				text: "Pick a trip above, or create a new one, to plan its itinerary and day plans.",
				cls: "ptp-empty",
			});
			return;
		}

		const tripActions = container.createDiv({ cls: "ptp-trip-actions" });
		tripActions.createEl("button", { text: "Open trip note" }).onclick = () => {
			const file = this.app.vault.getAbstractFileByPath(trip.file);
			if (file instanceof TFile) this.app.workspace.getLeaf(false).openFile(file);
		};
		tripActions.createEl("button", { text: "Open trip in Map View" }).onclick = () => {
			void openMapViewWithQuery(this.app, tripQuery(trip.tag));
		};

		const tabs = container.createDiv({ cls: "ptp-tabs" });
		const itineraryTab = tabs.createEl("button", { text: "Itinerary" });
		const dayPlansTab = tabs.createEl("button", { text: "Day Plans" });
		itineraryTab.toggleClass("ptp-tab-active", this.activeTab === "itinerary");
		dayPlansTab.toggleClass("ptp-tab-active", this.activeTab === "dayplans");
		itineraryTab.onclick = () => {
			this.activeTab = "itinerary";
			this.render();
		};
		dayPlansTab.onclick = () => {
			this.activeTab = "dayplans";
			this.render();
		};

		const body = container.createDiv({ cls: "ptp-body" });
		if (this.activeTab === "itinerary") {
			this.renderItinerary(body, trip.file, trip.name, trip.tag);
		} else {
			this.renderDayPlans(body, trip.file, trip.name, trip.tag);
		}
	}

	// ---------------------------------------------------------------- Itinerary

	private renderItinerary(body: HTMLElement, tripFile: string, tripName: string, tripTag: string): void {
		const items = this.index.getItineraryItems(tripFile);

		const actions = body.createDiv({ cls: "ptp-actions" });
		actions.createEl("button", { text: "+ Add place" }).onclick = () =>
			this.addItineraryItem(tripFile, tripName, tripTag);

		const compareBtn = actions.createEl("button", { text: "Compare selected" });
		compareBtn.disabled = this.compareSelection.size < 2;
		compareBtn.onclick = () => {
			const selected = items.filter((i) => this.compareSelection.has(i.file));
			new CompareModal(this.app, selected).open();
		};

		if (items.length === 0) {
			body.createEl("p", { text: "No itinerary items yet.", cls: "ptp-empty" });
			return;
		}

		const list = body.createDiv({ cls: "ptp-list" });
		items.forEach((item, index) => {
			const row = list.createDiv({ cls: "ptp-item-row" });

			const checkbox = row.createEl("input", { type: "checkbox" });
			checkbox.checked = this.compareSelection.has(item.file);
			checkbox.onchange = () => {
				if (checkbox.checked) this.compareSelection.add(item.file);
				else this.compareSelection.delete(item.file);
				this.render();
			};

			const name = row.createEl("a", { text: item.displayName, cls: "ptp-item-name" });
			name.onclick = (evt) => {
				evt.preventDefault();
				const file = this.app.vault.getAbstractFileByPath(item.file);
				if (file instanceof TFile) this.app.workspace.getLeaf(false).openFile(file);
			};

			const statusSelect = row.createEl("select");
			for (const status of ITINERARY_STATUSES) {
				const opt = statusSelect.createEl("option", {
					text: ITINERARY_STATUS_LABEL[status],
					value: status,
				});
				if (status === item.status) opt.selected = true;
			}
			statusSelect.onchange = () =>
				this.updateItineraryItem(item.file, { "ptp-status": statusSelect.value as ItineraryStatus });

			const upBtn = row.createEl("button", { text: "↑", cls: "ptp-icon-btn" });
			upBtn.disabled = index === 0;
			upBtn.onclick = () => this.swapPriority(items, index, index - 1);

			const downBtn = row.createEl("button", { text: "↓", cls: "ptp-icon-btn" });
			downBtn.disabled = index === items.length - 1;
			downBtn.onclick = () => this.swapPriority(items, index, index + 1);

			const removeBtn = row.createEl("button", { text: "✕", cls: "ptp-icon-btn" });
			removeBtn.onclick = async () => {
				const file = this.app.vault.getAbstractFileByPath(item.file);
				if (file instanceof TFile) await this.app.vault.trash(file, true);
				this.render();
			};
		});
	}

	private async addItineraryItem(tripFile: string, tripName: string, tripTag: string): Promise<void> {
		const places = this.index.getPlaceCandidates(this.plugin.settings.placeLocationField);
		if (places.length === 0) {
			new Notice(
				`No notes found with a "${this.plugin.settings.placeLocationField}" frontmatter field. ` +
					"Add that field (Map View's location format) to a place note first.",
			);
			return;
		}
		const tripTFile = this.app.vault.getAbstractFileByPath(tripFile);
		if (!(tripTFile instanceof TFile)) return;

		new PlaceSuggestModal(this.app, places, async (place) => {
			const existing = this.index.getItineraryItems(tripFile);
			const nextPriority = existing.length
				? Math.max(...existing.map((i) => i.priority)) + 1
				: 0;
			const file = await createItineraryItemNote(
				this.app,
				this.plugin.settings,
				tripTFile,
				tripName,
				tripTag,
				place,
				nextPriority,
			);
			await waitForFileMetadata(this.app, file);
			this.app.workspace.getLeaf(false).openFile(file);
			this.render();
		}).open();
	}

	private async updateItineraryItem(path: string, patch: Record<string, unknown>): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			Object.assign(fm, patch);
		});
		this.render();
	}

	private async swapPriority(items: ItineraryItemRecord[], a: number, b: number): Promise<void> {
		const itemA = items[a];
		const itemB = items[b];
		await this.updateItineraryItem(itemA.file, { "ptp-priority": itemB.priority });
		await this.updateItineraryItem(itemB.file, { "ptp-priority": itemA.priority });
	}

	// ---------------------------------------------------------------- Day plans

	private renderDayPlans(body: HTMLElement, tripFile: string, tripName: string, tripTag: string): void {
		const dayPlans = this.index.getDayPlans(tripFile);
		const allItems = this.index.getItineraryItems(tripFile);

		const actions = body.createDiv({ cls: "ptp-actions" });
		actions.createEl("button", { text: "+ New day plan" }).onclick = () => {
			const tripTFile = this.app.vault.getAbstractFileByPath(tripFile);
			if (!(tripTFile instanceof TFile)) return;
			new NewDayPlanModal(this.app, async (date) => {
				const file = await createDayPlanNote(
					this.app,
					this.plugin.settings,
					tripTFile,
					tripName,
					tripTag,
					date,
				);
				await waitForFileMetadata(this.app, file);
				this.app.workspace.getLeaf(false).openFile(file);
				this.render();
			}).open();
		};

		if (dayPlans.length === 0) {
			body.createEl("p", { text: "No day plans yet.", cls: "ptp-empty" });
			return;
		}

		for (const plan of dayPlans) {
			const section = body.createDiv({ cls: "ptp-dayplan" });
			const heading = section.createDiv({ cls: "ptp-dayplan-heading" });
			heading.createEl("strong", { text: plan.date || "Flex day" });

			const openNoteBtn = heading.createEl("button", { text: "Open note", cls: "ptp-icon-btn" });
			openNoteBtn.onclick = () => {
				const file = this.app.vault.getAbstractFileByPath(plan.file);
				if (file instanceof TFile) this.app.workspace.getLeaf(false).openFile(file);
			};

			const candidateItems = plan.candidates
				.map((link) => {
					const file = resolveWikilink(this.app, link, plan.file);
					return file ? allItems.find((i) => i.file === file.path) : undefined;
				})
				.filter((i): i is ItineraryItemRecord => Boolean(i));

			const mapBtn = heading.createEl("button", { text: "Compare on map", cls: "ptp-icon-btn" });
			mapBtn.disabled = candidateItems.length === 0;
			mapBtn.onclick = () => {
				const placePaths = candidateItems
					.map((i) => resolveWikilink(this.app, i.placeLink, i.file)?.path)
					.filter((p): p is string => Boolean(p));
				void openMapViewWithQuery(this.app, pathsQuery(placePaths));
			};

			const addCandidateBtn = heading.createEl("button", { text: "+ Add candidate", cls: "ptp-icon-btn" });
			addCandidateBtn.onclick = () => {
				const existingPaths = new Set(candidateItems.map((i) => i.file));
				const choices = allItems.filter((i) => !existingPaths.has(i.file));
				if (choices.length === 0) {
					new Notice("Every itinerary item is already a candidate for this day.");
					return;
				}
				new ItinerarySuggestModal(this.app, choices, async (item) => {
					await this.updateDayPlan(plan.file, (fm) => {
						const candidates = Array.isArray(fm["ptp-candidates"])
							? (fm["ptp-candidates"] as string[])
							: [];
						const itemFile = this.app.vault.getAbstractFileByPath(item.file);
						if (itemFile instanceof TFile) {
							candidates.push(toWikilink(this.app, itemFile, plan.file));
						}
						fm["ptp-candidates"] = candidates;
					});
				}).open();
			};

			if (candidateItems.length === 0) {
				section.createEl("p", { text: "No candidates yet.", cls: "ptp-empty" });
				continue;
			}

			const list = section.createDiv({ cls: "ptp-list" });
			for (const item of candidateItems) {
				const row = list.createDiv({ cls: "ptp-item-row" });
				const isChosen = plan.chosen && resolveWikilink(this.app, plan.chosen, plan.file)?.path === item.file;

				const chooseBtn = row.createEl("button", {
					text: isChosen ? "★ Chosen" : "☆ Choose",
					cls: "ptp-icon-btn",
				});
				chooseBtn.onclick = () =>
					this.updateDayPlan(plan.file, (fm) => {
						const itemFile = this.app.vault.getAbstractFileByPath(item.file);
						if (itemFile instanceof TFile) {
							fm["ptp-chosen"] = isChosen ? "" : toWikilink(this.app, itemFile, plan.file);
						}
					});

				const name = row.createEl("a", { text: item.displayName, cls: "ptp-item-name" });
				name.onclick = (evt) => {
					evt.preventDefault();
					const file = this.app.vault.getAbstractFileByPath(item.file);
					if (file instanceof TFile) this.app.workspace.getLeaf(false).openFile(file);
				};

				row.createEl("span", { text: ITINERARY_STATUS_LABEL[item.status], cls: "ptp-status-badge" });

				const removeBtn = row.createEl("button", { text: "✕", cls: "ptp-icon-btn" });
				removeBtn.onclick = () =>
					this.updateDayPlan(plan.file, (fm) => {
						const candidates = Array.isArray(fm["ptp-candidates"])
							? (fm["ptp-candidates"] as string[])
							: [];
						fm["ptp-candidates"] = candidates.filter(
							(link) => resolveWikilink(this.app, link, plan.file)?.path !== item.file,
						);
						if (isChosen) fm["ptp-chosen"] = "";
					});
			}

			if (candidateItems.length >= 2) {
				const compareBtn = section.createEl("button", { text: "Compare candidates" });
				compareBtn.onclick = () => new CompareModal(this.app, candidateItems).open();
			}
		}
	}

	private async updateDayPlan(
		path: string,
		mutate: (fm: Record<string, unknown>) => void,
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		await this.app.fileManager.processFrontMatter(file, mutate);
		this.render();
	}
}
