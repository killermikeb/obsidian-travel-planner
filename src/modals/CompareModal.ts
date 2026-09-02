import { App, Modal } from "obsidian";
import type { ItineraryItemRecord } from "../types";
import { ITINERARY_STATUS_LABEL } from "../noteFactory";

/** Side-by-side comparison table for a set of itinerary items. */
export class CompareModal extends Modal {
	constructor(
		app: App,
		private items: ItineraryItemRecord[],
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Compare itinerary items" });

		const table = contentEl.createEl("table", { cls: "ptp-compare-table" });
		const headRow = table.createEl("tr");
		headRow.createEl("th", { text: "" });
		for (const item of this.items) {
			headRow.createEl("th", { text: item.displayName });
		}

		const rows: [string, (item: ItineraryItemRecord) => string][] = [
			["Status", (i) => ITINERARY_STATUS_LABEL[i.status]],
			["Priority", (i) => String(i.priority)],
			["Duration", (i) => (i.durationMin != null ? `${i.durationMin} min` : "—")],
			["Cost", (i) => (i.cost != null ? String(i.cost) : "—")],
			["Tags", (i) => (i.tags.length ? i.tags.join(", ") : "—")],
		];

		for (const [label, getValue] of rows) {
			const row = table.createEl("tr");
			row.createEl("td", { text: label, cls: "ptp-compare-label" });
			for (const item of this.items) {
				row.createEl("td", { text: getValue(item) });
			}
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
