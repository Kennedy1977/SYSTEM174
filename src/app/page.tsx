import ButtonPrimary from "@/components/ButtonPrimary";
import BadgeStatus from "@/components/BadgeStatus";
import Card from "@/components/Card";
import Section from "@/components/Section";
import SocialPlatformIcon from "@/components/SocialPlatformIcon";
import SoundCloudTrackCard from "@/components/SoundCloudTrackCard";
import {
  buildPageMetadata,
  siteStructuredData,
  siteTitle,
} from "@/lib/site-meta";
import { getCachedSoundCloudDashboardData } from "@/lib/soundcloud-dashboard-cache";
import { buildSystem174Catalog } from "@/lib/soundcloud-catalog";
import { getSoundCloudCatalogOverrides } from "@/lib/soundcloud-catalog-overrides";
import { getSoundCloudPlayerUrl } from "@/lib/soundcloud-embed";

export const metadata = buildPageMetadata({
  title: siteTitle,
  path: "/",
});

export const dynamic = "force-dynamic";

const fallbackCoverUrl = "/textures/bg-main.png";
const latestDropAppleMusicUrl =
  "https://music.apple.com/gb/album/chasing-shadows-single/1882690504";
const latestDropAmazonMusicUrl =
  "https://amazon.co.uk/music/player/albums/B0GR9ZCV6J?marketplaceId=A1F83G8C2ARO7P&musicTerritory=GB&ref=dm_sh_fC1FN6Z7Z2nEpsF8qM1OTvl1k";
const latestDropSpotifyUrl =
  "https://open.spotify.com/album/4zz1bGL54iNx6LTiiC3vS1?si=rI8sNXa8TA-EbEjnOAtGHg";
const projectEras = [
  {
    name: "Andy K",
    years: "1996-2015",
    description:
      "Underground electronic archives from the rave era - house, techno, and experimental club tools. Raw grooves, hardware pressure, and DIY sound design from the early years.",
  },
  {
    name: "The Pimpsoul Project",
    years: "2023-2025",
    description:
      "A completed chapter of techno x drum & bass crossover experiments - club-focused, bass-led, and built for movement. No further releases are planned under this name.",
  },
  {
    name: "System 174",
    years: "2025-present",
    description:
      "174 BPM drum & bass pressure - dark, controlled, and built for DJs. Includes drum & bass remixes and reworks of classic Andy K and The Pimpsoul Project material, rebuilt for modern systems.",
  },
] as const;

export default async function HomePage() {
  const [dashboardData, catalogOverrides] = await Promise.all([
    getCachedSoundCloudDashboardData(),
    getSoundCloudCatalogOverrides(),
  ]);
  const soundcloud = buildSystem174Catalog(dashboardData, catalogOverrides);
  const selectedTracks = soundcloud.tracks
    .filter((track) => {
      const genre = (track.genre ?? "").trim().toLowerCase();
      const sharing = (track.sharing ?? "").toLowerCase();
      const isBlocked = (track.access ?? "")
        .toLowerCase()
        .split(",")
        .map((part) => part.trim())
        .includes("blocked");
      return genre === "drum & bass" && sharing !== "private" && !isBlocked;
    })
    .sort((a, b) => {
      const likeDiff = (b.favoritings_count ?? 0) - (a.favoritings_count ?? 0);
      if (likeDiff !== 0) return likeDiff;
      const playDiff = (b.playback_count ?? 0) - (a.playback_count ?? 0);
      if (playDiff !== 0) return playDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 4)
    .map((track) => ({
      title: track.title,
      href: track.permalink_url,
      soundcloudUrl: track.permalink_url,
      artworkUrl: track.artwork_url ?? "",
      genre: track.genre ?? "",
    }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData) }}
      />

      <Section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8" id="home">
          <div className="md:col-span-8">
            <p className="label-ui">Liverpool, UK</p>
            <h1 className="mt-4 font-brand text-4xl uppercase tracking-[-0.02em] text-white md:text-5xl lg:text-6xl">
              SYSTEM <span className="text-accent">174</span>
            </h1>
            <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              SYSTEM 174 is dark, rolling drum &amp; bass built for pressure rather than spectacle.
              It runs at full 174 BPM, driven by tight breakbeats and a solid two-step backbone
              that keeps the groove locked in.
            </p>
            <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              The bass is usually a deep, sustained Reese or heavy sub, evolving slowly instead of
              wobbling all over the place. Atmospheres lean industrial, metallic textures, distant
              drones, and sparse melodies that create tension without overcrowding the mix.
            </p>
            <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              Tracks are arranged for DJs, with long intros, extended rolling sections, and clean
              outros for easy blending. Vocals are minimal, maybe a ragga toast or a short sample,
              but the focus stays on the groove.
            </p>
            <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              In short, SYSTEM 174 is controlled, underground drum &amp; bass pressure, cold,
              mechanical, and built for dark rooms and big sound systems.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonPrimary href="/music">LISTEN</ButtonPrimary>
            </div>
          </div>
          <div className="md:col-span-4">
            <Card>
              <p className="label-ui">LATEST DROP</p>
              <div className="mt-4">
                <BadgeStatus status="NEW" />
              </div>
              <h3 className="mt-4 font-display text-xl uppercase tracking-[-0.01em]">
                Chasing Shadows
              </h3>
              <p className="mt-2 font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                SYSTEM 174
              </p>
              <p className="mt-3 font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                Release Date: 20 March 2026
              </p>
              <p className="font-body text-[14px] leading-relaxed text-[#AAB6C6]">Genre: Dance</p>
              <p className="font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                Sub Genre: Jungle/Drum&apos;n&apos;bass
              </p>
              <p className="font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                Label: SYSTEM 174
              </p>
              <p className="font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                UPC: 823191180401
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/playlists?genre=Drum+%26+Bass&playlist=2199354848"
                  className="inline-block text-sm font-semibold tracking-[0.04em] text-accent transition-colors hover:text-white"
                >
                  VIEW RELEASE
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={latestDropAppleMusicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#E7EDF6] transition-colors hover:border-[#5CC8FF]/60 hover:text-white"
                >
                  <SocialPlatformIcon platform="apple-music" className="h-4 w-4 shrink-0" />
                  <span>Apple</span>
                </a>
                <a
                  href={latestDropAmazonMusicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#E7EDF6] transition-colors hover:border-[#5CC8FF]/60 hover:text-white"
                >
                  <SocialPlatformIcon platform="amazon-music" className="h-4 w-4 shrink-0" />
                  <span>Amazon</span>
                </a>
                <a
                  href={latestDropSpotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#E7EDF6] transition-colors hover:border-[#5CC8FF]/60 hover:text-white"
                >
                  <SocialPlatformIcon platform="spotify" className="h-4 w-4 shrink-0" />
                  <span>Spotify</span>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      <Section
        title="THREE ERAS"
        description="Three eras. One artist. From the underground archives of Andy K, through the crossover experiments of The Pimpsoul Project, to the current drum & bass focus of SYSTEM 174."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {projectEras.map((era) => (
            <article
              key={`${era.name}-${era.years}`}
              className={[
                "rounded-2xl border bg-[#11151C]/70 p-5 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)] sm:p-6",
                era.name === "System 174" ? "border-[#5CC8FF]/35" : "border-white/10",
              ].join(" ")}
            >
              <p className="label-ui">{era.years}</p>
              <h3 className="mt-3 font-display text-xl uppercase tracking-[-0.01em] text-white">
                {era.name}
              </h3>
              <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                {era.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <Card>
            <p className="font-display text-2xl uppercase tracking-[-0.015em] text-white">
              Three Eras. One Artist.
            </p>
            <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              From the underground archives of Andy K, through the crossover experiments of The
              Pimpsoul Project, to the current drum &amp; bass focus of SYSTEM 174.
            </p>
            <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              SYSTEM 174 is the current active project. Andy K and The Pimpsoul Project are
              archive and legacy identities connected to the same artist.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="SELECTED TRACKS">
        {selectedTracks.length === 0 ? (
          <Card>
            <p className="font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              No Drum &amp; Bass tracks are currently available.
            </p>
          </Card>
        ) : (
          <div
            id="home-selected-tracks"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4"
          >
            {selectedTracks.map((track) => (
              <SoundCloudTrackCard
                key={track.href}
                title={track.title}
                genre={track.genre}
                artworkUrl={track.artworkUrl}
                fallbackCoverUrl={fallbackCoverUrl}
                sourceUrl={track.soundcloudUrl || track.href}
                playUrl={getSoundCloudPlayerUrl(track.soundcloudUrl || track.href)}
                pauseUrl={getSoundCloudPlayerUrl(track.soundcloudUrl || track.href, false)}
                trackHref={track.soundcloudUrl || track.href}
              />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
