export interface Rectangle {
  width: number;
  height: number;
  left: number;
  top: number;
}

export const checkOverlapping = (a: Rectangle, b: Rectangle) => {
  // twice the distnace between the centers in the horizontal direction is less than the sum of the widths
  const doubleCenterDistanceHorizontal = Math.abs(2.0 * a.left + a.width - 2.0 * b.left - b.width);
  const totalWidth = a.width + b.width;
  const horozontalOverlap = doubleCenterDistanceHorizontal < totalWidth;

  const doubleCenterDistanceVertical = Math.abs(2.0 * a.top + a.height - 2.0 * b.top - b.height);
  const totalHeight = a.height + b.height;
  const verticalOverlap = doubleCenterDistanceVertical < totalHeight;

  return horozontalOverlap && verticalOverlap;
};

export const checkOverlappingAny = (rectangle: Rectangle, otherRectangles: Rectangle[]) => {
  return otherRectangles.some((otherRectangle) => checkOverlapping(otherRectangle, rectangle));
};
