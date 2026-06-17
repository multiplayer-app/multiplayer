import { Graphics as PixiGraphics } from "pixi.js";

class Graphics extends PixiGraphics {
  private dashLength: number;
  private gapLength: number;

  constructor() {
    super();
    this.dashLength = 10;
    this.gapLength = 5;
  }

  dashedLineTo(x2, y2, dashLength = 10, gapLength = 5) {
    // Get the current position
    const x1 = this.currentPath.points[this.currentPath.points.length - 2] || 0;
    const y1 = this.currentPath.points[this.currentPath.points.length - 1] || 0;

    // Calculate the distance between the start and end points
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Normalize the direction of the line (unit vector)
    const dashX = deltaX / lineLength;
    const dashY = deltaY / lineLength;

    let currentX = x1;
    let currentY = y1;
    let remainingLength = lineLength;

    // Loop to draw the dashed line
    while (remainingLength > 0) {
      // Calculate the length of the current dash
      const segmentLength = Math.min(dashLength, remainingLength);

      // Move to the starting point of the current dash
      this.moveTo(currentX, currentY);

      // Calculate the end of the current dash segment
      const nextX = currentX + dashX * segmentLength;
      const nextY = currentY + dashY * segmentLength;

      // Draw the dash segment
      this.lineTo(nextX, nextY);

      // Move the current position to the end of the dash segment
      currentX = nextX + dashX * gapLength;
      currentY = nextY + dashY * gapLength;

      // Decrease the remaining length by the total of dash + gap
      remainingLength -= dashLength + gapLength;
    }
  }

  drawDashedRoundedRect(
    x,
    y,
    width,
    height,
    radius,
    dashLength = 10,
    gapLength = 5
  ) {
    this.setDashedLineStyle(dashLength, gapLength);

    // Draw dashes along each side with rounded corners
    this.drawDashedLine(x + radius, y, x + width - radius, y); // Top
    this.drawDashedArc(
      x + width - radius,
      y + radius,
      radius,
      1.5 * Math.PI,
      2 * Math.PI
    ); // Top-right corner
    this.drawDashedLine(x + width, y + radius, x + width, y + height - radius); // Right side
    this.drawDashedArc(
      x + width - radius,
      y + height - radius,
      radius,
      0,
      0.5 * Math.PI
    ); // Bottom-right corner
    this.drawDashedLine(x + width - radius, y + height, x + radius, y + height); // Bottom
    this.drawDashedArc(
      x + radius,
      y + height - radius,
      radius,
      0.5 * Math.PI,
      Math.PI
    ); // Bottom-left corner
    this.drawDashedLine(x, y + height - radius, x, y + radius); // Left side
    this.drawDashedArc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI); // Top-left corner
  }

  // Helper to draw a dashed line between two points
  drawDashedLine(x1, y1, x2, y2) {
    const totalLength = Math.hypot(x2 - x1, y2 - y1);
    const dashCount = Math.floor(
      totalLength / (this.dashLength + this.gapLength)
    );
    const angle = Math.atan2(y2 - y1, x2 - x1);

    for (let i = 0; i < dashCount; i++) {
      const dashX1 =
        x1 + i * (this.dashLength + this.gapLength) * Math.cos(angle);
      const dashY1 =
        y1 + i * (this.dashLength + this.gapLength) * Math.sin(angle);
      const dashX2 = dashX1 + this.dashLength * Math.cos(angle);
      const dashY2 = dashY1 + this.dashLength * Math.sin(angle);

      this.moveTo(dashX1, dashY1);
      this.lineTo(dashX2, dashY2);
    }
  }

  // Helper to draw a dashed arc
  drawDashedArc(cx, cy, radius, startAngle, endAngle) {
    const arcLength = radius * (endAngle - startAngle);
    const dashCount = Math.floor(
      arcLength / (this.dashLength + this.gapLength)
    );
    const angleStep = (endAngle - startAngle) / dashCount;

    for (let i = 0; i < dashCount; i++) {
      const angle1 = startAngle + i * angleStep;
      const angle2 =
        angle1 +
        angleStep * (this.dashLength / (this.dashLength + this.gapLength));

      const x1 = cx + radius * Math.cos(angle1);
      const y1 = cy + radius * Math.sin(angle1);
      const x2 = cx + radius * Math.cos(angle2);
      const y2 = cy + radius * Math.sin(angle2);

      this.moveTo(x1, y1);
      this.lineTo(x2, y2);
    }
  }

  setDashedLineStyle(dashLength, gapLength) {
    this.dashLength = dashLength;
    this.gapLength = gapLength;
  }
}

export default Graphics;
