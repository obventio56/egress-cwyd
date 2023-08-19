type DataRow = {
  rowid: number;
  distance: number;
};

export function kMeans(
  data: DataRow[],
  k: number,
  threshold: number = 0.0001,
  maxIterations: number = 100
): DataRow[] {
  let centroids: number[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(data[Math.floor(Math.random() * data.length)].distance);
  }

  let previousCentroids: number[] = [];
  let iterations: number = 0;
  let clusters: DataRow[][] = Array.from({ length: k }, () => []);

  while (iterations < maxIterations) {
    clusters = Array.from({ length: k }, () => []);

    for (let point of data) {
      let nearestIndex: number = 0;
      let minDistance: number = Infinity;
      for (let i = 0; i < k; i++) {
        let distance: number = Math.abs(point.distance - centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      clusters[nearestIndex].push(point);
    }

    previousCentroids = [...centroids];

    for (let i = 0; i < k; i++) {
      centroids[i] =
        clusters[i].reduce((acc, val) => acc + val.distance, 0) /
        (clusters[i].length || 1);
    }

    let converged: boolean = true;
    for (let i = 0; i < k; i++) {
      if (Math.abs(centroids[i] - previousCentroids[i]) > threshold) {
        converged = false;
        break;
      }
    }

    if (converged) {
      break;
    }
    iterations++;
  }

  let minCentroidValue: number = Math.min(...centroids);
  let minCentroidIndex: number = centroids.indexOf(minCentroidValue);

  return clusters[minCentroidIndex];
}
