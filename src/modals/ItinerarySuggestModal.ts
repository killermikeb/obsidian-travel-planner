import { App, FuzzySuggestModal } from "obsidian";
import type { ItineraryItemRecord } from "../types";

export class ItinerarySuggestModal extends FuzzySuggestModal<ItineraryItemRecord> {
	constructor(
		app: App,
		private items: ItineraryItemRecord[],
		private onChoose: (item: ItineraryItemRecord) => void,
	) {
		super(app);
		this.setPlaceholder("Choose an itinerary item…");
	}

	getItems(): ItineraryItemRecord[] {
		return this.items;
	}

	getItemText(item: ItineraryItemRecord): string {
		return item.displayName;
	}

	onChooseItem(item: ItineraryItemRecord): void {
		this.onChoose(item);
	}
}
