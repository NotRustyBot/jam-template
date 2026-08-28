export type Vectorlike = { x: number; y: number };

export class Vector {
    x: number;
    y: number;
    constructor(x: number = 0, y: number = 0) {
        /**@type {number} X coordinate */
        this.x = x;
        /**@type {number} Y coordinate */
        this.y = y;
    }

    static zero(): Vector {
        return new Vector(0, 0);
    }

    xy(): [number, number] {
        return [this.x, this.y];
    }

    toLike(): Vectorlike {
        return { x: this.x, y: this.y };
    }

    set(x: number, y: number): Vector;
    set(vector: Vectorlike): Vector;
    set(xOrVector: number | Vectorlike, y?: number): Vector {
        if (typeof xOrVector === "object") [xOrVector, y] = [xOrVector.x, xOrVector.y];
        this.x = xOrVector;
        if (y === undefined) return this;
        this.y = y;
        return this;
    }

    rotate(angle: number): Vector {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }

    length(): number {
        if (this.x === 0 && this.y === 0) return 0;
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    distance(vector: Vectorlike): number {
        const x = this.x - vector.x;
        const y = this.y - vector.y;
        return Math.sqrt(x ** 2 + y ** 2);
    }

    distanceSquared(vector: Vectorlike): number {
        const v = new Vector(Math.abs(this.x - vector.x), Math.abs(this.y - vector.y));
        return v.lengthSquared();
    }

    boxDistance(vector: Vectorlike) {
        return Math.max(Math.abs(this.x - vector.x), Math.abs(this.y - vector.y));
    }

    add(vector: Vectorlike): Vector {
        this.x = this.x + vector.x;
        this.y = this.y + vector.y;
        return this;
    }

    addXY(x: number, y: number): Vector {
        this.x = this.x + x;
        this.y = this.y + y;
        return this;
    }

    sub(vector: Vectorlike): Vector {
        this.x = this.x - vector.x;
        this.y = this.y - vector.y;
        return this;
    }

    subXY(x: number, y: number): Vector {
        this.x = this.x - x;
        this.y = this.y - y;
        return this;
    }

    diff(vector: Vectorlike): Vector {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    mult(magnitude: number): Vector {
        this.x = this.x * magnitude;
        this.y = this.y * magnitude;
        return this;
    }

    vecmult(vector: Vectorlike): Vector {
        this.x = this.x * vector.x;
        this.y = this.y * vector.y;
        return this;
    }

    vecdiv(vector: Vectorlike): Vector {
        this.x = this.x / vector.x;
        this.y = this.y / vector.y;
        return this;
    }

    floor(on = 1): Vector {
        this.x = Math.floor(this.x / on) * on;
        this.y = Math.floor(this.y / on) * on;
        return this;
    }

    round(to: number) {
        this.x = Math.round(this.x / to) * to;
        this.y = Math.round(this.y / to) * to;
        return this;
    }

    normalize(length: number = 1): Vector {
        length = length ?? 1;
        const total = this.length();
        if (total === 0) return this;
        this.x = (this.x / total) * length;
        this.y = (this.y / total) * length;
        return this;
    }

    minLength(length: number = 1) {
        length = length ?? 1;
        const total = this.length();
        if (total === 0 || total > length) return this;
        this.x = (this.x / total) * length;
        this.y = (this.y / total) * length;
        return this;
    }

    maxLength(length: number = 1) {
        length = length ?? 1;
        const total = this.length();
        if (total === 0 || total < length) return this;
        this.x = (this.x / total) * length;
        this.y = (this.y / total) * length;
        return this;
    }

    clampAxis(value: number): Vector {
        this.x = Math.max(-value, Math.min(value, this.x));
        this.y = Math.max(-value, Math.min(value, this.y));
        return this;
    }

    sign(): Vector {
        this.x = Math.sign(this.x);
        this.y = Math.sign(this.y);
        return this;
    }

    toAngle(): number {
        return Math.atan2(this.y, this.x);
    }

    /**
     * @deprecated Use clone() instead.
     */
    result() {
        return this.clone();
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    inbound(bound: number): boolean {
        return this.x < bound && this.x > -bound && this.y < bound && this.y > -bound;
    }

    toString(): string {
        return "[X: " + this.x.toFixed(3) + " Y: " + this.y.toFixed(3) + "]";
    }

    lerp(v2: Vectorlike, t: number) {
        this.x = this.x + (v2.x - this.x) * t;
        this.y = this.y + (v2.y - this.y) * t;
    }



    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @param {Vector} v3
     * @return {Vector} (v1 x v2) x v3
     */
    static tripleCross(v1: Vector, v2: Vector, v3: Vector): Vector {
        const cross = v1.x * v2.y - v1.y * v2.x;
        return new Vector(-v3.y * cross, v3.x * cross);
    }

    static fromAngle(r: number): Vector {
        return new Vector(Math.cos(r), Math.sin(r));
    }

    static fromLike(v: Vectorlike): Vector {
        return new Vector(v.x, v.y);
    }

    static cross(v1: Vectorlike, v2: Vectorlike): number {
        return v1.x * v2.y - v1.y * v2.x;
    }

    static add(v1: Vectorlike, v2: Vectorlike): Vector {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }
    static dot(v1: Vectorlike, v2: Vectorlike): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * @param {Vector} A point on line
     * @param {Vector} B point on line
     * @param {Vector} C distanced point
     * @return {number}
     * https://www.youtube.com/watch?v=KHuI9bXZS74
     */
    static distanceToLine(A: Vectorlike, B: Vectorlike, C: Vectorlike): number {
        return Math.abs((C.x - A.x) * (-B.y + A.y) + (C.y - A.y) * (B.x - A.x)) / Math.sqrt((-B.y + A.y) * (-B.y + A.y) + (B.x - A.x) * (B.x - A.x));
    }

    /**
     * @param {Vector} v1
     * @param {Vector} v2
     * @return {boolean} two vectors have same values
     */
    static equals(v1: Vectorlike, v2: Vectorlike): boolean {
        return v1.x == v2.x && v1.y == v2.y;
    }

    static lerp(v1: Vectorlike, v2: Vectorlike, t: number): Vector {
        return new Vector(v1.x + (v2.x - v1.x) * t, v1.y + (v2.y - v1.y) * t);
    }

    static nearestPositionIndex(origin: Vectorlike, positions: Vector[]) {
        let nearest = -1;
        let nearestDistance = Infinity;
        for (let index = 0; index < positions.length; index++) {
            const distance = positions[index].distanceSquared(origin);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = index;
            }
        }
        return nearest;
    }
}

export class Matrix2x2 {
    values: number[][];
    /**
     * @param {number[][]} values values[row][colum]
     * @returns {Matrix2x2}
     */
    constructor(values: number[][]) {
        this.values = values;
    }

    /**
     * @param {number} angle
     * @returns {Matrix2x2}
     * create rotation matrix
     */
    static fromAngle(angle: number): Matrix2x2 {
        return new Matrix2x2([
            [Math.cos(angle), -Math.sin(angle)],
            [Math.sin(angle), Math.cos(angle)],
        ]);
    }

    /**
     * @param {Vector} vect
     * @return {Vector}
     */
    transform(vect: Vector): Vector {
        return new Vector(vect.x * this.values[0][0] + vect.y * this.values[0][1], vect.x * this.values[1][0] + vect.y * this.values[1][1]);
    }
}

export class Edge<T extends Vector = Vector> {
    start: T;
    end: T;

    constructor(start: T, end: T) {
        this.start = start;
        this.end = end;
    }

    doesIntersect(edge: Edge): boolean {
        return doLinesIntersect(this, edge);
    }

    intersection(edge: Edge): Vectorlike {
        return splitEdgeAtIntersection(this, edge);
    }


}


function doLinesIntersect(e1: Edge, e2: Edge): boolean {
    const { start: A, end: B } = e1;
    const { start: C, end: D } = e2;

    function cross(p1: Vectorlike, p2: Vectorlike): number {
        return p1.x * p2.y - p1.y * p2.x;
    }

    function subtract(p1: Vectorlike, p2: Vectorlike): Vectorlike {
        return { x: p1.x - p2.x, y: p1.y - p2.y };
    }

    const AB = subtract(B, A);
    const AC = subtract(C, A);
    const AD = subtract(D, A);
    const CD = subtract(D, C);
    const CA = subtract(A, C);
    const CB = subtract(B, C);

    const cross1 = cross(AB, AC);
    const cross2 = cross(AB, AD);
    const cross3 = cross(CD, CA);
    const cross4 = cross(CD, CB);

    return cross1 * cross2 < 0 && cross3 * cross4 < 0;
}

function splitEdgeAtIntersection(edge1: Edge, edge2: Edge): Vectorlike {
    // Solve for intersection point using linear equations
    const { start: A, end: B } = edge1;
    const { start: C, end: D } = edge2;

    const denominator = (A.x - B.x) * (C.y - D.y) - (A.y - B.y) * (C.x - D.x);
    const t = ((A.x - C.x) * (C.y - D.y) - (A.y - C.y) * (C.x - D.x)) / denominator;

    return {
        x: A.x + t * (B.x - A.x),
        y: A.y + t * (B.y - A.y),
    };
}