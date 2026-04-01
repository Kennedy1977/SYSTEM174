type BadgeStatusProps = {
  status: "LOW_TICKETS" | "SOLD_OUT" | "NEW" | "NONE";
};

export default function BadgeStatus({ status }: BadgeStatusProps) {
  if (status === "LOW_TICKETS" || status === "NEW") {
    return (
      <span className="inline-flex items-center rounded-full border border-[#5CC8FF]/30 bg-[#5CC8FF]/10 px-2.5 py-1 text-xs font-semibold text-[#5CC8FF]">
        {status === "LOW_TICKETS" ? "LOW TICKETS" : "NEW"}
      </span>
    );
  }

  if (status === "SOLD_OUT") {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-transparent px-2.5 py-1 text-xs font-semibold text-[#77849A]">
        SOLD OUT
      </span>
    );
  }

  return null;
}
