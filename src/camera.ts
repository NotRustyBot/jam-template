import { game } from "./game";
import { Vector, type Vectorlike } from "./vector";

interface FollowTarget {
    position: Vectorlike;
}

export class Camera {
    position = new Vector();
    zoom = 1;
    minZoom = 0.1;
    maxZoom = 8;

    /** When set, the camera smoothly follows this object's position. */
    followTarget: FollowTarget | null = null;
    followSpeed = 8;

    private shakeStrength = 0;
    private shakeDuration = 0;
    private shakeTime = 0;
    private readonly shakeOffset = new Vector();

    /** Follow a GameObject (or anything with a `position`). */
    follow(target: FollowTarget | null, speed = 8): this {
        this.followTarget = target;
        this.followSpeed = speed;
        return this;
    }

    /** Add a decaying screen shake. */
    shake(strength = 8, duration = 0.25): this {
        this.shakeStrength = Math.max(this.shakeStrength, strength);
        this.shakeDuration = Math.max(duration, 0.001);
        this.shakeTime = this.shakeDuration;
        return this;
    }

    /**
     * Change zoom while keeping the world point under (screenX, screenY) fixed.
     * Used by the level editor; game code can also use it for zoom effects.
     */
    zoomAt(factor: number, screenX: number, screenY: number): this {
        const before = this.screenToWorld(screenX, screenY);
        this.zoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);

        const screen = game.app.screen;
        this.position.set(
            before.x - (screenX - screen.width / 2) / this.zoom,
            before.y - (screenY - screen.height / 2) / this.zoom
        );
        this.update(0);
        return this;
    }

    update(dt = 0) {
        if (this.followTarget) {
            const t = 1 - Math.exp(-this.followSpeed * Math.max(dt, 0));
            this.position.lerp(this.followTarget.position, t);
        }

        if (this.shakeTime > 0) {
            this.shakeTime = Math.max(0, this.shakeTime - dt);
            const falloff = this.shakeDuration > 0 ? this.shakeTime / this.shakeDuration : 0;
            this.shakeOffset.set(
                (Math.random() * 2 - 1) * this.shakeStrength * falloff,
                (Math.random() * 2 - 1) * this.shakeStrength * falloff
            );
            if (this.shakeTime <= 0) this.shakeStrength = 0;
        } else {
            this.shakeOffset.set(0, 0);
        }

        const screen = game.app.screen;
        game.worldContainer.scale.set(this.zoom);
        game.worldContainer.position.set(
            -this.position.x * this.zoom + screen.width / 2 + this.shakeOffset.x,
            -this.position.y * this.zoom + screen.height / 2 + this.shakeOffset.y
        );
    }

    screenToWorld(x: number, y: number): Vector {
        const container = game.worldContainer;
        return new Vector((x - container.x) / this.zoom, (y - container.y) / this.zoom);
    }

    worldToScreen(vector: Vectorlike): Vector {
        const container = game.worldContainer;
        return new Vector(
            vector.x * this.zoom + container.x,
            vector.y * this.zoom + container.y
        );
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}
