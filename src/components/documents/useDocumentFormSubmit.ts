"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createSchoolDocumentAction } from "@/actions/documents/createSchoolDocumentAction";
import { updateSchoolDocumentAction } from "@/actions/documents/updateSchoolDocumentAction";
import { resolveDocumentErrorMessage } from "@/lib/documents/resolveDocumentErrorMessage";
import type { SchoolDocumentRow, SchoolDocumentSlug } from "@/lib/documents/types";

export function useDocumentFormSubmit({
  slug,
  existingDoc,
  onSuccess,
  onClose,
}: {
  slug: SchoolDocumentSlug;
  existingDoc?: SchoolDocumentRow | null;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("documents");
  const [title, setTitle] = useState(existingDoc?.title || "");
  const [description, setDescription] = useState(existingDoc?.description || "");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage(t("titleRequired"));
      return;
    }

    if (!existingDoc && !file) {
      setErrorMessage(t("fileRequired"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    if (file) {
      formData.append("file", file);
    }

    let result;
    if (existingDoc) {
      formData.append("id", existingDoc.id);
      result = await updateSchoolDocumentAction(formData);
    } else {
      formData.append("slug", slug);
      result = await createSchoolDocumentAction(formData);
    }

    setIsSubmitting(false);

    if (result.success) {
      toast.success(existingDoc ? t("documentUpdated") : t("documentCreated"));
      onSuccess();
      onClose();
    } else {
      const friendlyError = resolveDocumentErrorMessage(result.error, t);
      setErrorMessage(friendlyError);
      toast.error(friendlyError);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    file,
    setFile,
    isSubmitting,
    errorMessage,
    handleSubmit,
  };
}
