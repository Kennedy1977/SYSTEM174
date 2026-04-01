import ButtonSecondary from "@/components/ButtonSecondary";

type MediaItem = {
  title: string;
  description: string;
  action: string;
};

type MediaDownloadCardProps = {
  item: MediaItem;
};

export default function MediaDownloadCard({ item }: MediaDownloadCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11151C]/70 p-5 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)] sm:p-6">
      <p className="text-sm font-semibold tracking-tight text-[#E7EDF6]">{item.title}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-[#AAB6C6]">{item.description}</p>
      <div className="mt-4">
        <ButtonSecondary>{item.action}</ButtonSecondary>
      </div>
    </div>
  );
}
