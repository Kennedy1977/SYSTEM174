import BadgeStatus from "@/components/BadgeStatus";
import ButtonPrimary from "@/components/ButtonPrimary";
import Card from "@/components/Card";
import Section from "@/components/Section";
import SocialPlatformIcon from "@/components/SocialPlatformIcon";
import SoundCloudTrackCard from "@/components/SoundCloudTrackCard";
import { getCachedSoundCloudDashboardData } from "@/lib/soundcloud-dashboard-cache";
import { getSiteVariant } from "@/lib/site-config";
import { buildBrandCatalog } from "@/lib/soundcloud-catalog";
import { getSoundCloudCatalogOverrides } from "@/lib/soundcloud-catalog-overrides";
import { getSoundCloudPlayerUrl } from "@/lib/soundcloud-embed";
import {
  buildPageMetadata,
  siteStructuredData,
  siteTitle,
} from "@/lib/site-meta";

export const metadata = buildPageMetadata({
  title: siteTitle,
  path: "/",
});

export const dynamic = "force-dynamic";

const latestDropAppleMusicUrl =
  "https://music.apple.com/gb/album/chasing-shadows-single/1882690504";
const latestDropAmazonMusicUrl =
  "https://amazon.co.uk/music/player/albums/B0GR9ZCV6J?marketplaceId=A1F83G8C2ARO7P&musicTerritory=GB&ref=dm_sh_fC1FN6Z7Z2nEpsF8qM1OTvl1k";
const latestDropSpotifyUrl =
  "https://open.spotify.com/album/4zz1bGL54iNx6LTiiC3vS1?si=rI8sNXa8TA-EbEjnOAtGHg";

export default async function HomePage() {
  const siteVariant = getSiteVariant();
  const [dashboardData, catalogOverrides] = await Promise.all([
    getCachedSoundCloudDashboardData(),
    getSoundCloudCatalogOverrides(),
  ]);
  const soundcloud = buildBrandCatalog(
    dashboardData,
    catalogOverrides,
    siteVariant === "pimpsoul" ? "pimpsoul" : "system174",
  );
  const fallbackCoverUrl =
    siteVariant === "pimpsoul"
      ? "/textures/bg-pimpsoul.png"
      : "/textures/bg-main.png";
  const selectedTracks = soundcloud.tracks
    .filter((track) => {
      const sharing = (track.sharing ?? "").toLowerCase();
      const isBlocked = (track.access ?? "")
        .toLowerCase()
        .split(",")
        .map((part) => part.trim())
        .includes("blocked");

      if (sharing === "private" || isBlocked) {
        return false;
      }

      if (siteVariant === "system174") {
        return (track.genre ?? "").trim().toLowerCase() === "drum & bass";
      }

      return true;
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

      {siteVariant === "pimpsoul" ? (
        <>
          <Section>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8" id="home">
              <div className="md:col-span-8">
                <p className="label-ui">Liverpool, UK</p>
                <h1 className="mt-4 font-brand text-4xl uppercase tracking-[-0.02em] text-white md:text-5xl lg:text-6xl">
                  THE PIMPSOUL <span className="text-accent">PROJECT</span>
                </h1>
                <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  The Pimpsoul Project is a club-focused crossover between techno weight and drum
                  &amp; bass movement. The sound leans low, physical, and bass-led, with hybrid
                  grooves built for motion rather than nostalgia.
                </p>
                <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  Rhythms push between four-floor tension, broken momentum, and heavier rolling
                  sections, keeping the energy flexible rather than locked to one lane.
                </p>
                <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  This project now remains online as a standalone catalogue. No new releases are
                  planned, but the music stays available across the artist platforms and archive
                  links.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonPrimary href="/music">LISTEN</ButtonPrimary>
                </div>
              </div>

              <div className="md:col-span-4">
                <Card>
                  <p className="label-ui">PROJECT STATUS</p>
                  <h3 className="mt-4 font-display text-xl uppercase tracking-[-0.01em] text-white">
                    Legacy Catalogue
                  </h3>
                  <p className="mt-4 font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                    The Pimpsoul Project remains online as a completed body of work.
                  </p>
                  <p className="mt-3 font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                    Techno x drum &amp; bass crossover pressure, preserved as a standalone archive.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonPrimary href="/contact">PLATFORMS</ButtonPrimary>
                  </div>
                </Card>
              </div>
            </div>
          </Section>

          <Section
            title="PROJECT PROFILE"
            description="Bass-led crossover movement, hybrid club structures, and a completed catalogue preserved online."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <p className="label-ui">SOUND</p>
                <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  Heavy low-end, hybrid drum programming, and crossover arrangements that move
                  between techno pressure and drum &amp; bass drive.
                </p>
              </Card>
              <Card>
                <p className="label-ui">STATUS</p>
                <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  The project is complete. The catalogue stays available as archive listening, but
                  no further releases are planned under this name.
                </p>
              </Card>
            </div>
          </Section>
        </>
      ) : (
        <>
          <Section>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8" id="home">
              <div className="md:col-span-8">
                <p className="label-ui">Liverpool, UK</p>
                <h1 className="mt-4 font-brand text-4xl uppercase tracking-[-0.02em] text-white md:text-5xl lg:text-6xl">
                  SYSTEM <span className="text-accent">174</span>
                </h1>
                <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  SYSTEM 174 is dark, rolling drum &amp; bass built for pressure rather than
                  spectacle. It runs at full 174 BPM, driven by tight breakbeats and a solid
                  two-step backbone that keeps the groove locked in.
                </p>
                <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  The bass is usually a deep, sustained Reese or heavy sub, evolving slowly instead
                  of wobbling all over the place. Atmospheres lean industrial, metallic textures,
                  distant drones, and sparse melodies that create tension without overcrowding the
                  mix.
                </p>
                <p className="mt-4 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  Tracks are arranged for DJs, with long intros, extended rolling sections, and
                  clean outros for easy blending. Vocals are minimal and the focus stays on the
                  groove.
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
                  <p className="font-body text-[14px] leading-relaxed text-[#AAB6C6]">
                    Genre: Dance
                  </p>
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
                      <SocialPlatformIcon
                        platform="apple-music"
                        className="h-4 w-4 shrink-0"
                      />
                      <span>Apple</span>
                    </a>
                    <a
                      href={latestDropAmazonMusicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#E7EDF6] transition-colors hover:border-[#5CC8FF]/60 hover:text-white"
                    >
                      <SocialPlatformIcon
                        platform="amazon-music"
                        className="h-4 w-4 shrink-0"
                      />
                      <span>Amazon</span>
                    </a>
                    <a
                      href={latestDropSpotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#E7EDF6] transition-colors hover:border-[#5CC8FF]/60 hover:text-white"
                    >
                      <SocialPlatformIcon
                        platform="spotify"
                        className="h-4 w-4 shrink-0"
                      />
                      <span>Spotify</span>
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </Section>

          <Section
            title="PROJECT PROFILE"
            description="Dark 174 BPM pressure, long-form DJ arrangements, and system-weight drum & bass built to function in the mix."
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <p className="label-ui">SOUND</p>
                <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  Tight breakbeats, deep subs, industrial texture, and controlled arrangements that
                  stay cold, direct, and DJ-functional.
                </p>
              </Card>
              <Card>
                <p className="label-ui">FOCUS</p>
                <p className="mt-3 font-body text-[15px] leading-relaxed text-[#AAB6C6]">
                  Active releases, current artist pages, and tracks built specifically for modern
                  drum &amp; bass systems and mix-ready set construction.
                </p>
              </Card>
            </div>
          </Section>
        </>
      )}

      <Section title="SELECTED TRACKS">
        {selectedTracks.length === 0 ? (
          <Card>
            <p className="font-body text-[15px] leading-relaxed text-[#AAB6C6]">
              No tracks are currently available.
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
