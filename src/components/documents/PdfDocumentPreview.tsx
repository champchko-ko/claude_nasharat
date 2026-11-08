"use client";

import { useEffect, useRef, useState } from "react";
import { FileWarningIcon, LoaderCircleIcon } from "lucide-react";

type PdfPage = { getViewport: (options: { scale: number }) => { width: number; height: number }; render: (options: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } };

export function PdfDocumentPreview({ fileUrl, title }: { fileUrl: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let loadingTask:
      | { promise: Promise<{ numPages: number; getPage: (pageNumber: number) => Promise<unknown> }>; destroy?: () => Promise<void> }
      | undefined;

    async function renderPdf() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        loadingTask = pdfjs.getDocument({ url: fileUrl, withCredentials: true });
        const pdf = await loadingTask.promise;
        if (cancelled || !containerRef.current) return;

        const container = containerRef.current;
        container.replaceChildren();
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = (await pdf.getPage(pageNumber)) as PdfPage;
          const unscaled = page.getViewport({ scale: 1 });
          const scale = Math.min(1.5, Math.max(0.7, (container.clientWidth - 24) / unscaled.width));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.className = "block h-auto w-full rounded-md bg-white shadow-sm";
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          container.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (cancelled) return;
        }
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void renderPdf();
    return () => {
      cancelled = true;
      void loadingTask?.destroy?.();
    };
  }, [fileUrl]);

  if (state === "error") {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <FileWarningIcon className="size-10 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Unable to render this PDF here.</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Open PDF
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl">
      {state === "loading" ? (
        <div className="flex min-h-64 items-center justify-center">
          <LoaderCircleIcon className="size-8 animate-spin text-primary" aria-label={`Loading ${title}`} />
        </div>
      ) : null}
      <div ref={containerRef} className="flex w-full flex-col gap-3" aria-label={title} />
    </div>
  );
}
