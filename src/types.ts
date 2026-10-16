export interface ObjectKinds {
    preupdate: { preupdate(): void }
    updatable: { update(): void }
    drawable: { draw(): void }
    postprocess: { postprocess(): void }
    scenebound: { destroy(): void }
}

export type ObjectKind = keyof ObjectKinds;
