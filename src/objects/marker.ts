import { Color, Graphics } from "pixi.js";
import { applyProps, GameObject, registerObject, type ObjectProps, type Schema } from "../gameObject";
import { game, type LayerName } from "../game";

const schema = {
    radius: { kind: "number", min: 2, step: 1 },
    color: { kind: "color" },
    shape: { kind: "enum", options: ["circle", "square"] },
    depth: { kind: "layer" },
} as const satisfies Schema;

export class Marker extends GameObject {
    static override type = "marker";
    static override schema = schema;

    radius = 24;
    color = "#ffcc00";
    shape: "circle" | "square" = "circle";
    depth: LayerName = "entity";

    graphics = new Graphics();

    constructor(props: ObjectProps<typeof schema> = {}) {
        super(["drawable"], props);
        applyProps(this, props);

        this.container.addChild(this.graphics);
        this.refresh();
    }

    refresh(): void {
        if (this.container.parent !== game.layers[this.depth]) {
            game.layers[this.depth].addChild(this.container);
        }
        this.redraw();
    }

    redraw() {
        const tint = new Color(this.color).toNumber();

        this.graphics.clear();
        if (this.shape === "circle") this.graphics.circle(0, 0, this.radius);
        else this.graphics.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        this.graphics.fill({ color: tint, alpha: 0.85 });
        this.graphics.stroke({ width: 2, color: 0x000000 });
    }
}

registerObject(Marker);
