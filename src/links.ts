import { App, TFile } from "obsidian";

/** Build a `[[Wikilink]]` to `file`, shortest form Obsidian's own link resolution understands. */
export function toWikilink(app: App, file: TFile, sourcePath: string): string {
	const linkpath = app.metadataCache.fileToLinktext(file, sourcePath, false);
	return `[[${linkpath}]]`;
}

/** Strip the `[[...]]` and any `|alias` off a stored link string, leaving the raw linkpath. */
export function linkpathFromWikilink(link: string): string {
	const inner = link.trim().replace(/^\[\[/, "").replace(/\]\]$/, "");
	const pipeIndex = inner.indexOf("|");
	return pipeIndex === -1 ? inner : inner.substring(0, pipeIndex);
}

/** Resolve a stored `[[Wikilink]]` back to the TFile it points at, if it still exists. */
export function resolveWikilink(app: App, link: string, sourcePath: string): TFile | null {
	if (!link) return null;
	const linkpath = linkpathFromWikilink(link);
	return app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
}

/** Display text for a stored `[[Wikilink]]`: the alias if present, else the note's basename. */
export function wikilinkDisplayText(app: App, link: string, sourcePath: string): string {
	const inner = link.trim().replace(/^\[\[/, "").replace(/\]\]$/, "");
	const pipeIndex = inner.indexOf("|");
	if (pipeIndex !== -1) return inner.substring(pipeIndex + 1);
	const file = resolveWikilink(app, link, sourcePath);
	return file ? file.basename : inner;
}

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "trip";
}
