/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Euler-Mascheroni constant
const EULER_MASCHERONI = 0.5772156649;

/**
 * Average path length of unsuccessful search in BST, used as normalization factor in Isolation Forest.
 */
export function c(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * (Math.log(n - 1) + EULER_MASCHERONI) - (2 * (n - 1)) / n;
}

interface TreeNode {
  isLeaf: boolean;
  size: number;
  splitFeature?: number;
  splitValue?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export interface TransactionFeatureVector {
  amountNorm: number; // Feature 0: Normalized amount per account
  hourPenalty: number; // Feature 1: Time of day (0=regular business hours, 1=dead of night)
  diffFromMean: number; // Feature 2: Relative difference from account mean
  temporalCluster: number; // Feature 3: Clustered burst / repeat distance (0=isolated, 1=rapid burst)
}

export class IsolationTree {
  root: TreeNode;
  maxHeight: number;

  constructor(data: number[][], currentHeight: number, maxHeight: number) {
    this.maxHeight = maxHeight;
    this.root = this.buildTree(data, currentHeight, maxHeight);
  }

  private buildTree(data: number[][], currentHeight: number, maxHeight: number): TreeNode {
    if (currentHeight >= maxHeight || data.length <= 1) {
      return { isLeaf: true, size: data.length };
    }

    const numFeatures = data[0].length;
    // Pick a random feature that has varying values
    const featureIndices = Array.from({ length: numFeatures }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (const q of featureIndices) {
      let min = Infinity;
      let max = -Infinity;
      for (const row of data) {
        if (row[q] < min) min = row[q];
        if (row[q] > max) max = row[q];
      }

      if (min < max) {
        const p = min + Math.random() * (max - min);
        const leftData: number[][] = [];
        const rightData: number[][] = [];

        for (const row of data) {
          if (row[q] < p) {
            leftData.push(row);
          } else {
            rightData.push(row);
          }
        }

        if (leftData.length > 0 && rightData.length > 0) {
          return {
            isLeaf: false,
            size: data.length,
            splitFeature: q,
            splitValue: p,
            left: this.buildTree(leftData, currentHeight + 1, maxHeight),
            right: this.buildTree(rightData, currentHeight + 1, maxHeight),
          };
        }
      }
    }

    return { isLeaf: true, size: data.length };
  }

  public pathLength(x: number[], node: TreeNode, currentHeight: number): number {
    if (node.isLeaf) {
      return currentHeight + c(node.size);
    }

    const feature = node.splitFeature!;
    const val = node.splitValue!;

    if (x[feature] < val) {
      return node.left ? this.pathLength(x, node.left, currentHeight + 1) : currentHeight;
    } else {
      return node.right ? this.pathLength(x, node.right, currentHeight + 1) : currentHeight;
    }
  }
}

export class IsolationForest {
  trees: IsolationTree[] = [];
  subsampleSize: number;
  numTrees: number;

  constructor(numTrees: number = 35, subsampleSize: number = 128) {
    this.numTrees = numTrees;
    this.subsampleSize = subsampleSize;
  }

  public fit(dataset: number[][]): void {
    this.trees = [];
    const n = dataset.length;
    if (n === 0) return;

    const sampleSize = Math.min(this.subsampleSize, n);
    const maxHeight = Math.ceil(Math.log2(sampleSize));

    for (let i = 0; i < this.numTrees; i++) {
      // Draw random subsample without replacement
      const shuffled = [...dataset].sort(() => Math.random() - 0.5);
      const sample = shuffled.slice(0, sampleSize);
      this.trees.push(new IsolationTree(sample, 0, maxHeight));
    }
  }

  public score(x: number[]): number {
    if (this.trees.length === 0) return 10;

    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += tree.pathLength(x, tree.root, 0);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const cVal = c(this.subsampleSize);
    if (cVal === 0) return 10;

    // raw score: s = 2 ^ (-E(h) / c(psi))
    // Typically s ranges from ~0.35 (very normal) to ~0.85+ (outlier)
    const rawScore = Math.pow(2, -avgPathLength / cVal);

    // Normalize rawScore [0.35 .. 0.85] to standard 0 .. 100
    // Anything below 0.45 is low risk (<30), 0.55 ~ 50, >0.7 ~ 85+
    let scaled = (rawScore - 0.38) / (0.75 - 0.38);
    scaled = Math.max(0, Math.min(1, scaled)) * 100;
    return Math.round(scaled);
  }
}

/**
 * Converts a raw transaction into a 4-dimensional feature vector for Isolation Forest.
 */
export function extractFeatures(
  amount: number,
  timeStr: string, // "HH:mm:ss"
  accountAvgAmount: number,
  accountStdAmount: number,
  burstFactor: number = 0 // 0 to 1 based on nearby similar transactions
): number[] {
  // Feature 0: Normalized amount (Z-score like or log difference)
  const safeAvg = Math.max(accountAvgAmount, 100000);
  const safeStd = Math.max(accountStdAmount, safeAvg * 0.5);
  const zAmount = Math.max(-2, Math.min(10, (amount - safeAvg) / safeStd));

  // Feature 1: Hour penalty (0 = 08:00-17:00, 0.5 = 18:00-21:00, 1.0 = 22:00-05:00)
  const hour = parseInt(timeStr.split(':')[0], 10) || 12;
  let hourPenalty = 0;
  if (hour >= 22 || hour < 5) {
    hourPenalty = 1.0; // Dead of night
  } else if (hour >= 5 && hour < 8) {
    hourPenalty = 0.5; // Early morning
  } else if (hour >= 18 && hour < 22) {
    hourPenalty = 0.4; // Evening
  } else {
    hourPenalty = 0.0; // Normal banking hours
  }

  // Feature 2: Ratio difference from account mean
  const diffFromMean = Math.min(10, Math.abs(amount - safeAvg) / safeAvg);

  // Feature 3: Burst / temporal cluster factor
  const temporalCluster = Math.max(0, Math.min(1, burstFactor));

  return [zAmount, hourPenalty, diffFromMean, temporalCluster];
}
