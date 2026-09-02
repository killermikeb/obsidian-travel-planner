import { App, Modal, Setting } from "obsidian";

export class NewTripModal extends Modal {
	private name = "";
	private start = "";
	private end = "";

	constructor(
		app: App,
		private onSubmit: (name: string, start: string, end: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "New trip" });

		new Setting(contentEl).setName("Name").addText((text) =>
			text.setPlaceholder("Paris 2026").onChange((value) => (this.name = value)),
		);
		new Setting(contentEl)
			.setName("Start date")
			.setDesc("Optional")
			.addText((text) => {
				text.inputEl.type = "date";
				text.onChange((value) => (this.start = value));
			});
		new Setting(contentEl)
			.setName("End date")
			.setDesc("Optional")
			.addText((text) => {
				text.inputEl.type = "date";
				text.onChange((value) => (this.end = value));
			});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Create trip")
				.setCta()
				.onClick(() => {
					if (!this.name.trim()) return;
					this.close();
					this.onSubmit(this.name.trim(), this.start, this.end);
				}),
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
