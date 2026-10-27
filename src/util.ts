import { Assets, Color, type ColorSource, type Texture } from "pixi.js";
import { audio } from "./audio.ts";
import type { BundleAliases } from "./bundle.ts";
import { Vector, type Vectorlike } from "./vector.ts";
import type { Bundle_soundAliases } from "./bundle_sound.ts";


export function asset(name: BundleAliases): Texture;
export function asset(name: string): Texture;
export function asset(name: string): Texture {
    const texture = Assets.get(name) as Texture | undefined;
    if (!texture) throw new Error(`Unknown texture "${name}" (run \`npm run bundle\`)`);
    return texture;
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

export function anchor(polygon: Vectorlike[], x: number, y?: number) {
    if (y == undefined) y = x;

    const minX = Math.min(...polygon.map((p) => p.x));
    const minY = Math.min(...polygon.map((p) => p.y));

    const maxX = Math.max(...polygon.map((p) => p.x));
    const maxY = Math.max(...polygon.map((p) => p.y));

    const width = maxX - minX;
    const height = maxY - minY;

    polygon.forEach(p => {
        p.x -= minX + width * x;
        p.y -= minY + height * y;
    });

    return polygon;
}

export function rotate(polygon: Vectorlike[], rotation: number) {
    return polygon.map(p => Vector.fromLike(p).rotate(rotation));
}


export function angleInterpolate(current: number, target: number, step: number) {
    current = fixAngle(current);
    target = fixAngle(target);

    if (target < current) target += Math.PI * 2;

    if (target - current <= step * 2) return target;

    if (target - current > Math.PI) return current - step;
    return fixAngle(current + step);
}

export function angleDistance(current: number, target: number) {
    current = fixAngle(current);
    target = fixAngle(target);
    return target - current;
}

export function fixAngle(angle: number) {
    angle = angle % (Math.PI * 2);
    if (angle < 0) angle += Math.PI * 2;
    return angle;
}

export function interpolateColors(a: ColorSource, b: ColorSource, ratio: number) {
    a = new Color(a);
    b = new Color(b);
    const out = new Color([a.red + (b.red - a.red) * ratio, a.green + (b.green - a.green) * ratio, a.blue + (b.blue - a.blue) * ratio]);
    return out;
}

export function toNearest<T extends { position: Vector }>(position: Vectorlike) {
    return (acc: T, curr: T) => {
        return acc.position.distanceSquared(position) < curr.position.distanceSquared(position) ? acc : curr;
    }
}


/** Cached Howl for a bundled sound. Prefer `audio.play()` / `audio.loop()`. */
export function sound(file: Bundle_soundAliases) {
    return audio.howl(file);
}

export function pixelated(sprite: { texture: Texture }) {
    sprite.texture.source.scaleMode = "nearest";
}
