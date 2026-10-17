/**
 * The original message with numbered inline highlights.
 * Only findings with a real span are drawn; service findings sit in link cards.
 */

import type { Finding } from '../../core/types';

export default function Highlighted({
  text,
  findings,
  activeId,
  onSelect,
}: {
  text: string;
  findings: Finding[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const spans = findings
    .filter((f) => f.start >= 0 && f.end > f.start)
    .sort((a, b) => a.start - b.start);

  const parts: Array<{ text: string; finding?: Finding; index?: number }> = [];
  let cursor = 0;

  spans.forEach((finding, i) => {
    if (finding.start < cursor) return; // already covered by an earlier span
    if (finding.start > cursor) parts.push({ text: text.slice(cursor, finding.start) });
    parts.push({ text: text.slice(finding.start, finding.end), finding, index: i + 1 });
    cursor = finding.end;
  });
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });

  return (
    <p className="whitespace-pre-wrap text-[1.05rem] leading-[1.7]">
      {parts.map((part, i) =>
        part.finding ? (
          <mark
            key={i}
            onClick={() => onSelect?.(part.finding!.id)}
            className={`cursor-pointer rounded-[4px] px-1 py-0.5 transition-colors ${
              activeId === part.finding.id
                ? 'bg-ink text-white'
                : 'bg-[rgba(47,59,245,0.18)] text-ink'
            }`}
          >
            {part.text}
            <sup className="ml-0.5 text-[0.62em] font-semibold">{part.index}</sup>
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  );
}
