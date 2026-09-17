/**
 * The small slice of Markdown Lucy actually writes, rendered properly.
 *
 * The chat bubble used to print the model's reply as plain text, so answers
 * arrived full of literal `**`, `#` and `|----|` — accurate, and unreadable.
 *
 * This builds React elements rather than an HTML string: there is no
 * `dangerouslySetInnerHTML` anywhere in here, so nothing the model emits can
 * become markup. It also keeps a ~50KB markdown dependency out of a bundle
 * that is already large, and Lucy's output only uses a narrow subset.
 *
 * Supported: headings, bullet and numbered lists, tables, blockquotes,
 * fenced and inline code, bold, italics, and http(s) links.
 */

const LINK = String.raw`\[[^\]]+\]\((?:[^()\s]|\([^()\s]*\))*\)`;
const INLINE = new RegExp(
  `(\\*\\*[^*]+\\*\\*|__[^_]+__|\\*[^*\\n]+\\*|\`[^\`]+\`|${LINK})`,
  "g",
);

/** Bold / italic / code / links inside a line. */
function renderInline(text, keyPrefix = "i") {
  const out = [];
  const parts = String(text).split(INLINE);

  parts.forEach((part, i) => {
    if (!part) return;
    const key = `${keyPrefix}-${i}`;

    if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
      out.push(
        <strong key={key} className="font-semibold text-brand-text">
          {part.slice(2, -2)}
        </strong>
      );
      return;
    }
    if (/^\*[^*\n]+\*$/.test(part)) {
      out.push(<em key={key}>{part.slice(1, -1)}</em>);
      return;
    }
    if (/^`[^`]+`$/.test(part)) {
      out.push(
        <code key={key} className="rounded bg-canvas px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
      return;
    }
    const link = part.match(new RegExp(`^\\[([^\\]]+)\\]\\(((?:[^()\\s]|\\([^()\\s]*\\))*)\\)$`));
    if (link) {
      const href = link[2];
      // Only ever linkify http(s). A javascript: or data: href never renders.
      if (/^https?:\/\//i.test(href)) {
        out.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald underline underline-offset-2"
          >
            {link[1]}
          </a>
        );
      } else {
        out.push(<span key={key}>{link[1]}</span>);
      }
      return;
    }
    out.push(<span key={key}>{part}</span>);
  });

  return out;
}

const ORDERED = /^\s*\d+[.)]\s+/;
const BULLET = /^\s*[-*•]\s+/;

/** Index of the next non-blank line at or after `i`. */
function skipBlanks(lines, i) {
  let j = i;
  while (j < lines.length && !lines[j].trim()) j += 1;
  return j;
}

/**
 * Is the list still going? Models leave a blank line between items, which
 * naively ends the list and restarts numbering at 1 on the next item.
 */
function continuesList(lines, i, pattern) {
  const j = skipBlanks(lines, i);
  return j < lines.length && pattern.test(lines[j]);
}

const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
const isDivider = (line) => /^\s*\|?[\s:-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes("-");
const splitRow = (line) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export default function ChatMarkdown({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (/^\s*```/.test(line)) {
      const body = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre
          key={key++}
          className="my-1.5 overflow-x-auto rounded-lg bg-canvas px-3 py-2 font-mono text-[0.8em] leading-relaxed"
        >
          {body.join("\n")}
        </pre>
      );
      continue;
    }

    // Table — a header row, a |---| divider, then body rows.
    if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={key++} className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-[0.9em]">
            <thead>
              <tr>
                {header.map((h, hi) => (
                  <th
                    key={hi}
                    className="border-b border-brand-border px-2 py-1.5 text-left font-semibold text-brand-text"
                  >
                    {renderInline(h, `th-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border-b border-brand-border/50 px-2 py-1.5 align-top">
                      {renderInline(c, `td-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Heading
    const heading = line.match(/^\s*(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        <p
          key={key++}
          className={`mt-2 mb-1 font-semibold text-brand-text ${level <= 2 ? "text-[1.02em]" : ""}`}
        >
          {renderInline(heading[2], `h-${key}`)}
        </p>
      );
      i += 1;
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const body = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-1.5 border-l-2 border-emerald/40 pl-3 text-brand-muted"
        >
          {renderInline(body.join(" "), `q-${key}`)}
        </blockquote>
      );
      continue;
    }

    // Numbered list
    if (ORDERED.test(line)) {
      const items = [];
      while (continuesList(lines, i, ORDERED)) {
        i = skipBlanks(lines, i);
        let item = lines[i].replace(/^\s*\d+[.)]\s+/, "");
        i += 1;
        // Continuation lines (the model indents sub-detail under a step).
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])) {
          item += ` ${lines[i].trim().replace(/^[-–—•]\s*/, "")}`;
          i += 1;
        }
        items.push(item);
      }
      blocks.push(
        <ol key={key++} className="my-1.5 list-decimal space-y-1 pl-5">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `ol-${ii}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list
    if (BULLET.test(line)) {
      const items = [];
      while (continuesList(lines, i, BULLET)) {
        i = skipBlanks(lines, i);
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key++} className="my-1.5 list-disc space-y-1 pl-5">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `ul-${ii}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Paragraph — gather until a blank line or the start of another block.
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(#{1,4}\s|[-*•]\s|\d+[.)]\s|>|```)/.test(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    if (para.length) {
      blocks.push(
        <p key={key++} className="my-1 first:mt-0 last:mb-0">
          {renderInline(para.join(" "), `p-${key}`)}
        </p>
      );
    }
  }

  return <div className="chat-markdown">{blocks}</div>;
}
