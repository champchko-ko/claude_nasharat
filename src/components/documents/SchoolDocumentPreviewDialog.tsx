"use client";

import { useState } from "react";
import { FileTextIcon, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchoolDocumentPreviewContent } from "./SchoolDocumentPreviewContent";
import { SchoolDocumentPreviewActions } from "./SchoolDocumentPreviewActions";
import type { SchoolDocumentRow } from "@/lib/documents/types";

export function SchoolDocumentPreviewDialog({
  isOpen,
  onClose,
  documents,
  categoryTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  documents: SchoolDocumentRow[];
  categoryTitle: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isOpen) return null;

  const currentDoc = documents[selectedIndex] || documents[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-w-4xl flex-col overflow-hidden p-0 sm:max-h-[92vh]"
      >
        <DialogHeader className="border-b border-border/80 bg-muted/30 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-base font-bold text-foreground sm:text-lg">
                {categoryTitle}
              </DialogTitle>
              {currentDoc ? (
                <p className="mt-0.5 max-w-lg truncate text-xs text-muted-foreground">
                  {currentDoc.title} {currentDoc.description ? `— ${currentDoc.description}` : ""}
                </p>
              ) : null}
            </div>

            <SchoolDocumentPreviewActions currentDoc={currentDoc} onClose={onClose} />
          </div>

          {documents.length > 1 ? (
            <div className="mt-3 flex scrollbar-none gap-2 overflow-x-auto pb-1">
              {documents.map((doc, idx) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    selectedIndex === idx
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {doc.mime_type?.startsWith("image/") ? (
                    <ImageIcon className="size-3" />
                  ) : (
                    <FileTextIcon className="size-3" />
                  )}
                  <span className="max-w-[140px] truncate">{doc.title}</span>
                </button>
              ))}
            </div>
          ) : null}
        </DialogHeader>

        <div className="flex min-h-[350px] flex-1 flex-col items-center justify-center overflow-y-auto bg-background p-4 sm:p-6">
          <SchoolDocumentPreviewContent currentDoc={currentDoc} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
