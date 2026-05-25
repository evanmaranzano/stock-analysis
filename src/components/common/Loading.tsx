export default function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 rounded bg-gray-200" style={{ width: `${80 - i * 10}%` }} />
      ))}
    </div>
  );
}
