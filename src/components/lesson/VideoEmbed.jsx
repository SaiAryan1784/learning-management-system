import { useState } from "react";

/**
 * YouTube embed with a click-to-play facade.
 *
 * A bare <iframe> renders YouTube's unstarted poster: channel avatar, video title,
 * channel name, the red play button and a "Watch on YouTube" pill — none of which can
 * be styled or turned off (`modestbranding` is deprecated, `showinfo` was removed in
 * 2018). Rendering our own thumbnail and play button replaces that whole state, so the
 * lesson shows brand chrome until the learner actually starts the video.
 *
 * It also means the ~1MB YouTube player bundle only loads if the video is played.
 *
 * LIMIT: once playing, YouTube's own logo sits in the control bar and pausing shows a
 * "Watch on YouTube" link. Those are required by YouTube's terms and cannot be removed
 * from an embed — only self-hosting the video file avoids them entirely.
 */

/** Pulls the 11-char video id out of watch / youtu.be / embed / shorts URLs. */
export function youtubeId(url) {
  if (!url) return "";
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/embed\/([\w-]{11})/,
    /\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = re.exec(url);
    if (m) return m[1];
  }
  return "";
}

export function youtubeEmbed(url) {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
}

export default function VideoEmbed({ url, height = 320, title = "Lesson video", className = "" }) {
  const [playing, setPlaying] = useState(false);
  // maxres does not exist for every upload; hq always does.
  const [thumb, setThumb] = useState("max");
  const id = youtubeId(url);

  if (!id) return null;

  const thumbUrl =
    thumb === "max"
      ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
      : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return (
    <div
      className={`mx-auto rounded-xl border border-brand-border bg-black overflow-hidden ${className}`}
      style={{ aspectRatio: "16 / 9", width: Math.round((height * 16) / 9), maxWidth: "100%" }}
    >
      {playing ? (
        <iframe
          className="block w-full h-full border-0"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title}`}
          className="group relative block w-full h-full cursor-pointer"
        >
          <img
            src={thumbUrl}
            alt=""
            onError={() => setThumb("hq")}
            className="block w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 rounded-full bg-emerald text-white flex items-center justify-center shadow-elevated transition-transform group-hover:scale-110">
              {/* Nudged right so the triangle reads as centred inside the circle. */}
              <i className="fa-solid fa-play text-xl ml-1" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
