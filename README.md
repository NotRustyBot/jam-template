# jam-template

A pixi.js + vite gamejam boilerplate.

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

- Drop images in `public/img/` and audio in `public/audio/`
- Run `npm run bundle` to regenerate `src/bundle.ts` / `src/bundle_sound.ts`
- Reference assets by alias via `asset()` and `sound()` in `src/util.ts`
- `npm run upload` builds, zips and pushes to itch.io (`NotRustyBot/<game>:web`)
- Publish the repo: `gh repo create NotRustyBot/<game> --source=. --push`

## Objects

Game objects self-register with tags and are driven by the `Game` update loop
(`preupdate` → `updatable` → `drawable` → `postprocess`). Reach them anywhere via
`objs.getAll("tag")` / `objs.getFirst("tag")`.

To make an object placeable in the level editor, extend `GameObject`, declare a
`static type` and a `static schema`, then `registerObject(YourClass)`:

```ts
import { GameObject, registerObject } from "../gameObject";

export class Rock extends GameObject {
    static override type = "rock";
    static override schema = {
        radius: { kind: "number", min: 2, step: 1 },
        color: { kind: "color" },
    } as const;

    radius = 40;
    color = "#888888";

    constructor(props = {}) {
        super(["drawable"], props);
        this.radius = props.radius ?? this.radius;
        this.color = props.color ?? this.color;
        // build this.container, then add it to a layer:
        game.layers.entity.addChild(this.container);
    }
}

registerObject(Rock);
```

Import your object files from `src/objects/index.ts` so registration runs.
Schema fields (`number`, `string`, `boolean`, `enum`, `asset`, `color`) drive both
spawning and the editor inspector automatically.

## Level editor

Run `npm run dev` and open the app. In dev builds a DOM overlay appears in the
top-right with:

- a **palette** of every registered object type (click to spawn at the camera)
- an **inspector** for the selected object's schema
- **Save** / **Reload** against `public/worlds/<level>.json`

Controls: `` ` `` toggles the editor, drag to move (hold **Shift** for free
placement, otherwise it snaps to the grid), arrow keys nudge, **Delete** removes,
**Ctrl+D** duplicates, **Esc** deselects, and the level field picks the file name.

Saving POSTs to the Vite middleware at `/__editor/save`, which validates the
payload and writes `public/worlds/<level>.json`. The game loads that file at
runtime via `loadWorld()` / `spawnWorld()` in `src/world.ts`. Everything under
`src/editor/` and `editor-plugin.ts` is dev-only and excluded from `npm run build`.

