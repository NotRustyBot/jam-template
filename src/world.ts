import { createObject, type GameObject, type Props } from "./gameObject";

export interface WorldObject {
    id: string;
    type: string;
    props: Props;
}

export interface WorldState {
    name: string;
    objects: WorldObject[];
}

export function emptyWorld(name: string): WorldState {
    return { name, objects: [] };
}

function normalize(data: unknown, level: string): WorldState {
    if (data && typeof data === "object" && Array.isArray((data as any).objects)) {
        const w = data as WorldState;
        return { name: w.name ?? level, objects: w.objects };
    }

    if (Array.isArray(data)) return { name: level, objects: data as WorldObject[] };

    return emptyWorld(level);
}

export async function loadWorld(level = "default"): Promise<WorldState> {
    const url = `${import.meta.env.BASE_URL}worlds/${level}.json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return normalize(await res.json(), level);
    } catch (error) {
        console.warn(`[world] could not load ${url}, starting empty`, error);
        return emptyWorld(level);
    }
}

export function spawnWorld(state: WorldState): Map<string, GameObject> {
    const spawned = new Map<string, GameObject>();

    for (const entry of state.objects) {
        try {
            const obj = createObject(entry.type, entry.props ?? {});
            if (entry.id) obj.id = entry.id;
            spawned.set(obj.id, obj);
        } catch (error) {
            console.warn(`[world] failed to spawn "${entry.type}"`, error);
        }
    }

    return spawned;
}

export function clearWorld(spawned: Map<string, GameObject>) {
    for (const obj of spawned.values()) obj.destroy();
    spawned.clear();
}
