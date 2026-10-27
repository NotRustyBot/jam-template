import { Color, Sprite, Texture } from "pixi.js";
import { asset } from "../util";
import { applyProps, GameObject, registerObject, type ObjectProps, type Schema } from "../gameObject";
import { game, type LayerName } from "../game";

const schema = {
    image: { kind: "asset", bundle: "bundle" },
    scale: { kind: "number", min: 0, step: 0.1 },
    flipX: { kind: "boolean" },
    tint: { kind: "color" },
    depth: { kind: "layer" },
} as const satisfies Schema;

export class Prop extends GameObject {
    static override type = "prop";
    static override schema = schema;

    image = "";
    scale = 1;
    flipX = false;
    tint = "#ffffff";
    depth: LayerName = "entity";

    sprite = new Sprite();

    constructor(props: ObjectProps<typeof schema> = {}) {
        super(["drawable"], props);
        applyProps(this, props);

        this.container.addChild(this.sprite);
        this.refresh();
    }

    refresh(): void {
        if (this.container.parent !== game.layers[this.depth]) {
            game.layers[this.depth].addChild(this.container);
        }

        this.sprite.anchor.set(0.5);
        this.sprite.texture = this.image ? asset(this.image) : Texture.EMPTY;
        this.sprite.scale.set(this.scale, this.scale);
        if (this.flipX) this.sprite.scale.x *= -1;
        this.sprite.tint = new Color(this.tint).toNumber();
    }
}

registerObject(Prop);
