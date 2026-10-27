import { objs } from "./game";
import type { ObjectKind, ObjectKinds } from "./types";

export class CoreObject {
    tags: Set<ObjectKind> = new Set();

    constructor(tags?: ObjectKind | ObjectKind[]) {
        if (tags == undefined) return this;

        for (const tag of tags instanceof Array ? tags : [tags]) {
            this.addTag(tag);
        }
    }

    /** Register this object under a tag. Also updates `objs`. */
    addTag<K extends ObjectKind>(tag: K): this {
        objs.add(tag, this as unknown as ObjectKinds[K]);
        this.tags.add(tag);
        return this;
    }

    /** Remove this object from a tag. */
    removeTag<K extends ObjectKind>(tag: K): this {
        objs.remove(tag, this as unknown as ObjectKinds[K]);
        this.tags.delete(tag);
        return this;
    }

    hasTag(tag: ObjectKind): boolean {
        return this.tags.has(tag);
    }

    destroy() {
        for (const tag of this.tags) {
            objs.remove(tag, this as any);
        }
        this.tags.clear();
    }
}
