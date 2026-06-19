import { useState } from "react";

/**
 * Shared flip card with a real 3D flip, used by the lesson builder preview tab and the
 * learner view so both behave identically. Front = light surface + dark text; back =
 * emerald fill + white text (high contrast — replaces the old green-on-green hint that
 * was unreadable). Relies on the `.flip-*` rules in lessonContent.css.
 */
export default function FlipCard({ config = {} }) {
  const [flipped, setFlipped] = useState(false);
  const front = config.front?.trim();
  const back = config.back?.trim();

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className={`flip-card ${flipped ? "is-flipped" : ""}`}
      aria-label="Flip card"
    >
      <div className="flip-inner">
        <div className="flip-face flip-front">
          <span className="flip-hint">
            <i className="fa-solid fa-hand-pointer" /> Tap to flip
          </span>
          <span className={`flip-text ${front ? "" : "flip-empty"}`}>
            {front || "Front (question)"}
          </span>
        </div>
        <div className="flip-face flip-back">
          <span className="flip-hint">
            <i className="fa-solid fa-rotate-left" /> Answer
          </span>
          <span className={`flip-text ${back ? "" : "flip-empty"}`}>
            {back || "Back (answer)"}
          </span>
        </div>
      </div>
    </button>
  );
}
