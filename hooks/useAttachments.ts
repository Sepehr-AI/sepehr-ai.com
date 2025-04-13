"use client";

import { useRef, useState, useMemo, type ChangeEvent } from "react";

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const useAttachments = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFileNames = useMemo(() => {
    return attachments ? Array.from(attachments).map((file) => file.name) : [];
  }, [attachments]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    setError(null);

    if (newFiles && newFiles.length > 0) {
      for (let i = 0; i < newFiles.length; i++) {
        if (newFiles[i].size > MAX_FILE_SIZE) {
          setError(
            `حجم فایل "${newFiles[i].name}" بیشتر از ${
              MAX_FILE_SIZE / 1024 / 1024
            } مگابایت است.`,
          );
          return;
        }
      }

      const currentCount = attachments?.length || 0;
      const newCount = newFiles.length;
      if (currentCount + newCount > MAX_FILE_COUNT) {
        setError(
          `تعداد فایل های مجاز برای آپلود در هر پیام ${MAX_FILE_COUNT} عدد است.`,
        );
        return;
      }

      const dt = new DataTransfer();
      if (attachments) {
        Array.from(attachments).forEach((file) => dt.items.add(file));
      }

      Array.from(newFiles).forEach((file) => dt.items.add(file));

      setAttachments(dt.files);
    }
  };

  const clearAttachments = () => {
    setAttachments(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    fileInputRef,
    attachments,
    handleFileChange,
    selectedFileNames,
    error,
    clearAttachments,
  };
};
