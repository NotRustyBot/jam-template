import type { ObjectKinds } from "./types";

export class ObjectManager {
    private objects: Partial<{ [K in keyof ObjectKinds]: Set<ObjectKinds[K]> }> = {};

    add<K extends keyof ObjectKinds>(key: K, value: ObjectKinds[K]) {
        if (!(key in this.objects)) this.objects[key] = new Set<ObjectKinds[K]>() as any;
        this.objects[key]!.add(value);
    }

    remove<K extends keyof ObjectKinds>(key: K, value: ObjectKinds[K]) {
        if (!(key in this.objects)) this.objects[key] = new Set() as any;
        this.objects[key]!.delete(value);
    }

    getFirst<K extends keyof ObjectKinds>(key: K): ObjectKinds[K] {
        if (!(key in this.objects)) this.objects[key] = new Set() as any;

        for (const v of this.objects[key]!) {
            return v;
        }

        throw new Error(key + " is not defined");
    }

    getAll<K extends keyof ObjectKinds>(key: K): Set<ObjectKinds[K]> {
        if (!(key in this.objects)) this.objects[key] = new Set() as any;
        return this.objects[key] as Set<ObjectKinds[K]>;
    }
}
