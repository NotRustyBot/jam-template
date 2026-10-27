# jam-template

A pixi.js + vite gamejam boilerplate. Requires Node 22.18+ (`node bundler.ts`
uses native TypeScript stripping).

## New game

```
npx degit NotRustyBot/jam-template my-game
cd my-game
npm install
npm run setup -- my-game   # sets name/itch.io path, git init, removes itself
npm run dev
```

Alternative to degit: use the GitHub "Use this template" button, which also gives a repo with no upstream.

## Workflow

- Drop images in `public/img/` and audio in `public/audio/` (only common image/audio
  extensions are bundled; helper files are skipped)
- `npm run dev` / `npm run build` regenerate `src/bundle.ts` / `src/bundle_sound.ts`
  automatically; run `npm run bundle` manually if you change assets while the dev
  server is already running
- Reference images by alias via `asset()` and sounds via `audio` / `sound()` in
  `src/util.ts`
- `npm run check` runs the TypeScript check; `npm run build` only runs Vite so an
  unused variable never blocks an upload
- `npm run upload` builds, zips and pushes to itch.io (`NotRustyBot/<game>:web`)
- Publish the repo: `gh repo create NotRustyBot/<game> --source=. --push`

## Input

`src/input.ts` tracks keyboard and pointer state. Held state stays true while a
key/button is down; edge state is true for one frame and is cleared at the end of
`Game.update()`. Unpressed keys/buttons are falsy.

```ts
import { input } from "./input";

if (input.down("KeyW")) moveForward();          // held
if (input.pressed("Escape")) game.togglePause(); // this frame only
if (input.mouseDown) shoot();
const worldPoint = game.mouse;                   // pointer in world space
const screenPoint = input.mouse;                 // pointer in screen space
```

The canvas listens for pointer events; keys are ignored while an input, select,
textarea, or contenteditable element is focused. Held state is cleared on blur.

## Audio

All bundled sounds are preloaded when the game starts (no first-play delay).
`audio.play()` is fire-and-forget, `audio.loop()` returns a handle, and
`audio.music()` switches tracks with a fade.

```ts
import { audio } from "./audio";

audio.play("Claw Grab", { volume: 0.8 });
audio.play("Metal Impact", { rate: 0.9 + Math.random() * 0.2 });

const engine = audio.loop("Ship Engine Hum");
engine?.setVolume(0.4);
engine?.stop();

audio.music("Harpuna Rescue Music Loop");
audio.setSfxVolume(0.7);    // persisted in localStorage
audio.setMusicVolume(0.5);
audio.toggleMute();
```

`sound(alias)` in `src/util.ts` still returns the cached `Howl` if you need the
raw Howler API.

## Time, pause and timers

`game.dt` is clamped to 50 ms and multiplied by `game.timeScale`. While
`game.paused` is true, gameplay callbacks and timers do not run. The game
auto-pauses when the tab is hidden.

```ts
game.pause();
game.resume();
game.timeScale = 0.5;

game.after(1.5, () => spawnWave());  // pause-safe replacement for setTimeout
game.every(0.25, () => tick());
```

`game.pauseKey` defaults to `"Escape"` and works even while paused. Set it to
`null` if your game handles pause differently. The editor disables it while open
so Escape can deselect objects.

## Camera

The camera handles follow, zoom and shake. It is applied to `worldContainer`
before objects draw, and `screenToWorld` / `worldToScreen` account for zoom.

```ts
game.camera.follow(player, 8);   // target, smoothing speed
game.camera.zoom = 2;
game.camera.shake(10, 0.3);
```

## Objects

Game objects self-register with tags and are driven by the `Game` update loop
(`preupdate` → `updatable` → `drawable` → `postprocess`). Reach them anywhere via
`objs.getAll("tag")` / `objs.getFirst("tag")`.

To make an object placeable in the level editor, keep the schema in a `const`,
derive the constructor props from it, and `registerObject(YourClass)`:

```ts
import { applyProps, GameObject, registerObject, type ObjectProps, type Schema } from "../gameObject";
import type { LayerName } from "../game";

const schema = {
    radius: { kind: "number", min: 2, step: 1 },
    color: { kind: "color" },
    depth: { kind: "layer" },
} as const satisfies Schema;

export class Rock extends GameObject {
    static override type = "rock";
    static override schema = schema;

    radius = 40;
    color = "#888888";
    depth: LayerName = "entity";

    constructor(props: ObjectProps<typeof schema> = {}) {
        super(["drawable"], props);
        applyProps(this, props);
        // build this.container, e.g. add a Graphics or Sprite:
        this.refresh();
    }

    refresh() {
        if (this.container.parent !== game.layers[this.depth]) {
            game.layers[this.depth].addChild(this.container);
        }
        // update the visuals from this.radius / this.color
    }
}

registerObject(Rock);
```

`ObjectProps<typeof schema>` is inferred — there is no separate `RockProps`
interface. `number` becomes `number`, `boolean` becomes `boolean`, `enum`
becomes its literal options, `layer` becomes `LayerName`, and `x`/`y` are added
automatically. Keep `as const satisfies Schema`; if the schema is typed as plain
`Schema`, TypeScript cannot infer its keys or enum options. `applyProps` copies
only schema keys, so unknown keys from a world file cannot overwrite methods.

`refresh()` is called by the editor after a property changes. If a class does not
implement it, the editor falls back to destroying and recreating the object.

Import your object files from `src/objects/index.ts` so registration runs.
Schema fields (`number`, `string`, `boolean`, `enum`, `asset`, `color`, `layer`)
drive both spawning and the editor inspector automatically.

### Tags

Tags are typed through `ObjectKinds`. Add a declaration next to your object:

```ts
declare module "../types" { interface ObjectKinds { item: Item } }

item.addTag("item");
item.removeTag("item");
if (item.hasTag("item")) { /* ... */ }
```

`addTag` / `removeTag` update `objs` and the object's `tags` set automatically.

## Layers

`game.layers` is the registry: `LayerName` is inferred from its keys, and the key
order is the render order. Add a layer by adding a key to the object —
`Game.init()` adds every layer automatically, so there is no `addLayer()` call.

```ts
// game.ts
layers = {
    background: new Container(),
    entity: new Container(),
    foreground: new Container(),
    darkness: new Container(),
};
export type LayerName = keyof Game["layers"];
```

Use `{ kind: "layer" }` in a schema to get a dropdown containing every layer. The
editor's **Layers** panel toggles each layer's visibility and has a **Show all**
button; visibility is an editor view setting and is not saved in the world file.

## Level editor

Run `npm run dev` and open the app. In dev builds a DOM overlay appears in the
top-right with:

- a **palette** of every registered object type (click to spawn at the camera)
- an **inspector** for the selected object's schema
- **Save** / **Reload** against `public/worlds/<level>.json`

Controls: `` ` `` toggles the editor, drag to move (hold **Shift** for free
placement, otherwise it snaps to the grid), the mouse wheel zooms, middle-drag
pans the camera, arrow keys nudge, **Delete** removes, **Ctrl+D** duplicates,
**Esc** deselects, and the level field picks the file name. The **Layers** panel
shows/hides individual layers (useful for placing markers behind darkness) and
**Show all** restores them. The free camera only exists inside the editor.

Saving POSTs to the Vite middleware at `/__editor/save`, which validates the
payload and writes `public/worlds/<level>.json`. The game loads that file at
runtime via `loadWorld()` / `spawnWorld()` in `src/world.ts`. Everything under
`src/editor/` and `editor-plugin.ts` is dev-only and excluded from `npm run build`.

