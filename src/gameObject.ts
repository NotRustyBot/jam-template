import { Container } from "pixi.js";
import { CoreObject } from "./coreObject";
import { Vector } from "./vector";
import type { ObjectKind } from "./types";

export type PropSchema =
    | { kind: "number"; label?: string; min?: number; max?: number; step?: number }
    | { kind: "string"; label?: string }
    | { kind: "boolean"; label?: string }
    | { kind: "enum"; label?: string; options: readonly string[] }
    | { kind: "asset"; label?: string; bundle?: "bundle" | "bundle_sound" }
    | { kind: "color"; label?: string };

export type Schema = Record<string, PropSchema>;

export type Props = Record<string, any> & { x?: number; y?: number };

export interface GameObjectClass {
    type: string;
    schema: Schema;
    new (props?: Props): GameObject;
}

const registry = new Map<string, GameObjectClass>();

export function registerObject(cls: GameObjectClass): void {
    registry.set(cls.type, cls);
}

export function getRegisteredClasses(): GameObjectClass[] {
    return [...registry.values()];
}

export function hasObjectType(type: string): boolean {
    return registry.has(type);
}

export function createObject(type: string, props: Props = {}): GameObject {
    const Cls = registry.get(type);
    if (Cls == undefined) throw new Error(`Unknown object type: ${type}`);
    return new Cls(props);
}

export abstract class GameObject extends CoreObject {
    static type = "gameobject";
    static schema: Schema = {};

    id: string = crypto.randomUUID();
    position = new Vector();
    container = new Container();

    constructor(tags?: ObjectKind | ObjectKind[], props?: Props) {
        super(tags);
        if (props) this.position.set(props.x ?? 0, props.y ?? 0);
    }

    get type(): string {
        return (this.constructor as typeof GameObject).type;
    }

    get schema(): Schema {
        return (this.constructor as typeof GameObject).schema;
    }

    serialize(): Props {
        const out: Props = { x: this.position.x, y: this.position.y };
        for (const key of Object.keys(this.schema)) {
            out[key] = (this as any)[key];
        }
        return out;
    }

    draw(): void {
        this.container.position.set(this.position.x, this.position.y);
    }

    override destroy() {
        super.destroy();
        this.container.destroy({ children: true });
    }
}
