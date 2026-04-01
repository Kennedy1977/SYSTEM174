export {};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    system174ConsentManager?: {
      cookieName: string;
      cookieMaxAge: number;
      getState: () => {
        hasDecision: boolean;
        analytics: boolean;
        updatedAt: string | null;
      };
      setAnalyticsConsent: (analyticsGranted: boolean) => void;
      openSettings: () => void;
      trackPageView: () => void;
    };
    __system174LastTrackedPage?: string;
    __system174AnalyticsInitialized?: boolean;
    __system174SoundCloudPlayer?: {
      sync: () => void;
    };
    SC?: {
      Widget?: {
        (iframe: HTMLIFrameElement): SoundCloudWidgetInstance;
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
          PLAY_PROGRESS: string;
          SEEK: string;
          FINISH: string;
        };
      };
    };
  }

  interface SoundCloudWidgetSound {
    title?: string;
    permalink_url?: string;
    artwork_url?: string | null;
    user?: {
      avatar_url?: string | null;
    };
  }

  interface SoundCloudWidgetProgressEvent {
    currentPosition?: number;
    relativePosition?: number;
  }

  interface SoundCloudWidgetInstance {
    bind: (eventName: string, handler: (...args: unknown[]) => void) => void;
    load: (
      sourceUrl: string,
      options: {
        auto_play?: boolean;
        buying?: boolean;
        color?: string;
        download?: boolean;
        sharing?: boolean;
        show_artwork?: boolean;
        show_comments?: boolean;
        show_playcount?: boolean;
        show_reposts?: boolean;
        show_teaser?: boolean;
        show_user?: boolean;
        single_active?: boolean;
        visual?: boolean;
        callback?: () => void;
      },
    ) => void;
    play: () => void;
    pause: () => void;
    seekTo: (positionMs: number) => void;
    getCurrentSound: (callback: (sound: SoundCloudWidgetSound | null) => void) => void;
    getDuration: (callback: (durationMs: number) => void) => void;
    getPosition: (callback: (positionMs: number) => void) => void;
    isPaused: (callback: (paused: boolean) => void) => void;
  }
}
