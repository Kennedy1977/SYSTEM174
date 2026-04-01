type Platform =
  | "soundcloud"
  | "amazon-music"
  | "apple-music"
  | "spotify"
  | "youtube"
  | "youtube-music"
  | "instagram";

type SocialPlatformIconProps = {
  platform: Platform;
  className?: string;
};

export default function SocialPlatformIcon({
  platform,
  className = "h-4 w-4",
}: SocialPlatformIconProps) {
  if (platform === "soundcloud") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.75 10.9v5.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5.9 9.9v6.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8.05 8.9v7.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M9.55 15.95h7.65a2.95 2.95 0 0 0 .28-5.88 4.7 4.7 0 0 0-8.87-.47 2.7 2.7 0 0 0 .94 5.35Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (platform === "amazon-music") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4.35 16.4c1.78 1.18 3.99 1.77 6.63 1.77 2.55 0 4.93-.66 7.13-1.98"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
        <path
          d="M16.7 16.45h2.95v2.9"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.25 9.1v5.9a2 2 0 1 1-1.55-1.94"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14.8 7.7v5.55" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
        <circle cx="14.8" cy="6.15" r="1.15" fill="currentColor" />
      </svg>
    );
  }

  if (platform === "apple-music") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15.75 3.25a3.8 3.8 0 0 0-2.28 3.52c0 .18.02.37.05.55 1.02.08 2-.29 2.74-1.03.7-.7 1.15-1.76 1.09-2.79-.57.03-1.2.27-1.6.57Z" />
        <path d="M17.8 12.93c-.02-2.13 1.74-3.16 1.82-3.21-1-.99-2.54-1.12-3.08-1.14-1.31-.13-2.56.77-3.22.77-.67 0-1.7-.75-2.8-.73-1.44.02-2.77.84-3.52 2.15-1.51 2.61-.39 6.49 1.08 8.62.72 1.04 1.58 2.2 2.71 2.16 1.09-.04 1.5-.69 2.82-.69 1.33 0 1.7.69 2.84.66 1.17-.02 1.92-1.05 2.63-2.1.82-1.2 1.16-2.36 1.18-2.42-.03-.01-2.25-.86-2.46-4.07Z" />
      </svg>
    );
  }

  if (platform === "spotify") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="currentColor" />
        <path d="M8.2 10.05c2.65-.8 5.5-.65 8.57.44" stroke="#0A0C10" strokeWidth="1.55" strokeLinecap="round" />
        <path d="M8.95 12.63c2.1-.58 4.35-.47 6.77.35" stroke="#0A0C10" strokeWidth="1.45" strokeLinecap="round" />
        <path d="M9.8 15.12c1.67-.4 3.43-.31 5.27.29" stroke="#0A0C10" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    );
  }

  if (platform === "youtube") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.4" y="6.3" width="17.2" height="11.4" rx="3.2" fill="currentColor" />
        <path d="M10 9.35 15.35 12 10 14.65V9.35Z" fill="#0A0C10" />
      </svg>
    );
  }

  if (platform === "youtube-music") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.75" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11.1 9.7 14.4 12l-3.3 2.3V9.7Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" />
    </svg>
  );
}
