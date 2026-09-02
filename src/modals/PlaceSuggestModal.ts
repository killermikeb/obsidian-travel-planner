import { App, FuzzySuggestModal, TFile } from "obsidian";

export class PlaceSuggestModal extends FuzzySuggestModal<TFile> {
	constructor(
		app: App,
		private places: TFile[],
		private onChoose: (file: TFile) => void,
	) {
		super(app);
		this.setPlaceholder("Choose a place note to add to this trip's itinerary…");
	}

	getItems(): TFile[] {
		return this.places;
	}

	getItemText(item: TFile): string {
		return item.basename;
	}

	onChooseItem(item: TFile): void {
		this.onChoose(item);
	}
}
