function calculatePerpendicular(point1, point2) {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  return [-dy, dx]; // Perpendicular vector
}

function normalize(vector) {
  const length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
  return [vector[0] / length, vector[1] / length];
}

export function calculateOffsetPoints(points, offset) {
  let offsetPolygonPoints1 = [];
  let offsetPolygonPoints2 = [];

  for (let i = 0; i < points.length - 1; i++) {
    const point1 = points[i];
    const point2 = points[i + 1];

    // Calculate the perpendicular vector
    let perp = calculatePerpendicular(point1, point2);

    // Normalize and scale the vector by the offset distance
    perp = normalize(perp);
    perp = perp.map((coord) => coord * offset);

    // Create the offset points for both sides
    const offsetPoint1 = [point1[0] + perp[0], point1[1] + perp[1]];
    const offsetPoint2 = [point1[0] - perp[0], point1[1] - perp[1]];

    offsetPolygonPoints1.push(offsetPoint1);
    offsetPolygonPoints2.push(offsetPoint2);
  }

  // Close the polygon by adding the last two points
  const lastPoint = points[points.length - 1];
  const secondLastPoint = points[points.length - 2];
  let lastPerp = calculatePerpendicular(secondLastPoint, lastPoint);

  lastPerp = normalize(lastPerp);
  lastPerp = lastPerp.map((coord) => coord * offset);

  offsetPolygonPoints1.push([
    lastPoint[0] + lastPerp[0],
    lastPoint[1] + lastPerp[1],
  ]);
  offsetPolygonPoints2.push([
    lastPoint[0] - lastPerp[0],
    lastPoint[1] - lastPerp[1],
  ]);

  // Return the points for the offset polygon
  return offsetPolygonPoints1.concat(offsetPolygonPoints2.reverse()).flat();
}
