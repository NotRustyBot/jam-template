import { Color, Graphics } from "pixi.js";
import { GameObject, registerObject, type Props, type Schema } from "../gameObject";
import { game } from "../game";

export class Marker extends GameObject {
    static override type = "marker";
    static override schema: Schema = {
        radius: { kind: "number", min: 2, step: 1 },
        color: { kind: "color" },
        shape: { kind: "enum", options: ["circle", "square"] },
        depth: { kind: "enum", options: ["background", "entity", "foreground"] },
    };

    radius = 24;
    color = "#ffcc00";
    shape: "circle" | "square" = "circle";
    depth: "background" | "entity" | "foreground" = "entity";

    graphics = new Graphics();

    constructor(props: Props = {}) {
        super(["drawable"], props);

        this.radius = props.radius ?? this.radius;
        this.color = props.color ?? this.color;
        this.shape = props.shape ?? this.shape;
        this.depth = props.depth ?? this.depth;

        this.container.addChild(this.graphics);
        this.redraw();
        game.layers[this.depth].addChild(this.container);
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
