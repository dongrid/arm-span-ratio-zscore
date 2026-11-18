"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import AsrChart from "@/components/AsrChart";
import { getLMS, calcZScore, AGE_MIN, AGE_MAX, type Sex } from "@/lib/asr";

function zColor(z: number): string {
  if (z > 2.0) return "text-orange-500 dark:text-orange-400";
  if (z > 1.0) return "text-amber-500 dark:text-amber-400";
  if (z >= -1.0) return "text-emerald-600 dark:text-emerald-400";
  if (z >= -2.0) return "text-amber-500 dark:text-amber-400";
  return "text-orange-500 dark:text-orange-400";
}

function zInterpret(z: number): string {
  if (z > 2.0) return "高値（+2 SD 超）：身長に比べ腕が長い";
  if (z > 1.0) return "やや高値（+1〜+2 SD）";
  if (z >= -1.0) return "正常範囲（±1 SD 以内）";
  if (z >= -2.0) return "やや低値（−2〜−1 SD）";
  return "低値（−2 SD 未満）：身長に比べ腕が短い";
}

const CUTOFFS = [
  { value: 0.96, dir: "below" as const, label: "軟骨無形成症", note: "日本の診断基準（指極/身長 < 0.96）" },
  { value: 0.965, dir: "below" as const, label: "SHOX異常症", note: "Rappold 2007 のスコア項目（欧州、< 0.965）" },
  { value: 1.05, dir: "above" as const, label: "Marfan症候群", note: "改訂Ghent基準（成人、> 1.05）" },
];

const inputCls =
  "w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function parsePositive(s: string): number | null {
  if (s === "") return null;
  const n = parseFloat(s);
  return !isNaN(n) && n > 0 ? n : null;
}

const toggleCls = (on: boolean) =>
  `flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    on
      ? "bg-blue-600 text-white"
      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
  }`;

export default function Home() {
  const [sex, setSex] = useState<Sex>("male");
  const [ageMode, setAgeMode] = useState<"simple" | "exact">("simple");
  const [ageYear, setAgeYear] = useState<number>(10);
  const [ageMonth, setAgeMonth] = useState<number>(0);
  const [birthDate, setBirthDate] = useState<string>("");
  const [measureDate, setMeasureDate] = useState<string>(() =>
    new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })
  );
  const [heightInput, setHeightInput] = useState<string>("");
  const [spanInput, setSpanInput] = useState<string>("");

  const age = useMemo((): number | null => {
    if (ageMode === "exact") {
      if (!birthDate) return null;
      const ms = new Date(measureDate).getTime() - new Date(birthDate).getTime();
      return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.25));
    }
    return ageYear + ageMonth / 12;
  }, [ageMode, ageYear, ageMonth, birthDate, measureDate]);

  const outOfRange = age !== null && (age < AGE_MIN || age > AGE_MAX);

  const result = useMemo(() => {
    const h = parsePositive(heightInput);
    const sp = parsePositive(spanInput);
    const ratio = h !== null && sp !== null ? sp / h : null;
    if (ratio === null || age === null || outOfRange) return { ratio, z: null, M: null, L: null, S: null };
    const { L, M, S } = getLMS(sex, age);
    return { ratio, z: calcZScore(ratio, L, M, S), M, L, S };
  }, [heightInput, spanInput, age, outOfRange, sex]);


  return (
    <AppShell title="指極身長比 SDS" subtitle="6〜18 歳 · 日本人小児 · Hirano 2025（Am J Hum Biol）" maxWidth="6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">性別</p>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setSex("male")} className={toggleCls(sex === "male")}>男子</button>
              <button onClick={() => setSex("female")} className={toggleCls(sex === "female")}>女子</button>
            </div>

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">年齢</p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setAgeMode("simple")} className={toggleCls(ageMode === "simple")}>年齢で入力</button>
              <button onClick={() => setAgeMode("exact")} className={toggleCls(ageMode === "exact")}>生年月日から計算</button>
            </div>

            {ageMode === "simple" ? (
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <select value={ageYear} onChange={(e) => setAgeYear(Number(e.target.value))} className={inputCls}>
                      {Array.from({ length: 13 }, (_, i) => i + 6).map((y) => (
                        <option key={y} value={y}>{y} 歳</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <select value={ageMonth} onChange={(e) => setAgeMonth(Number(e.target.value))} className={inputCls}>
                      {Array.from({ length: 12 }, (_, m) => m).map((m) => (
                        <option key={m} value={m}>{m} か月</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
                  {ageYear} 歳 {ageMonth} か月（{(ageYear + ageMonth / 12).toFixed(2)} 歳）
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">生年月日</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">測定日</label>
                  <input type="date" value={measureDate} onChange={(e) => setMeasureDate(e.target.value)} className={inputCls} />
                </div>
                {age === null && <p className="text-xs text-amber-500">生年月日を入力してください</p>}
                {age !== null && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
                    {Math.floor(age)} 歳 {Math.floor((age - Math.floor(age)) * 12)} か月（{age.toFixed(2)} 歳）
                  </p>
                )}
              </div>
            )}
            {outOfRange && (
              <p className="mt-2 text-xs text-red-500 font-medium">対象年齢範囲外です（6〜18 歳のみ）</p>
            )}

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-4 mb-3">測定値</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">身長 (cm)</label>
                <input type="number" inputMode="decimal" value={heightInput} onChange={(e) => setHeightInput(e.target.value)} placeholder="130.0" step={0.1} min={0} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 mb-1 block">指極 (cm)</label>
                <input type="number" inputMode="decimal" value={spanInput} onChange={(e) => setSpanInput(e.target.value)} placeholder="128.0" step={0.1} min={0} className={inputCls} />
              </div>
              {result.ratio !== null && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                  指極 / 身長 = <span className="font-mono font-semibold">{result.ratio.toFixed(4)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              指極身長比曲線（{sex === "male" ? "男子" : "女子"}）
            </p>

            {result.z !== null && (
              <div className={`mb-3 rounded-xl px-4 py-3 flex items-center justify-between ${
                Math.abs(result.z) > 2.0 ? "bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800" : "bg-slate-50 dark:bg-slate-900"
              }`}>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">指極身長比 SDS</p>
                  <p className={`text-2xl font-bold tabular-nums ${zColor(result.z)}`}>
                    {result.z >= 0 ? "+" : ""}{result.z.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{zInterpret(result.z)}</p>
                </div>
                <div className="text-right text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {result.M !== null && <p>平均 = {result.M.toFixed(4)}</p>}
                  {result.L !== null && result.S !== null && (
                    <>
                      <p>L = {result.L.toFixed(3)}</p>
                      <p>S = {result.S.toFixed(4)}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {age !== null && !outOfRange && (() => {
              const { L, M, S } = getLMS(sex, age);
              return (
                <div className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    固定のカットオフは、この年齢・性別では何 SD か
                  </p>
                  <table className="w-full text-xs">
                    <tbody>
                      {CUTOFFS.map((c) => {
                        const z = calcZScore(c.value, L, M, S);
                        const hit =
                          result.ratio !== null &&
                          (c.dir === "below" ? result.ratio < c.value : result.ratio > c.value);
                        return (
                          <tr key={c.value} className="border-t border-slate-100 dark:border-slate-700 first:border-0">
                            <td className="py-1.5 pr-2 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {c.dir === "below" ? "<" : ">"} {c.value}
                            </td>
                            <td className="py-1.5 pr-2 text-slate-600 dark:text-slate-300">
                              {c.label}
                              <span className="block text-slate-400 dark:text-slate-500">{c.note}</span>
                            </td>
                            <td className="py-1.5 pr-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {z >= 0 ? "+" : ""}{z.toFixed(2)} SD
                            </td>
                            <td className="py-1.5 text-right whitespace-nowrap">
                              {hit && <span className="text-orange-500 dark:text-orange-400 font-medium">該当</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <AsrChart sex={sex} ageYears={age} ratio={result.ratio} zScore={result.z} />

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-orange-500 dark:text-orange-400">目安：</span>
                −2 SD 未満は四肢が短い不均衡（SHOX異常症・軟骨無形成症など）、+2 SD 超は四肢が長い体型（Marfan症候群・類宦官体型）を考える。
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                固定のカットオフは年齢によって SD が変わるので、SDS と併せて判断する。日本人は欧州の子どもより比が小さく、Marfan症候群の 1.05 は15歳未満と女子では満たしにくい（Hirano 2025）。
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                6 歳未満・18 歳超は日本人の基準がないため計算しない。
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
