type SoundCloudTrackCardProps = {
  title: string;
  genre?: string | null;
  artworkUrl?: string | null;
  fallbackCoverUrl: string;
  sourceUrl?: string;
  playUrl: string;
  pauseUrl: string;
  trackHref?: string;
  openHref?: string;
  openLabel?: string;
};

export default function SoundCloudTrackCard({
  title,
  genre,
  artworkUrl,
  fallbackCoverUrl,
  sourceUrl,
  playUrl,
  pauseUrl,
  trackHref,
  openHref,
  openLabel = "OPEN",
}: SoundCloudTrackCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#11151C]/60 transition duration-150 ease-out hover:border-[#5CC8FF]/40">
      <button
        type="button"
        data-sc-source={sourceUrl ?? trackHref ?? ""}
        data-sc-play={playUrl}
        data-sc-pause={pauseUrl}
        data-sc-title={title}
        data-sc-artwork={artworkUrl ?? ""}
        data-sc-href={trackHref ?? ""}
        className="block w-full text-left"
        aria-label={`Play ${title}`}
      >
        <div
          className="relative aspect-square w-full bg-[#1A2230] bg-cover bg-center"
          style={{ backgroundImage: `url('${fallbackCoverUrl}')` }}
        >
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-95 transition duration-150 ease-out group-hover:opacity-100"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition duration-150 ease-out group-hover:opacity-100">
            <span
              data-icon-toggle
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#5CC8FF]/60 bg-[#0A0C10]/70 text-[#E7EDF6]"
            >
              ▶
            </span>
          </div>
        </div>
      </button>
      <div className="p-3">
        <p className="text-sm font-semibold tracking-tight text-[#E7EDF6]">{title}</p>
        {genre ? <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#77849A]">{genre}</p> : null}
        {openHref ? (
          <a
            href={openHref}
            className="mt-3 inline-block text-xs font-semibold tracking-[0.12em] text-accent transition-colors hover:text-white"
          >
            {openLabel}
          </a>
        ) : null}
      </div>
    </article>
  );
}
