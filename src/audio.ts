import { Howl, Howler } from "howler";
import bundle_sound, { type Bundle_soundAliases } from "./bundle_sound.ts";

export type SoundAlias = Bundle_soundAliases;
export type SoundChannel = "sfx" | "music";

type SoundAsset = { alias: string; src: string };

const soundAssets = bundle_sound.assets as readonly SoundAsset[];

export interface PlayOptions {
    volume?: number;
    rate?: number;
}

export interface MusicOptions extends PlayOptions {
    /** Fade-in time in seconds. */
    fade?: number;
}

interface AudioSettings {
    master: number;
    sfx: number;
    music: number;
    muted: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
    master: 1,
    sfx: 0.8,
    music: 0.7,
    muted: false,
};

/**
 * A playing sound that can be stopped or re-tuned later. One-shot sounds can
 * be fire-and-forget; keep the handle for loops and music.
 */
export class SoundHandle {
    private stopped = false;

    constructor(
        private readonly manager: AudioManager,
        readonly howl: Howl,
        readonly id: number,
        readonly channel: SoundChannel,
        private baseVolume: number
    ) {
        this.applyVolume();
    }

    get volume(): number {
        return this.baseVolume;
    }

    setVolume(volume: number): this {
        this.baseVolume = clamp01(volume);
        this.applyVolume();
        return this;
    }

    setRate(rate: number): this {
        this.howl.rate(rate, this.id);
        return this;
    }

    stop(fade = 0): void {
        if (this.stopped) return;
        this.stopped = true;
        this.manager.unregister(this);

        if (fade > 0) {
            const current = this.howl.volume(this.id) as number;
            this.howl.fade(current, 0, fade * 1000, this.id);
            window.setTimeout(() => this.howl.stop(this.id), fade * 1000);
        } else {
            this.howl.stop(this.id);
        }
    }

    private applyVolume() {
        this.howl.volume(this.baseVolume * this.manager.channelVolume(this.channel), this.id);
    }
}

/**
 * Central audio bus.
 *
 * All bundled sounds are preloaded on `preload()` so the first play has no
 * delay. Volumes and mute state are persisted in localStorage.
 */
export class AudioManager {
    private readonly cache = new Map<string, Howl>();
    private readonly aliases = new Map<string, string>();
    private readonly handles = new Set<SoundHandle>();
    private settings: AudioSettings;
    private musicHandle?: SoundHandle;
    private preloaded = false;

    constructor() {
        for (const asset of soundAssets) {
            this.aliases.set(asset.alias, asset.src);
        }
        this.settings = this.loadSettings();
        Howler.autoUnlock = true;
        Howler.volume(this.settings.master);
        Howler.mute(this.settings.muted);
    }

    get masterVolume(): number {
        return this.settings.master;
    }

    get sfxVolume(): number {
        return this.settings.sfx;
    }

    get musicVolume(): number {
        return this.settings.music;
    }

    get muted(): boolean {
        return this.settings.muted;
    }

    /** Create (and start loading) a Howl for every bundled sound. */
    preload(): void {
        if (this.preloaded) return;
        this.preloaded = true;
        for (const asset of soundAssets) {
            if (!this.cache.has(asset.alias)) this.create(asset.alias, asset.src);
        }
    }

    /** The cached Howl for an alias, created on demand if needed. */
    howl(alias: SoundAlias | string): Howl {
        const existing = this.cache.get(alias);
        if (existing) return existing;

        const src = this.aliases.get(alias);
        if (!src) throw new Error(`Unknown sound "${alias}" (run \`npm run bundle\`)`);
        return this.create(alias, src);
    }

    /** Play a one-shot sound. Keep the handle only if you need to stop it. */
    play(alias: SoundAlias | string, options: PlayOptions = {}): SoundHandle | undefined {
        const howl = this.howl(alias);
        const id = howl.play();
        if (id == null) return undefined;

        howl.rate(options.rate ?? 1, id);
        const handle = new SoundHandle(this, howl, id, "sfx", options.volume ?? 1);
        howl.once("end", () => this.unregister(handle), id);
        return handle;
    }

    /** Loop a sound effect until the returned handle is stopped. */
    loop(alias: SoundAlias | string, options: PlayOptions = {}): SoundHandle | undefined {
        const howl = this.howl(alias);
        const id = howl.play();
        if (id == null) return undefined;

        howl.loop(true, id);
        howl.rate(options.rate ?? 1, id);
        const handle = new SoundHandle(this, howl, id, "sfx", options.volume ?? 1);
        this.handles.add(handle);
        howl.once("end", () => this.unregister(handle), id);
        return handle;
    }

    /** Start (or switch to) the music track, fading out the previous one. */
    music(alias: SoundAlias | string, options: MusicOptions = {}): SoundHandle | undefined {
        const fade = options.fade ?? 0.5;
        const volume = options.volume ?? 1;
        this.stopMusic(fade);

        const howl = this.howl(alias);
        const id = howl.play();
        if (id == null) return undefined;

        howl.loop(true, id);
        howl.rate(options.rate ?? 1, id);

        const handle = new SoundHandle(this, howl, id, "music", volume);
        this.handles.add(handle);
        this.musicHandle = handle;
        howl.once("end", () => {
            this.unregister(handle);
            if (this.musicHandle === handle) this.musicHandle = undefined;
        }, id);

        if (fade > 0) {
            howl.volume(0, id);
            howl.fade(0, volume * this.channelVolume("music"), fade * 1000, id);
        }
        return handle;
    }

    stopMusic(fade = 0): void {
        const handle = this.musicHandle;
        this.musicHandle = undefined;
        handle?.stop(fade);
    }

    setMasterVolume(volume: number): void {
        this.settings.master = clamp01(volume);
        Howler.volume(this.settings.master);
        this.persist();
    }

    setSfxVolume(volume: number): void {
        this.settings.sfx = clamp01(volume);
        this.applyChannelVolume("sfx");
        this.persist();
    }

    setMusicVolume(volume: number): void {
        this.settings.music = clamp01(volume);
        this.applyChannelVolume("music");
        this.persist();
    }

    setMuted(muted: boolean): void {
        this.settings.muted = muted;
        Howler.mute(muted);
        this.persist();
    }

    toggleMute(): boolean {
        this.setMuted(!this.settings.muted);
        return this.settings.muted;
    }

    stopAll(): void {
        for (const handle of [...this.handles]) handle.stop();
        for (const howl of this.cache.values()) howl.stop();
        this.musicHandle = undefined;
    }

    /** @internal Used by SoundHandle. */
    channelVolume(channel: SoundChannel): number {
        return channel === "music" ? this.settings.music : this.settings.sfx;
    }

    /** @internal Used by SoundHandle. */
    unregister(handle: SoundHandle): void {
        this.handles.delete(handle);
        if (this.musicHandle === handle) this.musicHandle = undefined;
    }

    private applyChannelVolume(channel: SoundChannel) {
        for (const handle of this.handles) {
            if (handle.channel === channel) {
                handle.setVolume(handle.volume);
            }
        }
    }

    private create(alias: string, src: string): Howl {
        const howl = new Howl({ src: [src], preload: true });
        this.cache.set(alias, howl);
        return howl;
    }

    private loadSettings(): AudioSettings {
        try {
            const raw = localStorage.getItem(storageKey());
            if (!raw) return { ...DEFAULT_SETTINGS };
            const parsed = JSON.parse(raw) as Partial<AudioSettings>;
            return {
                master: clamp01(parsed.master ?? DEFAULT_SETTINGS.master),
                sfx: clamp01(parsed.sfx ?? DEFAULT_SETTINGS.sfx),
                music: clamp01(parsed.music ?? DEFAULT_SETTINGS.music),
                muted: parsed.muted ?? DEFAULT_SETTINGS.muted,
            };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    }

    private persist() {
        try {
            localStorage.setItem(storageKey(), JSON.stringify(this.settings));
        } catch {
            // Storage can be unavailable (private mode / embedded iframe).
        }
    }
}

function storageKey(): string {
    const name = document.title.trim() || "game";
    return `audio:${name}`;
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

export const audio = new AudioManager();
