export function getSoundCloudPlayerUrl(url: string, autoplay = true) {
  const autoPlayValue = autoplay ? "true" : "false";
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%235CC8FF&auto_play=${autoPlayValue}&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=false`;
}
