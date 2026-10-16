import type { WorldState } from "../world";

export async function saveWorld(level: string, state: WorldState): Promise<number> {
    const res = await fetch("/__editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, state }),
    });
    if (!res.ok) throw new Error(`save failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.count ?? state.objects.length;
}

export async function listWorlds(): Promise<string[]> {
    const res = await fetch("/__editor/list");
    if (!res.ok) throw new Error(`list failed: ${res.status}`);
    const data = await res.json();
    return data.levels ?? [];
}

export async function loadWorldFromServer(level: string): Promise<WorldState> {
    const res = await fetch(`/__editor/load?level=${encodeURIComponent(level)}`);
    if (!res.ok) throw new Error(`load failed: ${res.status}`);
    return await res.json();
}
