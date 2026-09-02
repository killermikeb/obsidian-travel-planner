import { App, Modal, Setting } from "obsidian";

export class NewDayPlanModal extends Modal {
	private date = "";
	private flex = false;

	constructor(
		app: App,
		private onSubmit: (date: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "New day plan" });

		const dateSetting = new Setting(contentEl).setName("Date").addText((text) => {
			text.inputEl.type = "date";
			text.onChange((value) => (this.date = value));
		});

		new Setting(contentEl)
			.setName("Flex day")
			.setDesc("No fixed date yet — keep candidate itinerary items here until it's clear which day this becomes.")
			.addToggle((toggle) =>
				toggle.onChange((value) => {
					this.flex = value;
					dateSetting.settingEl.toggleClass("ptp-hidden", value);
				}),
			);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Create day plan")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.flex ? "" : this.date);
				}),
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
