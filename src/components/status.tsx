import { CheckCircle2, Clock, XCircle, CircleDashed, Ban, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP = {
  approved: { label: "Approved", cls: "bg-success-soft text-success", Icon: CheckCircle2 },
  completed: { label: "Completed", cls: "bg-success-soft text-success", Icon: Award },
  pending: { label: "Pending", cls: "bg-warning-soft text-warning", Icon: Clock },
  in_progress: { label: "In Progress", cls: "bg-warning-soft text-warning", Icon: Clock },
  rejected: { label: "Rejected", cls: "bg-danger-soft text-danger", Icon: XCircle },
  not_started: { label: "Not Started", cls: "bg-neutral-soft text-neutral", Icon: CircleDashed },
  cancelled: { label: "Cancelled", cls: "bg-neutral-soft text-neutral", Icon: Ban },
} as const;

export type AnyStatus = keyof typeof MAP;

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const m = MAP[(status as AnyStatus)] ?? MAP.not_started;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", m.cls, className)}>
      <m.Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

export function statusIcon(status: string) {
  return (MAP[(status as AnyStatus)] ?? MAP.not_started);
}

export function ProgressRing({ value, size = 120, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const done = value >= 100;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${value}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} className="fill-none stroke-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={10} strokeLinecap="round"
          className={cn("fill-none transition-[stroke-dashoffset] duration-700", done ? "stroke-success" : "stroke-primary")}
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(value, 100)) / 100}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold">{value}%</div>
        {label && <div className="text-[11px] text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}
