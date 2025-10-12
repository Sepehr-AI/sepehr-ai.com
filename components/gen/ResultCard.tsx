"use client";

type Props = {
  kind: "image" | "video";
  url: string;
  resetLabel: string;
  onReset: () => void;
  downloadLabel: string;
};

export default function ResultCard({
  kind,
  url,
  onReset,
  downloadLabel,
  resetLabel,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-background p-3">
        {kind === "video" ? (
          <video
            className="w-full rounded-md border border-border bg-black"
            controls
            src={url}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="generated"
            className="w-full rounded-md border border-border"
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <a
          href={url}
          download
          className="px-3 py-1.5 rounded-md text-sm bg-muted/60 hover:bg-muted/80"
        >
          {downloadLabel}
        </a>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-md text-sm bg-accent text-white hover:bg-accent/90 flex items-center gap-1"
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
