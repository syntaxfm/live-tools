import { LOWER_THIRD_DISPLAY_MS } from '$lib/components/shows/room-protocol';
import type { LowerThirdView } from '$lib/components/shows/room-protocol';
import { OVERLAY_ANCHORS, OVERLAY_GRID_TRACKS } from '$lib/utils/overlays';
import type { OverlayAnchor } from '$lib/utils/overlays';

// Client-only stand-ins for overlay features that have no backend yet. Everything here exists
// to design the on-air look at /overlay?preview; none of it touches Room State.

export type OverlayLayer = 'footage' | 'timeline' | 'chat' | 'plugs';
export type StubTone = 'accent' | 'info' | 'purple' | 'coral' | 'success';
export type OverlayWidget = 'chat' | 'poll' | 'pinned';
export type WidgetSpan = 'columns' | 'rows';

export interface WidgetPlacement {
	anchorX: OverlayAnchor;
	anchorY: OverlayAnchor;
	columns: number;
	rows: number;
}

type WidgetPlacements = Record<OverlayWidget, WidgetPlacement>;

export const OVERLAY_WIDGETS: readonly { widget: OverlayWidget; label: string }[] = [
	{ widget: 'chat', label: 'Chat' },
	{ widget: 'poll', label: 'Poll' },
	{ widget: 'pinned', label: 'Featured comment' }
];

export const OVERLAY_LAYOUT_PRESETS: readonly {
	id: string;
	label: string;
	placements: WidgetPlacements;
}[] = [
	{
		id: 'rail',
		label: 'Left rail',
		placements: {
			pinned: { anchorX: 'start', anchorY: 'start', columns: 3, rows: 3 },
			chat: { anchorX: 'start', anchorY: 'center', columns: 3, rows: 5 },
			poll: { anchorX: 'start', anchorY: 'end', columns: 3, rows: 4 }
		}
	},
	{
		id: 'poll-top',
		label: 'Poll on top',
		placements: {
			poll: { anchorX: 'center', anchorY: 'start', columns: 12, rows: 3 },
			chat: { anchorX: 'end', anchorY: 'end', columns: 3, rows: 6 },
			pinned: { anchorX: 'start', anchorY: 'end', columns: 4, rows: 3 }
		}
	},
	{
		id: 'strips',
		label: 'Strips',
		placements: {
			chat: { anchorX: 'center', anchorY: 'start', columns: 12, rows: 1 },
			poll: { anchorX: 'center', anchorY: 'end', columns: 12, rows: 2 },
			pinned: { anchorX: 'start', anchorY: 'center', columns: 5, rows: 2 }
		}
	},
	{
		id: 'split',
		label: 'Split',
		placements: {
			chat: { anchorX: 'end', anchorY: 'center', columns: 3, rows: 12 },
			poll: { anchorX: 'start', anchorY: 'end', columns: 3, rows: 4 },
			pinned: { anchorX: 'center', anchorY: 'start', columns: 6, rows: 2 }
		}
	}
];

const PLACEMENTS_STORAGE_KEY = 'overlay-design-placements';

export interface StubTopic {
	id: string;
	title: string;
	lane: 0 | 1;
	startSeconds: number;
	durationSeconds: number;
}

export interface StubChatMessage {
	id: number;
	author: string;
	text: string;
	tone: StubTone;
}

export type StubPlatform = 'youtube' | 'twitch' | 'x';

export interface StubPinnedComment {
	author: string;
	text: string;
	platform: StubPlatform;
	avatarSrc: string;
}

export interface PopdownContent {
	label: string;
	value: string | number;
}

export interface StubPlug {
	text: string;
	kind: 'x' | 'sponsor' | 'link';
}

export interface StubPollOption {
	id: string;
	label: string;
	votes: number;
	weight: number;
}

export interface StubMeme {
	id: number;
	emoji: string;
	top: string;
	bottom: string;
	tone: StubTone;
}

export const OVERLAY_LAYERS: readonly { layer: OverlayLayer; label: string }[] = [
	{ layer: 'footage', label: 'Footage' },
	{ layer: 'timeline', label: 'Topics' },
	{ layer: 'chat', label: 'Chat' },
	{ layer: 'plugs', label: 'Plugs' }
];

export const STUB_PLUGS: readonly StubPlug[] = [
	{ text: '@wesbos', kind: 'x' },
	{ text: '@stolinski', kind: 'x' },
	{ text: '@w3cj', kind: 'x' },
	{ text: '@syntaxfm', kind: 'x' },
	{ text: 'Brought to you by', kind: 'sponsor' },
	{ text: 'syntax.fm', kind: 'link' },
	{ text: 'New episodes Monday, Wednesday and Friday', kind: 'link' }
];

export const STUB_HOSTS: readonly LowerThirdView[] = [
	{ showHostId: 'stub-wes', displayName: 'Wes Bos', lowerThirdTitle: 'Syntax host' },
	{ showHostId: 'stub-scott', displayName: 'Scott Tolinski', lowerThirdTitle: 'Syntax host' },
	{ showHostId: 'stub-cj', displayName: 'CJ Reynolds', lowerThirdTitle: 'Syntax host' },
	{ showHostId: 'stub-randy', displayName: 'Randy Rektor', lowerThirdTitle: 'Syntax producer' }
];

export const STUB_POLL_QUESTION = 'Would you let an agent drive your desktop?';

export const STUB_MEMES: readonly Omit<StubMeme, 'id'>[] = [
	{ emoji: '🔥', top: 'This is fine', bottom: 'Shipped on a Friday', tone: 'coral' },
	{ emoji: '🤖', top: 'Agent said', bottom: 'Trust me bro', tone: 'info' },
	{ emoji: '💅', top: 'CSS Tricks', bottom: 'Is so back', tone: 'purple' }
];

export const STUB_TOPICS: readonly StubTopic[] = [
	{ id: 'open', title: 'Cold open', lane: 0, startSeconds: 0, durationSeconds: 184 },
	{ id: 'news', title: 'Web news roundup', lane: 0, startSeconds: 184, durationSeconds: 540 },
	{
		id: 'reddit',
		title: 'Reddit locking its doors',
		lane: 1,
		startSeconds: 724,
		durationSeconds: 960
	},
	{
		id: 'agent',
		title: 'Agent Desktop is cool',
		lane: 1,
		startSeconds: 1684,
		durationSeconds: 1260
	},
	{ id: 'css', title: 'CSS Tricks is back', lane: 0, startSeconds: 2944, durationSeconds: 900 },
	{ id: 'picks', title: 'Sick picks and plugs', lane: 1, startSeconds: 3844, durationSeconds: 480 }
];

function getStubAvatarSrc(author: string): string {
	return `https://api.dicebear.com/9.x/notionists/svg?seed=${author}&backgroundColor=ffd54a`;
}

const STUB_PINNED: readonly StubPinnedComment[] = [
	{
		author: 'tabs_over_spaces',
		text: 'Been listening since episode 1. Still the best hour of my week.',
		platform: 'youtube',
		avatarSrc: getStubAvatarSrc('tabs_over_spaces')
	},
	{
		author: 'css_gremlin',
		text: 'Can we get a full episode on view transitions next?',
		platform: 'twitch',
		avatarSrc: getStubAvatarSrc('css_gremlin')
	},
	{
		author: 'deno_dad',
		text: 'Reminder that Scott promised to try this live last week.',
		platform: 'x',
		avatarSrc: getStubAvatarSrc('deno_dad')
	}
];

const STUB_AUTHORS: readonly string[] = [
	'tabs_over_spaces',
	'css_gremlin',
	'deno_dad',
	'flexbox_fiona',
	'null_pointer',
	'grid_lock',
	'semver_sam',
	'hotreload_hana'
];

const STUB_CHAT_LINES: readonly string[] = [
	'this is the content i subscribed for',
	'wait that demo actually worked??',
	'first time catching this live',
	'W take',
	'Scott has the best mustache in tech',
	'can you zoom in on that?',
	'my agent just deleted my node_modules, thanks',
	'greetings from Halifax',
	'the CSS Tricks comeback has me emotional',
	'who else is watching at work',
	'that is absolutely a skill issue',
	'please sell this as a sticker',
	'hot reload is a lifestyle',
	'RIP old reddit',
	'+1 for a view transitions episode'
];

const STUB_TONES: readonly StubTone[] = ['accent', 'info', 'purple', 'coral', 'success'];
const CHAT_HISTORY_LIMIT = 16;
const MEME_DISPLAY_MS = 6000;
const POPDOWN_DISPLAY_MS = 6000;
const CHAT_BURST_MS = 4000;
const POLL_TICK_MS = 450;

function pickRandom<T>(items: readonly T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

function createPollOptions(): StubPollOption[] {
	return [
		{ id: 'yes', label: 'Absolutely', votes: 12, weight: 3 },
		{ id: 'vm', label: 'Only in a VM', votes: 18, weight: 5 },
		{ id: 'no', label: 'Never', votes: 7, weight: 2 },
		{ id: 'regret', label: 'I did and I regret it', votes: 9, weight: 3 }
	];
}

function isValidSpan(value: unknown): boolean {
	return typeof value === 'number' && value >= 1 && value <= OVERLAY_GRID_TRACKS;
}

function isWidgetPlacement(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const { anchorX, anchorY, columns, rows } = value as Partial<WidgetPlacement>;
	return (
		OVERLAY_ANCHORS.some((anchor) => anchor === anchorX) &&
		OVERLAY_ANCHORS.some((anchor) => anchor === anchorY) &&
		isValidSpan(columns) &&
		isValidSpan(rows)
	);
}

function getDefaultPlacements(): WidgetPlacements {
	return structuredClone(OVERLAY_LAYOUT_PRESETS[0].placements);
}

function loadPlacements(): WidgetPlacements {
	try {
		const stored: unknown = JSON.parse(localStorage.getItem(PLACEMENTS_STORAGE_KEY) ?? 'null');
		if (typeof stored === 'object' && stored !== null) {
			const candidate = stored as Partial<WidgetPlacements>;
			if (OVERLAY_WIDGETS.every(({ widget }) => isWidgetPlacement(candidate[widget]))) {
				return candidate as WidgetPlacements;
			}
		}
	} catch (error) {
		console.error('Unable to read saved overlay layout', error);
	}
	return getDefaultPlacements();
}

export class OverlayDesignState {
	placements = $state<WidgetPlacements>(loadPlacements());
	layers = $state<Record<OverlayLayer, boolean>>({
		footage: true,
		timeline: true,
		chat: true,
		plugs: true
	});
	lowerThird = $state.raw<LowerThirdView | null>(null);
	isTopicRailroad = $state(false);
	isBottomBarDocked = $state(true);
	isFootageCropped = $state(true);
	topicIndex = $state(2);
	elapsedSeconds = $state(STUB_TOPICS[2].startSeconds + 240);
	chat = $state.raw<StubChatMessage[]>([]);
	pinned = $state.raw<StubPinnedComment | null>(STUB_PINNED[0]);
	pollOptions = $state.raw<StubPollOption[] | null>(createPollOptions());
	meme = $state.raw<StubMeme | null>(null);
	popdown = $state.raw<(PopdownContent & { id: number }) | null>(null);

	#nextId = 1;
	#pinnedIndex = 0;
	#agenticCount = 2;
	#popdownTimer: ReturnType<typeof setTimeout> | null = null;
	#burstUntil = 0;
	#isRunning = false;
	#chatTimer: ReturnType<typeof setTimeout> | null = null;
	#memeTimer: ReturnType<typeof setTimeout> | null = null;
	#lowerThirdTimer: ReturnType<typeof setTimeout> | null = null;
	#clockTimer: ReturnType<typeof setInterval> | null = null;
	#pollTimer: ReturnType<typeof setInterval> | null = null;

	start(): () => void {
		this.#isRunning = true;
		this.chat = Array.from({ length: 8 }, () => this.#createChatMessage());
		this.#scheduleChat();
		this.#clockTimer = setInterval(() => {
			this.elapsedSeconds += 1;
		}, 1000);
		this.#pollTimer = setInterval(() => this.#addPollVotes(), POLL_TICK_MS);
		return () => this.#stop();
	}

	toggleLayer(layer: OverlayLayer): void {
		this.layers[layer] = !this.layers[layer];
	}

	toggleTopicStyle(): void {
		this.isTopicRailroad = !this.isTopicRailroad;
	}

	setWidgetAnchor(widget: OverlayWidget, anchorX: OverlayAnchor, anchorY: OverlayAnchor): void {
		this.placements[widget].anchorX = anchorX;
		this.placements[widget].anchorY = anchorY;
		this.#savePlacements();
	}

	setWidgetSpan(widget: OverlayWidget, span: WidgetSpan, value: number): void {
		this.placements[widget][span] = value;
		this.#savePlacements();
	}

	applyLayoutPreset(id: string): void {
		const preset = OVERLAY_LAYOUT_PRESETS.find((candidate) => candidate.id === id);
		if (!preset) {
			return;
		}
		this.placements = structuredClone(preset.placements);
		this.#savePlacements();
	}

	#savePlacements(): void {
		try {
			localStorage.setItem(PLACEMENTS_STORAGE_KEY, JSON.stringify(this.placements));
		} catch (error) {
			console.error('Unable to save overlay layout', error);
		}
	}

	toggleBottomBarDocked(): void {
		this.isBottomBarDocked = !this.isBottomBarDocked;
	}

	toggleFootageCropped(): void {
		this.isFootageCropped = !this.isFootageCropped;
	}

	showEverything(): void {
		for (const { layer } of OVERLAY_LAYERS) {
			this.layers[layer] = true;
		}
		this.pinned ??= STUB_PINNED[0];
		this.pollOptions ??= createPollOptions();
	}

	clearFrame(): void {
		for (const { layer } of OVERLAY_LAYERS) {
			this.layers[layer] = layer === 'footage';
		}
		this.pinned = null;
		this.pollOptions = null;
		this.clearMeme();
		this.hideLowerThird();
		this.hidePopdown();
	}

	broadcast(host: LowerThirdView): void {
		this.lowerThird = host;
		if (this.#lowerThirdTimer) {
			clearTimeout(this.#lowerThirdTimer);
		}
		this.#lowerThirdTimer = setTimeout(() => this.hideLowerThird(), LOWER_THIRD_DISPLAY_MS);
	}

	// The single entry point for popdowns: the dock calls it today, an AI agent will later.
	showPopdown(content: PopdownContent): void {
		this.popdown = { ...content, id: this.#nextId++ };
		if (this.#popdownTimer) {
			clearTimeout(this.#popdownTimer);
		}
		this.#popdownTimer = setTimeout(() => this.hidePopdown(), POPDOWN_DISPLAY_MS);
	}

	hidePopdown(): void {
		if (this.#popdownTimer) {
			clearTimeout(this.#popdownTimer);
			this.#popdownTimer = null;
		}
		this.popdown = null;
	}

	showExploitPopdown(): void {
		this.showPopdown({ label: 'Days since exploit', value: 0 });
	}

	showAgenticPopdown(): void {
		this.#agenticCount += 1;
		this.showPopdown({ label: 'Agentic count', value: this.#agenticCount });
	}

	hideLowerThird(): void {
		if (this.#lowerThirdTimer) {
			clearTimeout(this.#lowerThirdTimer);
			this.#lowerThirdTimer = null;
		}
		this.lowerThird = null;
	}

	moveTopic(direction: 1 | -1): void {
		const nextIndex = this.topicIndex + direction;
		if (nextIndex < 0 || nextIndex >= STUB_TOPICS.length) {
			return;
		}
		this.topicIndex = nextIndex;
		this.elapsedSeconds = STUB_TOPICS[nextIndex].startSeconds + 5;
	}

	burstChat(): void {
		this.#burstUntil = Date.now() + CHAT_BURST_MS;
		if (this.#chatTimer) {
			clearTimeout(this.#chatTimer);
		}
		this.#scheduleChat();
	}

	pinNext(): void {
		this.#pinnedIndex = (this.#pinnedIndex + 1) % STUB_PINNED.length;
		this.pinned = STUB_PINNED[this.#pinnedIndex];
	}

	unpin(): void {
		this.pinned = null;
	}

	togglePoll(): void {
		this.pollOptions = this.pollOptions ? null : createPollOptions();
	}

	showMeme(index: number): void {
		this.meme = { ...STUB_MEMES[index], id: this.#nextId++ };
		if (this.#memeTimer) {
			clearTimeout(this.#memeTimer);
		}
		this.#memeTimer = setTimeout(() => this.clearMeme(), MEME_DISPLAY_MS);
	}

	clearMeme(): void {
		if (this.#memeTimer) {
			clearTimeout(this.#memeTimer);
			this.#memeTimer = null;
		}
		this.meme = null;
	}

	#createChatMessage(): StubChatMessage {
		return {
			id: this.#nextId++,
			author: pickRandom(STUB_AUTHORS),
			text: pickRandom(STUB_CHAT_LINES),
			tone: pickRandom(STUB_TONES)
		};
	}

	#scheduleChat(): void {
		if (!this.#isRunning) {
			return;
		}
		const isBursting = Date.now() < this.#burstUntil;
		const delay = isBursting ? randomBetween(90, 220) : randomBetween(700, 2200);
		this.#chatTimer = setTimeout(() => {
			this.chat = [...this.chat, this.#createChatMessage()].slice(-CHAT_HISTORY_LIMIT);
			this.#scheduleChat();
		}, delay);
	}

	#addPollVotes(): void {
		if (!this.pollOptions) {
			return;
		}
		this.pollOptions = this.pollOptions.map((option) => ({
			...option,
			votes: option.votes + Math.round(Math.random() * option.weight)
		}));
	}

	#stop(): void {
		this.#isRunning = false;
		for (const timer of [
			this.#chatTimer,
			this.#memeTimer,
			this.#lowerThirdTimer,
			this.#popdownTimer
		]) {
			if (timer) {
				clearTimeout(timer);
			}
		}
		for (const timer of [this.#clockTimer, this.#pollTimer]) {
			if (timer) {
				clearInterval(timer);
			}
		}
	}
}
