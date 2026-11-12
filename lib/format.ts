/** Client-safe formatting helpers. */

/** "Rs 1,23,450" */
export function formatRs(n: number): string {
  return `Rs ${Math.round(Number(n)).toLocaleString("en-IN")}`;
}
