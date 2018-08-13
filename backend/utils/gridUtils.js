export function extractOrderedUids (grid) {
  try {
    return Object.keys(grid.cols)
      .map(key => grid.cols[key])
      .sort((a, b) => a.order - b.order)
      .map(col => col.uid);
  } catch (e) {
    return null;
  }
}