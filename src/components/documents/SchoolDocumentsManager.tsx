"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolDocumentsManagerHeader } from "./SchoolDocumentsManagerHeader";
import { SchoolDocumentsEmptyState } from "./SchoolDocumentsEmptyState";
import { SchoolDocumentRowCard } from "./SchoolDocumentRowCard";
import { SchoolDocumentFormDialog } from "./SchoolDocumentFormDialog";
import { SchoolDocumentDeleteDialog } from "./SchoolDocumentDeleteDialog";
import { SchoolDocumentPreviewDialog } from "./SchoolDocumentPreviewDialog";
import type { SchoolDocumentRow, SchoolDocumentSlug } from "@/lib/documents/types";

export function SchoolDocumentsManager({
  slug,
  title,
  description,
  documents,
}: {
  slug: SchoolDocumentSlug;
  title: string;
  description: string;
  documents: SchoolDocumentRow[];
}) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SchoolDocumentRow | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<SchoolDocumentRow | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<SchoolDocumentRow | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <SchoolDocumentsManagerHeader
        slug={slug}
        title={title}
        description={description}
        onAdd={() => setIsAddOpen(true)}
      />

      {documents.length === 0 ? (
        <SchoolDocumentsEmptyState description={description} onAdd={() => setIsAddOpen(true)} />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <SchoolDocumentRowCard
              key={doc.id}
              document={doc}
              onPreview={() => setPreviewingDoc(doc)}
              onEdit={() => setEditingDoc(doc)}
              onDelete={() => setDeletingDoc(doc)}
            />
          ))}
        </div>
      )}

      <SchoolDocumentFormDialog
        key={editingDoc?.id || (isAddOpen ? "new" : "closed")}
        isOpen={isAddOpen || Boolean(editingDoc)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingDoc(null);
        }}
        slug={slug}
        existingDoc={editingDoc}
        onSuccess={handleRefresh}
      />

      {deletingDoc ? (
        <SchoolDocumentDeleteDialog
          isOpen={Boolean(deletingDoc)}
          onClose={() => setDeletingDoc(null)}
          documentId={deletingDoc.id}
          documentTitle={deletingDoc.title}
          onSuccess={handleRefresh}
        />
      ) : null}

      {previewingDoc ? (
        <SchoolDocumentPreviewDialog
          isOpen={Boolean(previewingDoc)}
          onClose={() => setPreviewingDoc(null)}
          documents={[previewingDoc]}
          categoryTitle={title}
        />
      ) : null}
    </div>
  );
}
