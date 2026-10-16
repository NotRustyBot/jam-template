import './style.css'
import { Application, Assets } from 'pixi.js';
import bundle from './bundle';
import bundle_sound from './bundle_sound';
import { Game } from './game';
import { Howl } from "howler"
import './objects';
import { loadWorld, spawnWorld } from './world';

async function main() {
    const app = new Application();
    await app.init({ background: '#000', resizeTo: window });
    Assets.init({ manifest: { bundles: [bundle as any] } });

    bundle_sound.assets.forEach((asset: { src: string }) => {
        new Howl({ src: asset.src, preload: true });
    });

    await Assets.loadBundle("bundle");
    await document.fonts.ready;

    document.body.appendChild(app.canvas);
    const game = new Game(app);
    game.init();

    const world = await loadWorld();
    const spawned = spawnWorld(world);

    if (import.meta.env.DEV) {
        const { startEditor } = await import("./editor");
        startEditor(world, spawned);
    }
}

main();
