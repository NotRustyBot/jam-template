export interface TimerHandle {
    readonly active: boolean;
    cancel(): void;
}

interface TimerEntry {
    id: number;
    remaining: number;
    interval: number | null;
    callback: () => void;
}

/**
 * Game-time timers. Unlike setTimeout, these pause with the game and are
 * cleared on restart.
 *
 *   game.after(1.5, () => spawnWave());
 *   const handle = game.every(0.25, tick);
 *   handle.cancel();
 */
export class Timers {
    private readonly entries = new Map<number, TimerEntry>();
    private nextId = 1;

    get size(): number {
        return this.entries.size;
    }

    /** Run once after `seconds` of game time. */
    after(seconds: number, callback: () => void): TimerHandle {
        return this.add(seconds, null, callback);
    }

    /** Run repeatedly every `seconds` of game time. */
    every(seconds: number, callback: () => void): TimerHandle {
        return this.add(seconds, Math.max(seconds, 0.001), callback);
    }

    update(dt: number): void {
        if (dt <= 0 || this.entries.size === 0) return;

        const due: TimerEntry[] = [];
        for (const entry of this.entries.values()) {
            entry.remaining -= dt;
            if (entry.remaining <= 0) due.push(entry);
        }

        for (const entry of due) {
            // An earlier callback may have cancelled this timer.
            if (!this.entries.has(entry.id)) continue;

            if (entry.interval == null) {
                this.entries.delete(entry.id);
            } else {
                entry.remaining += entry.interval;
            }

            try {
                entry.callback();
            } catch (error) {
                console.error("[timer]", error);
            }
        }
    }

    clear(): void {
        this.entries.clear();
    }

    private add(seconds: number, interval: number | null, callback: () => void): TimerHandle {
        const id = this.nextId++;
        this.entries.set(id, {
            id,
            remaining: Math.max(seconds, 0),
            interval,
            callback,
        });

        const owner = this;
        return {
            get active() {
                return owner.entries.has(id);
            },
            cancel: () => {
                this.entries.delete(id);
            },
        };
    }
}
