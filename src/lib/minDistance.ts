/**
 * Function to return the minimum distance
 * between a line segment AB and a point E
 */
export const minDistance = (A: Point, B: Point, E: Point) => {
  const AB = [B.x - A.x, B.y - A.y] as const;
  const BE = [E.x - B.x, E.y - B.y] as const;
  const AE = [E.x - A.x, E.y - A.y] as const;

  // Calculating the dot product
  const AB_BE = AB[0] * BE[0] + AB[1] * BE[1];
  const AB_AE = AB[0] * AE[0] + AB[1] * AE[1];

  // Minimum distance from
  // point E to the line segment

  // Case 1
  if (AB_BE > 0) {
    // Finding the magnitude
    const y = E.y - B.y;
    const x = E.x - B.x;
    return Math.sqrt(x * x + y * y);
  }

  // Case 2
  else if (AB_AE < 0) {
    const y = E.y - A.y;
    const x = E.x - A.x;
    return Math.sqrt(x * x + y * y);
  }

  // Case 3
  else {
    // Finding the perpendicular distance
    const x1 = AB[0];
    const y1 = AB[1];
    const x2 = AE[0];
    const y2 = AE[1];
    const mod = Math.sqrt(x1 * x1 + y1 * y1);
    return Math.abs(x1 * y2 - y1 * x2) / mod;
  }
};
