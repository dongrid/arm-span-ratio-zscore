// 指極/身長比の基準：Hirano Y, Inokuchi M, Narumi S, Hasegawa T. Reference values of arm span
// and arm span to height ratio of Japanese population in childhood and adolescence.
// Am J Hum Biol. 2025;37(4):e70051.（1992〜1994年の全国人体寸法調査、LMS法、6〜18歳）
//
// z = [(X/M)^L − 1] / (L·S)   (L ≠ 0)
// z = ln(X/M) / S            (L = 0)

import { LMS_TABLE, type LMSRow, type Sex } from "./lmsTable";

export type { Sex };
export const AGE_MIN = 6.0;
export const AGE_MAX = 18.0;

export function getLMS(sex: Sex, age: number): LMSRow {
  const a = Math.min(Math.max(age, AGE_MIN), AGE_MAX);
  const t = LMS_TABLE[sex];
  let i = 0;
  while (i < t.length - 2 && t[i + 1][0] <= a) i++;
  const [a0, L0, M0, S0] = t[i];
  const [a1, L1, M1, S1] = t[i + 1];
  const f = (a - a0) / (a1 - a0);
  const lerp = (x: number, y: number) => x + (y - x) * f;
  return { age: a, L: lerp(L0, L1), M: lerp(M0, M1), S: lerp(S0, S1) };
}

export function calcZScore(x: number, L: number, M: number, S: number): number {
  if (Math.abs(L) < 1e-6) return Math.log(x / M) / S;
  return (Math.pow(x / M, L) - 1) / (L * S);
}

export function zToValue(z: number, L: number, M: number, S: number): number {
  if (Math.abs(L) < 1e-6) return M * Math.exp(z * S);
  const inner = 1 + L * S * z;
  if (inner <= 0) return 0;
  return M * Math.pow(inner, 1 / L);
}
