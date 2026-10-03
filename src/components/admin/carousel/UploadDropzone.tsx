import React, { useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import { uploadCarouselImages } from '../../../services/carouselService';
import { CarouselSlide } from '../../../types/carousel';

interface UploadDropzoneProps {
  onUploaded: (newSlides: Partial<CarouselSlide>[]) => void;
  nextOrder: number;
}

interface UploadProgressItem {
  name: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUploaded, nextOrder }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressItems, setProgressItems] = useState<UploadProgressItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const initialProgress: UploadProgressItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validation: Type & Size (10MB max)
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;

      if (!isImage) {
        initialProgress.push({
          name: file.name,
          progress: 0,
          status: 'error',
          error: 'Only image files (JPG, PNG, WebP) are allowed.',
        });
      } else if (!isValidSize) {
        initialProgress.push({
          name: file.name,
          progress: 0,
          status: 'error',
          error: 'File exceeds maximum 10 MB limit.',
        });
      } else {
        validFiles.push(file);
        initialProgress.push({
          name: file.name,
          progress: 0,
          status: 'compressing',
        });
      }
    }

    setProgressItems(initialProgress);
    if (validFiles.length === 0) return;

    setUploading(true);
    const completedSlides: Partial<CarouselSlide>[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Strip extension for default caption

      try {
        const uploaded = await uploadCarouselImages(file, (pct: number) => {
          setProgressItems((prev) =>
            prev.map((item) =>
              item.name === file.name
                ? {
                    ...item,
                    progress: pct,
                    status: pct >= 100 ? 'complete' : 'uploading',
                  }
                : item
            )
          );
        });

        completedSlides.push({
          imageUrlDesktop: uploaded.imageUrlDesktop,
          imageUrlMobile: uploaded.imageUrlMobile,
          thumbnailUrl: uploaded.thumbnailUrl,
          storagePath: uploaded.storagePath,
          caption: fileName.charAt(0).toUpperCase() + fileName.slice(1).replace(/[-_]/g, ' '),
          altText: `Luxury travel destination: ${fileName.replace(/[-_]/g, ' ')}`,
          focalX: 50,
          focalY: 50,
          order: nextOrder + i,
          active: true,
        });
      } catch (err: any) {
        setProgressItems((prev) =>
          prev.map((item) =>
            item.name === file.name
              ? {
                  ...item,
                  status: 'error',
                  error: err?.message || 'Upload failed',
                }
              : item
          )
        );
      }
    }

    setUploading(false);
    if (completedSlides.length > 0) {
      onUploaded(completedSlides);
      setTimeout(() => {
        setProgressItems([]);
      }, 3000);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 hover:border-sky-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              Drag & Drop travel photos here, or <span className="text-sky-600 dark:text-sky-400 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports multiple JPG, PNG, WebP up to 10 MB. Automatically converts & resizes to 1920px Desktop and 800px Mobile WebP.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress Items */}
      {progressItems.length > 0 && (
        <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Processing & Uploading Images:</p>
          {progressItems.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  {item.name}
                </span>
                <span className="text-[11px] font-bold">
                  {item.status === 'compressing' && <span className="text-amber-500">Compressing WebP...</span>}
                  {item.status === 'uploading' && <span className="text-sky-600 dark:text-sky-400">{item.progress}%</span>}
                  {item.status === 'complete' && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {item.error}
                    </span>
                  )}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    item.status === 'error'
                      ? 'bg-red-500'
                      : item.status === 'complete'
                      ? 'bg-emerald-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
