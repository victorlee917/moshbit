// status → coloured dot, the Supabase-style status pill
const STATUS_DOT: Record<string, string> = {
  draft: "#f5c451", // amber
  review: "#5aa2ff", // sky
  final: "#3ecf8e", // emerald
};

export default function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const dot = STATUS_DOT[status] ?? "#76736c";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-stage/60 px-2.5 py-1 text-[11px] font-medium text-smoke">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: dot }}
      />
      {label}
    </span>
  );
}
