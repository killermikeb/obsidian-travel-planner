import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, TravelPlannerSettings, TravelPlannerSettingTab } from "./settings";
import { TRAVEL_PLANNER_VIEW_TYPE, TravelPlannerView } from "./views/TravelPlannerView";

export default class TravelPlannerPlugin extends Plugin {
	settings!: TravelPlannerSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(TRAVEL_PLANNER_VIEW_TYPE, (leaf) => new TravelPlannerView(leaf, this));

		this.addRibbonIcon("map-pin", "Open Travel Planner", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-travel-planner",
			name: "Open Travel Planner",
			callback: () => {
				void this.activateView();
			},
		});

		this.addSettingTab(new TravelPlannerSettingTab(this.app, this));
	}

	onunload(): void {
		// Views are torn down by the workspace itself; nothing to clean up here.
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(TRAVEL_PLANNER_VIEW_TYPE);
		let leaf: WorkspaceLeaf;
		if (existing.length > 0) {
			leaf = existing[0];
		} else {
			leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
			await leaf.setViewState({ type: TRAVEL_PLANNER_VIEW_TYPE, active: true });
		}
		workspace.revealLeaf(leaf);
		const view = leaf.view;
		if (view instanceof TravelPlannerView) view.refresh();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
