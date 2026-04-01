import BadgeStatus from "@/components/BadgeStatus";
import ButtonPrimary from "@/components/ButtonPrimary";

type Show = {
  date: string;
  city: string;
  venue: string;
  status: "LOW_TICKETS" | "SOLD_OUT" | "NEW" | "NONE";
  cta: string;
};

type ShowRowProps = {
  show: Show;
};

export default function ShowRow({ show }: ShowRowProps) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-white/10 py-4 last:border-b-0">
      <div className="col-span-3 font-mono text-sm text-[#E7EDF6] sm:col-span-2">{show.date}</div>
      <div className="col-span-7 sm:col-span-8">
        <p className="text-[15px] text-[#E7EDF6]">{show.city}</p>
        <p className="text-sm text-[#AAB6C6]">{show.venue}</p>
      </div>
      <div className="col-span-2 flex justify-end sm:col-span-2">
        {show.status === "LOW_TICKETS" || show.status === "SOLD_OUT" || show.status === "NEW" ? (
          <BadgeStatus status={show.status} />
        ) : (
          <ButtonPrimary>{show.cta}</ButtonPrimary>
        )}
      </div>
    </div>
  );
}
