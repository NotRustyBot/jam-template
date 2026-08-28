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
