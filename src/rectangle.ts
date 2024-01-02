export interface Rectangle {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const checkOverlapping = (a: Rectangle, b: Rectangle) => {
  // twice the distnace between the centers in the horizontal direction is less than the sum of the widths
  const doubleCenterDistanceHorizontal = Math.abs(2.0 * a.x + a.width - 2.0 * b.x - b.width);
  const totalWidth = a.width + b.width;
  const horozontalOverlap = doubleCenterDistanceHorizontal < totalWidth;

  const doubleCenterDistanceVertical = Math.abs(2.0 * a.y + a.height - 2.0 * b.y - b.height);
  const totalHeight = a.height + b.height;
  const verticalOverlap = doubleCenterDistanceVertical < totalHeight;

  return horozontalOverlap && verticalOverlap;
};

export const checkOverlappingAny = (rectangle: Rectangle, otherRectangles: Rectangle[]) => {
  return otherRectangles.some((otherRectangle) => checkOverlapping(otherRectangle, rectangle));
};
