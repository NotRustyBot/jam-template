import { Vector } from "./vector";

/**
 * Keyboard + pointer state for one frame.
 *
 * Held state (`down`, `keys`, `buttonDown`) stays true while a key/button is
 * held. Edge state (`pressed`, `released`) is only true for the frame in which
 * the event happened and is cleared at the end of `Game.update()`.
 *
 *   input.down("KeyW")       // held
 *   input.pressed("Escape")  // this frame only
 *   input.mouse              // pointer position in screen space
 *   input.mouseDown          // true while any mouse button is held
 */
export class Input {
    /** Pointer position in screen space (CSS pixels, relative to the canvas). */
    readonly mouse = new Vector();

    /**
     * Held keys by KeyboardEvent.code. Missing keys are undefined, so
     * `input.keys["KeyW"]` is always falsy when the key is not held.
     */
    readonly keys: Record<string, boolean | undefined> = {};

    /**
     * Held mouse buttons by PointerEvent.button (0 = left, 1 = middle,
     * 2 = right). Missing buttons are undefined and therefore falsy.
     */
    readonly buttons: Record<number, boolean | undefined> = {};

    private readonly held = new Set<string>();
    private readonly pressedKeys = new Set<string>();
    private readonly releasedKeys = new Set<string>();

    private readonly heldButtons = new Set<number>();
    private readonly pressedButtons = new Set<number>();
    private readonly releasedButtons = new Set<number>();

    private wheelDelta = 0;
    private canvas?: HTMLCanvasElement;
    private bound = false;

    /** Total wheel movement accumulated during the current frame. */
    get wheel(): number {
        return this.wheelDelta;
    }

    bind(canvas: HTMLCanvasElement) {
        if (this.bound) return;
        this.canvas = canvas;
        this.bound = true;

        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.onBlur);
        document.addEventListener("visibilitychange", this.onVisibilityChange);

        canvas.addEventListener("pointerdown", this.onPointerDown);
        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
        canvas.addEventListener("wheel", this.onWheel, { passive: false });
        canvas.addEventListener("contextmenu", this.onContextMenu);
    }

    unbind() {
        if (!this.bound) return;
        this.bound = false;

        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.onBlur);
        document.removeEventListener("visibilitychange", this.onVisibilityChange);

        this.canvas?.removeEventListener("pointerdown", this.onPointerDown);
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        this.canvas?.removeEventListener("wheel", this.onWheel);
        this.canvas?.removeEventListener("contextmenu", this.onContextMenu);
        this.canvas = undefined;
    }

    /** True while the key is held down. */
    down(code: string): boolean {
        return this.held.has(code);
    }

    /** True only on the frame the key went down. */
    pressed(code: string): boolean {
        return this.pressedKeys.has(code);
    }

    /** True only on the frame the key went up. */
    released(code: string): boolean {
        return this.releasedKeys.has(code);
    }

    /** True while the mouse button is held down. */
    buttonDown(button: number = 0): boolean {
        return this.heldButtons.has(button);
    }

    /** True only on the frame the mouse button went down. */
    buttonPressed(button: number = 0): boolean {
        return this.pressedButtons.has(button);
    }

    /** True only on the frame the mouse button went up. */
    buttonReleased(button: number = 0): boolean {
        return this.releasedButtons.has(button);
    }

    get mouseDown(): boolean {
        return this.heldButtons.size > 0;
    }

    get anyKeyDown(): boolean {
        return this.held.size > 0;
    }

    /** Call at the end of every frame, after game logic has read the edges. */
    endFrame() {
        this.pressedKeys.clear();
        this.releasedKeys.clear();
        this.pressedButtons.clear();
        this.releasedButtons.clear();
        this.wheelDelta = 0;
    }

    /** Forget all held state. Useful on blur, pause, or scene changes. */
    clear() {
        this.held.clear();
        this.heldButtons.clear();
        this.pressedKeys.clear();
        this.releasedKeys.clear();
        this.pressedButtons.clear();
        this.releasedButtons.clear();
        this.wheelDelta = 0;
        for (const code of Object.keys(this.keys)) delete this.keys[code];
        for (const button of Object.keys(this.buttons)) delete this.buttons[Number(button)];
    }

    private updateMouse(event: PointerEvent | MouseEvent) {
        const rect = this.canvas?.getBoundingClientRect();
        this.mouse.set(event.clientX - (rect?.left ?? 0), event.clientY - (rect?.top ?? 0));
    }

    private onKeyDown = (event: KeyboardEvent) => {
        if (isTyping(event.target)) return;

        if (!this.held.has(event.code)) {
            this.held.add(event.code);
            this.pressedKeys.add(event.code);
        }
        this.keys[event.code] = true;
    };

    private onKeyUp = (event: KeyboardEvent) => {
        // Always release, even if the keydown happened before an input was focused.
        if (this.held.delete(event.code)) this.releasedKeys.add(event.code);
        delete this.keys[event.code];
    };

    private onPointerDown = (event: PointerEvent) => {
        this.updateMouse(event);
        if (!this.heldButtons.has(event.button)) {
            this.heldButtons.add(event.button);
            this.pressedButtons.add(event.button);
        }
        this.buttons[event.button] = true;
        // Stop the middle-click autoscroll cursor on the canvas.
        if (event.button === 1) event.preventDefault();
    };

    private onPointerMove = (event: PointerEvent) => {
        this.updateMouse(event);
    };

    private onPointerUp = (event: PointerEvent) => {
        this.updateMouse(event);
        if (this.heldButtons.delete(event.button)) this.releasedButtons.add(event.button);
        delete this.buttons[event.button];
    };

    private onWheel = (event: WheelEvent) => {
        this.wheelDelta += event.deltaY;
        event.preventDefault();
    };

    private onContextMenu = (event: Event) => {
        event.preventDefault();
    };

    private onBlur = () => {
        this.clear();
    };

    private onVisibilityChange = () => {
        if (document.hidden) this.clear();
    };
}

function isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
    );
}

export const input = new Input();
