/** Small coloured badges used on several screens. */
export function Badge({
  color,
  children,
}: {
  color: "red" | "amber" | "blue" | "slate" | "green";
  children: React.ReactNode;
}) {
  const styles = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-200 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
  }[color];
  return (
    <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
}

export function StockBadges({
  low,
  atRisk,
  poId,
}: {
  low: boolean;
  atRisk: boolean;
  poId: number | null;
}) {
  return (
    <>
      {low && <Badge color="red">LOW</Badge>}
      {atRisk && <Badge color="amber">AT RISK</Badge>}
      {poId !== null && <Badge color="blue">On PO #{poId}</Badge>}
    </>
  );
}
