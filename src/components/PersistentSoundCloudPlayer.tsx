"use client";

import { useEffect } from "react";

const fallbackArtworkUrl = "/textures/bg-main.png";

type PlayerState = {
  sourceUrl: string;
  title: string;
  artworkUrl: string;
  href: string;
  visible: boolean;
  playing: boolean;
  durationMs: number;
  positionMs: number;
  progress: number;
};

const STORAGE_KEY = "system174.soundcloud.player";
const WIDGET_SCRIPT_SELECTOR = 'script[data-sc-widget-api="true"]';
const WIDGET_SCRIPT_SRC = "https://w.soundcloud.com/player/api.js";
const HIDE_DELAY_MS = 10000;
const FADE_DURATION_MS = 300;
const EMPTY_STATE: PlayerState = {
  sourceUrl: "",
  title: "",
  artworkUrl: "",
  href: "",
  visible: false,
  playing: false,
  durationMs: 0,
  positionMs: 0,
  progress: 0,
};

const widgetOptions = {
  auto_play: false,
  color: "#5CC8FF",
  buying: false,
  download: false,
  sharing: false,
  show_artwork: false,
  show_comments: false,
  show_playcount: false,
  show_reposts: false,
  show_teaser: false,
  show_user: false,
  single_active: false,
  visual: false,
} as const;

function upgradeArtworkUrl(url: string) {
  if (!url) return "";
  const [pathname, search = ""] = String(url).split("?");
  const upgraded = pathname.replace(
    /-(?:tiny|small|badge|t67x67|large|t300x300|crop|t500x500|original)\.(jpg|jpeg|png|webp)$/i,
    "-t500x500.$1",
  );
  return search ? `${upgraded}?${search}` : upgraded;
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function readStoredState(): PlayerState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_STATE };
    }

    const parsed = JSON.parse(raw);
    return { ...EMPTY_STATE, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return { ...EMPTY_STATE };
  }
}

function writeStoredState(state: PlayerState) {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sourceUrl: state.sourceUrl,
        title: state.title,
        artworkUrl: state.artworkUrl,
        href: state.href,
        visible: state.visible,
        playing: state.playing,
        durationMs: state.durationMs,
        positionMs: state.positionMs,
        progress: state.progress,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

function setTriggerState(trigger: HTMLElement | null, playing: boolean) {
  const toggleIcon = trigger?.querySelector("[data-icon-toggle]");
  const overlay = trigger?.querySelector(".pointer-events-none.absolute");

  if (overlay instanceof HTMLElement) {
    overlay.classList.toggle("opacity-100", playing);
    overlay.classList.toggle("opacity-0", !playing);
  }

  if (toggleIcon instanceof HTMLElement) {
    toggleIcon.textContent = playing ? "❚❚" : "▶";
    toggleIcon.classList.toggle("border-[#5CC8FF]/70", playing);
    toggleIcon.classList.toggle("bg-[#5CC8FF]/20", playing);
    toggleIcon.classList.toggle("border-[#5CC8FF]/60", !playing);
    toggleIcon.classList.toggle("bg-[#0A0C10]/70", !playing);
  }
}

export default function PersistentSoundCloudPlayer() {
  useEffect(() => {
    const root = document.getElementById("persistent-soundcloud-player");
    const shell = document.getElementById("persistent-soundcloud-player-shell");
    const frame = document.getElementById("persistent-soundcloud-player-frame");
    const artwork = document.getElementById("persistent-soundcloud-player-artwork");
    const title = document.getElementById("persistent-soundcloud-player-title");
    const link = document.getElementById("persistent-soundcloud-player-link");
    const toggle = document.getElementById("persistent-soundcloud-player-toggle");
    const toggleIcon = document.getElementById("persistent-soundcloud-player-toggle-icon");
    const progress = document.getElementById("persistent-soundcloud-player-progress");
    const progressFill = document.getElementById("persistent-soundcloud-player-progress-fill");
    const elapsed = document.getElementById("persistent-soundcloud-player-elapsed");
    const duration = document.getElementById("persistent-soundcloud-player-duration");

    if (
      !(root instanceof HTMLElement) ||
      !(shell instanceof HTMLElement) ||
      !(frame instanceof HTMLIFrameElement) ||
      !(artwork instanceof HTMLImageElement) ||
      !(title instanceof HTMLElement) ||
      !(link instanceof HTMLAnchorElement) ||
      !(toggle instanceof HTMLButtonElement) ||
      !(toggleIcon instanceof HTMLElement) ||
      !(progress instanceof HTMLElement) ||
      !(progressFill instanceof HTMLElement) ||
      !(elapsed instanceof HTMLElement) ||
      !(duration instanceof HTMLElement)
    ) {
      return;
    }

    if (window.__system174SoundCloudPlayer) {
      window.__system174SoundCloudPlayer.sync();
      return;
    }

    let state = readStoredState();
    let widget: SoundCloudWidgetInstance | null = null;
    let widgetApiPromise: Promise<
      NonNullable<NonNullable<Window["SC"]>["Widget"]>
    > | null = null;
    let widgetBound = false;
    let hideDelayTimer: number | null = null;
    let hideFadeTimer: number | null = null;

    const syncTriggerStates = (nextState: PlayerState) => {
      document.querySelectorAll("[data-sc-source]").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const isCurrent = Boolean(
          nextState.playing && nextState.sourceUrl && node.dataset.scSource === nextState.sourceUrl,
        );
        setTriggerState(node, isCurrent);
      });
    };

    const clearHideTimers = () => {
      if (hideDelayTimer) {
        window.clearTimeout(hideDelayTimer);
        hideDelayTimer = null;
      }

      if (hideFadeTimer) {
        window.clearTimeout(hideFadeTimer);
        hideFadeTimer = null;
      }
    };

    const showPlayer = () => {
      clearHideTimers();
      root.classList.remove("hidden");
      document.body.dataset.scFooterPlayer = "open";

      window.requestAnimationFrame(() => {
        shell.classList.remove("opacity-0", "translate-y-3");
        shell.classList.add("opacity-100", "translate-y-0");
      });
    };

    const hidePlayer = () => {
      clearHideTimers();
      shell.classList.remove("opacity-100", "translate-y-0");
      shell.classList.add("opacity-0", "translate-y-3");
      hideFadeTimer = window.setTimeout(() => {
        root.classList.add("hidden");
        document.body.dataset.scFooterPlayer = "closed";
        hideFadeTimer = null;
      }, FADE_DURATION_MS);
    };

    const scheduleHide = () => {
      clearHideTimers();
      hideDelayTimer = window.setTimeout(() => {
        state = { ...state, visible: false };
        writeStoredState(state);
        syncTriggerStates(state);
        hidePlayer();
        hideDelayTimer = null;
      }, HIDE_DELAY_MS);
    };

    const renderState = ({ persist = true }: { persist?: boolean } = {}) => {
      if (state.visible) {
        showPlayer();
      } else {
        hidePlayer();
      }

      title.textContent = state.title || "Select a track";
      artwork.src = state.artworkUrl || fallbackArtworkUrl;
      link.href = state.href || "#";
      link.classList.toggle("hidden", !state.href);
      toggle.setAttribute("aria-label", state.playing ? "Pause current track" : "Play current track");
      toggleIcon.textContent = state.playing ? "❚❚" : "▶";
      progressFill.style.width = `${Math.max(0, Math.min(1, state.progress)) * 100}%`;
      progress.setAttribute("aria-valuenow", String(Math.round(Math.max(0, Math.min(1, state.progress)) * 100)));
      elapsed.textContent = formatTime(state.positionMs);
      duration.textContent = formatTime(state.durationMs);

      if (persist) {
        writeStoredState(state);
      }
      syncTriggerStates(state);
    };

    const updateState = (partial: Partial<PlayerState>, options: { persist?: boolean } = {}) => {
      state = { ...state, ...partial };
      renderState(options);
    };

    const ensureWidgetApi = () => {
      if (window.SC?.Widget) {
        return Promise.resolve(window.SC.Widget as NonNullable<NonNullable<Window["SC"]>["Widget"]>);
      }

      if (widgetApiPromise) {
        return widgetApiPromise;
      }

      widgetApiPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(WIDGET_SCRIPT_SELECTOR);
        if (existing instanceof HTMLScriptElement) {
          const handleLoad = () => {
            if (window.SC?.Widget) {
              resolve(window.SC.Widget as NonNullable<NonNullable<Window["SC"]>["Widget"]>);
              return;
            }
            reject(new Error("SoundCloud Widget API did not initialize"));
          };

          existing.addEventListener("load", handleLoad, { once: true });
          existing.addEventListener("error", () => reject(new Error("Failed to load SoundCloud Widget API")), {
            once: true,
          });
          return;
        }

        const script = document.createElement("script");
        script.src = WIDGET_SCRIPT_SRC;
        script.async = true;
        script.dataset.scWidgetApi = "true";
        script.addEventListener(
          "load",
          () => {
            if (window.SC?.Widget) {
              resolve(window.SC.Widget as NonNullable<NonNullable<Window["SC"]>["Widget"]>);
              return;
            }
            reject(new Error("SoundCloud Widget API did not initialize"));
          },
          { once: true },
        );
        script.addEventListener("error", () => reject(new Error("Failed to load SoundCloud Widget API")), {
          once: true,
        });
        document.head.appendChild(script);
      });

      return widgetApiPromise;
    };

    const refreshFromCurrentSound = () => {
      if (!widget) return;

      widget.getCurrentSound((sound) => {
        if (!sound || typeof sound !== "object") return;
        const nextArtwork =
          upgradeArtworkUrl(sound.artwork_url ?? "") ||
          upgradeArtworkUrl(sound.user?.avatar_url ?? "") ||
          state.artworkUrl ||
          "";
        updateState(
          {
            title: sound.title || state.title,
            href: sound.permalink_url || state.href,
            artworkUrl: nextArtwork,
          },
          { persist: true },
        );
      });
    };

    const refreshDuration = () => {
      if (!widget) return;
      widget.getDuration((nextDurationMs) => {
        updateState({ durationMs: Number(nextDurationMs) || 0 }, { persist: true });
      });
    };

    const bindWidgetEvents = () => {
      if (!widget || widgetBound || !window.SC?.Widget?.Events) {
        return;
      }

      widgetBound = true;

      widget.bind(window.SC.Widget.Events.READY, () => {
        refreshFromCurrentSound();
        refreshDuration();
        widget?.getPosition((positionMs) => {
          updateState({ positionMs: Number(positionMs) || 0 }, { persist: false });
        });
        widget?.isPaused((paused) => {
          updateState({ playing: !paused, visible: true }, { persist: true });
          if (paused) {
            scheduleHide();
          }
        });
      });

      widget.bind(window.SC.Widget.Events.PLAY, () => {
        clearHideTimers();
        updateState({ playing: true, visible: true }, { persist: true });
        refreshFromCurrentSound();
        refreshDuration();
      });

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        updateState({ playing: false, visible: true }, { persist: true });
        scheduleHide();
      });

      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (event) => {
        const progressEvent = event as SoundCloudWidgetProgressEvent | undefined;
        const positionMs = Number(progressEvent?.currentPosition) || 0;
        const relativePosition = Number(progressEvent?.relativePosition) || 0;
        updateState({ positionMs, progress: relativePosition }, { persist: false });
      });

      widget.bind(window.SC.Widget.Events.SEEK, (event) => {
        const progressEvent = event as SoundCloudWidgetProgressEvent | undefined;
        const positionMs = Number(progressEvent?.currentPosition) || 0;
        const relativePosition = Number(progressEvent?.relativePosition) || 0;
        updateState({ positionMs, progress: relativePosition }, { persist: false });
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        updateState(
          {
            playing: false,
            visible: true,
            positionMs: state.durationMs,
            progress: 1,
          },
          { persist: true },
        );
        scheduleHide();
      });
    };

    const buildWidgetUrl = (sourceUrl: string, autoPlay: boolean) =>
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(sourceUrl)}&color=%235CC8FF&auto_play=${
        autoPlay ? "true" : "false"
      }&buying=false&download=false&sharing=false&show_artwork=false&show_comments=false&show_playcount=false&show_reposts=false&show_teaser=false&show_user=false&single_active=false&visual=false`;

    const loadSource = async (sourceUrl: string, { autoPlay }: { autoPlay: boolean }) => {
      const Widget = await ensureWidgetApi();

      if (!widget) {
        frame.src = buildWidgetUrl(sourceUrl, autoPlay);
        widget = Widget(frame);
        bindWidgetEvents();
        return;
      }

      widget.load(sourceUrl, {
        ...widgetOptions,
        auto_play: autoPlay,
        callback: () => {
          refreshFromCurrentSound();
          refreshDuration();
        },
      });
    };

    const playFromTrigger = async (trigger: HTMLElement) => {
      const sourceUrl = trigger.dataset.scSource ?? "";
      if (!sourceUrl) {
        return;
      }

      const nextMeta = {
        sourceUrl,
        title: trigger.dataset.scTitle ?? "Selected Track",
        artworkUrl: trigger.dataset.scArtwork ?? "",
        href: trigger.dataset.scHref ?? "",
        visible: true,
      };

      if (state.sourceUrl === sourceUrl) {
        try {
          clearHideTimers();
          if (widget) {
            if (state.playing) {
              widget.pause();
            } else {
              widget.play();
            }
          } else {
            await loadSource(sourceUrl, { autoPlay: !state.playing });
          }
          updateState({ ...nextMeta, playing: !state.playing }, { persist: true });
        } catch (error) {
          console.error("[soundcloud] unable to toggle widget playback", error);
        }
        return;
      }

      updateState(
        {
          ...nextMeta,
          playing: true,
          durationMs: 0,
          positionMs: 0,
          progress: 0,
        },
        { persist: true },
      );

      try {
        clearHideTimers();
        await loadSource(sourceUrl, { autoPlay: true });
      } catch (error) {
        console.error("[soundcloud] unable to load widget source", error);
      }
    };

    const togglePlayback = async () => {
      if (!state.sourceUrl) {
        return;
      }

      try {
        clearHideTimers();
        if (!widget) {
          await loadSource(state.sourceUrl, { autoPlay: !state.playing });
          updateState({ playing: !state.playing, visible: true }, { persist: true });
          return;
        }

        if (state.playing) {
          widget.pause();
        } else {
          widget.play();
        }
        updateState({ playing: !state.playing, visible: true }, { persist: true });
      } catch (error) {
        console.error("[soundcloud] unable to toggle widget playback", error);
      }
    };

    const seekToProgress = (event: MouseEvent) => {
      if (!widget || !state.durationMs) {
        return;
      }

      const rect = progress.getBoundingClientRect();
      if (!rect.width) {
        return;
      }

      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const positionMs = Math.round(state.durationMs * ratio);
      widget.seekTo(positionMs);
      updateState({ positionMs, progress: ratio }, { persist: false });
    };

    const handleToggleClick = () => {
      void togglePlayback();
    };

    const handleProgressClick = (event: MouseEvent) => {
      seekToProgress(event);
    };

    const handleProgressKeydown = (event: KeyboardEvent) => {
      if (!state.durationMs || !widget) {
        return;
      }

      const stepMs = 5000;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const positionMs = Math.max(0, state.positionMs - stepMs);
        widget.seekTo(positionMs);
        updateState({ positionMs, progress: positionMs / state.durationMs }, { persist: false });
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const positionMs = Math.min(state.durationMs, state.positionMs + stepMs);
        widget.seekTo(positionMs);
        updateState({ positionMs, progress: positionMs / state.durationMs }, { persist: false });
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const trigger = target.closest("[data-sc-source]");
      if (!(trigger instanceof HTMLElement)) {
        return;
      }

      void playFromTrigger(trigger);
    };

    const sync = () => {
      renderState({ persist: false });
      if (state.visible && !state.playing) {
        scheduleHide();
      }
    };

    const handlePageLoad = () => {
      sync();
    };

    toggle.addEventListener("click", handleToggleClick);
    progress.addEventListener("click", handleProgressClick);
    progress.addEventListener("keydown", handleProgressKeydown);
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("system174:page-load", handlePageLoad);

    window.__system174SoundCloudPlayer = { sync };
    sync();

    return () => {
      clearHideTimers();
      toggle.removeEventListener("click", handleToggleClick);
      progress.removeEventListener("click", handleProgressClick);
      progress.removeEventListener("keydown", handleProgressKeydown);
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("system174:page-load", handlePageLoad);
      delete window.__system174SoundCloudPlayer;
    };
  }, []);

  return (
    <div
      id="persistent-soundcloud-player"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] hidden px-3 pb-3 sm:px-5 sm:pb-4"
      data-sc-footer-player
    >
      <section
        id="persistent-soundcloud-player-shell"
        className="pointer-events-auto mx-auto max-w-6xl translate-y-3 overflow-hidden rounded-xl border border-[#5CC8FF]/20 bg-[#0E1218]/95 opacity-0 shadow-[0_-16px_60px_rgba(0,0,0,0.45)] backdrop-blur transition duration-300 ease-out"
      >
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#1A2230] sm:h-14 sm:w-14">
            <img
              id="persistent-soundcloud-player-artwork"
              src={fallbackArtworkUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 sm:w-[240px] sm:shrink-0">
            <p className="label-ui">Now Playing</p>
            <p
              id="persistent-soundcloud-player-title"
              className="mt-1 truncate font-display text-sm uppercase tracking-[0.1em] text-[#E7EDF6] sm:text-base"
            >
              Select a track
            </p>
            <a
              id="persistent-soundcloud-player-link"
              href="#"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-[10px] font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:text-white"
            >
              Open on SoundCloud
            </a>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <button
              type="button"
              id="persistent-soundcloud-player-toggle"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#5CC8FF]/45 bg-[#5CC8FF]/10 text-[#E7EDF6] transition duration-150 ease-out hover:border-[#5CC8FF]/70 hover:bg-[#5CC8FF]/20"
              aria-label="Pause current track"
            >
              <span id="persistent-soundcloud-player-toggle-icon" aria-hidden="true">
                ❚❚
              </span>
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <p
                id="persistent-soundcloud-player-elapsed"
                className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#91A0B7]"
              >
                00:00:00
              </p>
              <div
                id="persistent-soundcloud-player-progress"
                className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
                role="slider"
                tabIndex={0}
                aria-label="Track progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={0}
              >
                <div
                  id="persistent-soundcloud-player-progress-fill"
                  className="h-full w-0 rounded-full bg-[#5CC8FF] transition-[width] duration-150 ease-out"
                />
              </div>
              <p
                id="persistent-soundcloud-player-duration"
                className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#91A0B7]"
              >
                00:00:00
              </p>
            </div>
          </div>
        </div>

        <iframe
          id="persistent-soundcloud-player-frame"
          title="Persistent SoundCloud Player"
          src="about:blank"
          loading="lazy"
          allow="autoplay"
          className="pointer-events-none fixed bottom-0 right-0 h-0 w-0 border-0 opacity-0"
        />
      </section>
    </div>
  );
}
