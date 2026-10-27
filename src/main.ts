import './style.css'
import { Application, Assets } from 'pixi.js';
import bundle from './bundle';
import { Game } from './game';
import { audio } from './audio';
import './objects';
import { loadWorld, spawnWorld } from './world';

async function main() {
    const hideLoading = showLoading();

    // Start downloading/decoding sounds before the renderer boots.
    audio.preload();

    const app = new Application();
    await app.init({
        background: '#000',
        resizeTo: window,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    document.body.appendChild(app.canvas);

    Assets.init({ manifest: { bundles: [bundle as any] } });

    const game = new Game(app);
    game.paused = true;
    game.init();

    await Assets.loadBundle("bundle");
    await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    const world = await loadWorld();
    const spawned = spawnWorld(world);

    game.resume();
    hideLoading();

    if (import.meta.env.DEV) {
        const { startEditor } = await import("./editor");
        startEditor(world, spawned);
    }
}

function showLoading(): () => void {
    const element = document.createElement("div");
    element.className = "boot-screen";
    element.innerHTML = `<span class="boot-screen-text">loading</span>`;
    document.body.appendChild(element);

    return () => element.remove();
}

function showError(error: unknown) {
    console.error(error);
    document.querySelector(".boot-screen")?.remove();

    const element = document.createElement("div");
    element.className = "boot-error";
    element.textContent = `Failed to start\n\n${error instanceof Error ? error.message : String(error)}`;
    document.body.appendChild(element);
}

main().catch(showError);
