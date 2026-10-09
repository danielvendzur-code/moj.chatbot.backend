import type { ReactNode } from "react";

function emphasis(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+(?:\*\*|$))/g)
    .map((part, index) =>
      part.startsWith("**") ? (
        <strong key={index}>{part.replace(/^\*\*|\*\*$/g, "")}</strong>
      ) : (
        part
      ),
    );
}

/** Render plain text safely, including paragraphs and the assistant's short lists. */
export function MessageText({ text }: { text: string }): JSX.Element {
  return (
    <div className="cw-message-text">
      {text.split(/\n\s*\n/).map((block, index) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*(?:[-•]|\d+[.)])\s+/.test(line))) {
          const ordered = /^\s*\d/.test(lines[0]);
          const List = ordered ? "ol" : "ul";
          return (
            <List key={index}>
              {lines.map((line, item) => (
                <li key={item}>
                  {emphasis(line.replace(/^\s*(?:[-•]|\d+[.)])\s+/, ""))}
                </li>
              ))}
            </List>
          );
        }
        return <p key={index}>{emphasis(block)}</p>;
      })}
    </div>
  );
}
