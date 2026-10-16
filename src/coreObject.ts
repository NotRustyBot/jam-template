import { objs } from "./game";
import type { ObjectKind } from "./types";

export class CoreObject {
    tags: Set<ObjectKind> = new Set();

    constructor(tags?: ObjectKind | ObjectKind[]) {
        if (tags == undefined) return this;

        if (!(tags instanceof Array)) {
            tags = [tags];
        }

        for (const tag of tags) {
            objs.add(tag, this as any);
            this.tags.add(tag);
        }
    }

    destroy() {
        this.tags.forEach((t) => objs.remove(t, this as any));
    }
}
