declare module "kld-intersections" {

  class Shape { }

  export class Point2D {
    constructor(x: number, y: number)
  }

  class Bezier2 extends Shape {
    constructor(c1: Point2D, c2: Point2D, c3: Point2D)
  }

  class Bezier3 extends Shape {
    constructor(c1: Point2D, c2: Point2D, c3: Point2D, c4: Point2D)
  }

  class Circle extends Shape {
    constructor(center: Point2D, radius: Number)
  }

  class Ellipse extends Shape {
    constructor(center: Point2D, radiusX: Number, radiusY: Number)
  }

  class Line extends Shape {
    constructor(p1: Point2D, p2: Point2D)
  }

  class Path extends Shape {
    constructor(points: Shape[])
  }

  class Polygon extends Shape {
    constructor(points: Array<Point2D>)
  }

  class Polyline extends Shape {
    constructor(points: Array<Point2D>)
  }

  class Rectangle extends Shape {
    constructor(topLeft: Point2D, bottomRight: Point2D)
  }

  interface Shapes {
    bezier2: { (c1: Point2D, c2: Point2D, c3: Point2D): Bezier2 };
    bezier3: { (c1: Point2D, c2: Point2D, c3: Point2D, c4: Point2D): Bezier3 };
    circle: { (center: Point2D, radius: Number): Circle };
    ellipse: { (center: Point2D, radiusX: Number, radiusY: Number): Ellipse };
    line: { (p1: Point2D, p2: Point2D): Line };
    path: { (points: Shape[]): Path };
    polygon: { (points: Array<Point2D>): Polygon };
    polyline: { (points: Array<Point2D>): Polyline };
    rectangle: { (topLeft: Point2D, bottomRight: Point2D): Rectangle };
  }

  export const Shapes: Shapes

  interface intersections {
    readonly status: "Intersection" | 'No Intersection';
    points: Point2D[];
  }

  interface Intersection {
    intersect: { (x: Shape, y: Shape): intersections }
    // there are lots more methods available. For details, see
    // https://www.npmjs.com/package/kld-intersections#intersection-api
  }
  export const Intersection: Intersection

  export const ShapeInfo: {
    path: (arg: string) => any;
    rectangle: (arg: {
      top: number,
      left: number
      size: [number, number]
    }) => any;
  }
}


declare module "kld-path-parser" {

  export class PathParser {
    setHandler: { (handler: handler): void }
    parseData: { (x: string): void }
  }

  export interface handler {
    arcAbs?: { (rx: number, ry: number, xAxisRotation: number, largeArcFlag: boolean, sweepFlag: boolean, x: number, y: number): void };
    arcRel?: { (rx: number, ry: number, xAxisRotation: number, largeArcFlag: boolean, sweepFlag: boolean, x: number, y: number): void };
    curvetoCubicAbs?: { (x1: number, y1: number, x2: number, y2: number, x: number, y: number): void };
    curvetoCubicRel?: { (x1: number, y1: number, x2: number, y2: number, x: number, y: number): void };
    linetoHorizontalAbs?: { (x: number): void };
    linetoHorizontalRel?: { (x: number): void };
    linetoAbs?: { (x: number, y: number): void };
    linetoRel?: { (x: number, y: number): void };
    movetoAbs?: { (x: number, y: number): void };
    movetoRel?: { (x: number, y: number): void };
    curvetoQuadraticAbs?: { (x1: number, y1: number, x: number, y: number): void };
    curvetoQuadraticRel?: { (x1: number, y1: number, x: number, y: number): void };
    curvetoCubicSmoothAbs?: { (x2: number, y2: number, x: number, y: number): void };
    curvetoCubicSmoothRel?: { (x2: number, y2: number, x: number, y: number): void };
    curvetoQuadraticSmoothAbs?: { (x: number, y: number): void };
    curvetoQuadraticSmoothRel?: { (x: number, y: number): void };
    linetoVerticalAbs?: { (y: number): void };
    linetoVerticalRel?: { (y: number): void };
    closePath: { (): void };
    openPath: { (): void };
  }

}