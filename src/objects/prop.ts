import { Color, Sprite } from "pixi.js";
import { asset } from "../util";
import { GameObject, registerObject, type Props, type Schema } from "../gameObject";
import { game } from "../game";

export class Prop extends GameObject {
    static override type = "prop";
    static override schema: Schema = {
        image: { kind: "asset", bundle: "bundle" },
        scale: { kind: "number", min: 0, step: 0.1 },
        flipX: { kind: "boolean" },
        tint: { kind: "color" },
        depth: { kind: "enum", options: ["background", "entity", "foreground"] },
    };

    image = "";
    scale = 1;
    flipX = false;
    tint = "#ffffff";
    depth: "background" | "entity" | "foreground" = "entity";

    sprite = new Sprite();

    constructor(props: Props = {}) {
        super(["drawable"], props);

        this.image = props.image ?? this.image;
        this.scale = props.scale ?? this.scale;
        this.flipX = props.flipX ?? this.flipX;
        this.tint = props.tint ?? this.tint;
        this.depth = props.depth ?? this.depth;

        this.sprite.anchor.set(0.5);
        if (this.image) this.sprite.texture = asset(this.image);
        this.sprite.scale.set(this.scale, this.scale);
        if (this.flipX) this.sprite.scale.x *= -1;
        this.sprite.tint = new Color(this.tint).toNumber();

        this.container.addChild(this.sprite);
        game.layers[this.depth].addChild(this.container);
    }
}

registerObject(Prop);
