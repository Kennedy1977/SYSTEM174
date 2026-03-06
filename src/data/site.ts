export const ACCENT = "#5CC8FF";

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/music", label: "Music" },
  { href: "/playlists", label: "Playlists" },

  { href: "/contact", label: "Contact" },
];

export const homepageSelectedTracks = [
  {
    title: "Chasing Shadows",
    href: "/playlists?genre=Drum+%26+Bass&playlist=2199354848",
    soundcloudUrl: "https://soundcloud.com/",
    artworkUrl: "",
    genre: "Drum & Bass",
  },
  {
    title: "Track Two",
    href: "https://soundcloud.com/",
    soundcloudUrl: "https://soundcloud.com/",
    artworkUrl: "",
    genre: "",
  },
  {
    title: "Track Three",
    href: "https://soundcloud.com/",
    soundcloudUrl: "https://soundcloud.com/",
    artworkUrl: "",
    genre: "",
  },
  {
    title: "Track Four",
    href: "https://soundcloud.com/",
    soundcloudUrl: "https://soundcloud.com/",
    artworkUrl: "",
    genre: "",
  },
];

export const releases = [
  { title: "Fault Line", type: "EP", year: "2026", cover: "", links: ["Spotify", "Bandcamp", "SC"] },
  { title: "Pressure Archive 01", type: "Mixes", year: "2026", cover: "", links: ["SoundCloud", "Apple"] },
  { title: "Carbon Night", type: "Singles", year: "2025", cover: "", links: ["Spotify", "YT"] },
  { title: "Subgrade Relay", type: "Remixes", year: "2025", cover: "", links: ["Spotify", "SC"] },
  { title: "Signal Basement", type: "Singles", year: "2024", cover: "", links: ["Spotify", "Bandcamp"] },
  { title: "Hardened Loop", type: "EP", year: "2024", cover: "", links: ["Spotify", "Apple"] },
  { title: "Unit 174", type: "Mixes", year: "2023", cover: "", links: ["SoundCloud", "Mixcloud"] },
  { title: "Steel Current", type: "Remixes", year: "2023", cover: "", links: ["Spotify", "YT"] },
];

export const upcomingShows = [
  { date: "14 MAR", city: "Berlin", venue: "Rasterwerk", status: "LOW_TICKETS" as const, cta: "Tickets" },
  { date: "28 MAR", city: "London", venue: "Concrete Unit", status: "SOLD_OUT" as const, cta: "Sold" },
  { date: "10 APR", city: "Warsaw", venue: "Substation", status: "NEW" as const, cta: "Tickets" },
  { date: "24 APR", city: "Prague", venue: "Canal Hall", status: "NONE" as const, cta: "Tickets" },
];

export const pastShows = [
  { date: "12 JAN", city: "Leipzig", venue: "Engine Room", status: "NONE" as const, cta: "Archive" },
  { date: "19 DEC", city: "Amsterdam", venue: "Dockline", status: "NONE" as const, cta: "Archive" },
  { date: "07 NOV", city: "Milan", venue: "Vault Sector", status: "NONE" as const, cta: "Archive" },
];

export const mediaDownloads = [
  { title: "Press Photos Pack", description: "12 high-res images, monochrome + color", action: "Download ZIP" },
  { title: "Logos", description: "SVG + PNG lockups for promoters", action: "Download Pack" },
  { title: "Short Bio", description: "80-word promoter version", action: "Download TXT" },
  { title: "Full Bio", description: "Press-ready long format", action: "Download DOC" },
  { title: "Tech Rider", description: "Stage + monitor requirements", action: "Download PDF" },
];

export const socials = [
  { label: "Instagram", href: "#" },
  { label: "SoundCloud", href: "#" },
  { label: "Bandcamp", href: "#" },
  { label: "YouTube", href: "#" },
];
