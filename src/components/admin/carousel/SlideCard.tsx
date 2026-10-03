import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';
import { CarouselSlide } from '../../../types/carousel';

interface SlideCardProps {
  slide: CarouselSlide;
  index: number;
  totalSlides: number;
  onEdit: (slide: CarouselSlide) => void;
  onToggleActive: (slide: CarouselSlide) => void;
  onDuplicate: (slide: CarouselSlide) => void;
  onDelete: (slide: CarouselSlide) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  index,
  totalSlides,
  onEdit,
  onToggleActive,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Status calculation
  const now = new Date().getTime();
  const isScheduled = slide.startDate && new Date(slide.startDate).getTime() > now;
  const isExpired = slide.endDate && new Date(slide.endDate).getTime() < now;

  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
      <CheckCircle2 className="w-3 h-3" /> Active
    </span>
  );

  if (!slide.active) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <EyeOff className="w-3 h-3" /> Inactive
      </span>
    );
  } else if (isScheduled) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
        <Calendar className="w-3 h-3" /> Scheduled
      </span>
    );
  } else if (isExpired) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
        <Clock className="w-3 h-3" /> Expired
      </span>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border transition-all shadow-xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        slide.active
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-slate-200/60 dark:border-slate-800/60 opacity-75'
      }`}
    >
      {/* Left: Reorder Handle & Thumbnail */}
      <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
        {/* Up/Down buttons for accessible reordering */}
        <div className="flex flex-col gap-1 text-slate-400">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            aria-label="Move slide up"
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono font-bold text-center">#{slide.order}</span>
          <button
            type="button"
            disabled={index === totalSlides - 1}
            onClick={() => onMoveDown(index)}
            aria-label="Move slide down"
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thumbnail with focal point dot */}
        <div className="relative w-28 sm:w-36 aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
          <img
            src={slide.thumbnailUrl || slide.imageUrlDesktop}
            alt={slide.altText}
            className="w-full h-full object-cover"
            style={{ objectPosition: `${slide.focalX}% ${slide.focalY}%` }}
          />
          {/* Focal indicator */}
          <div
            className="absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-sky-400 border border-white shadow-xs pointer-events-none"
            style={{ left: `${slide.focalX}%`, top: `${slide.focalY}%` }}
            title={`Focus: ${slide.focalX}%, ${slide.focalY}%`}
          />
        </div>

        {/* Slide Metadata */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge}
            {slide.linkUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                <LinkIcon className="w-2.5 h-2.5" /> {slide.linkUrl}
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {slide.caption || 'Untitled Slide'}
          </h4>

          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
            Alt: {slide.altText}
          </p>

          {(slide.startDate || slide.endDate) && (
            <p className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Schedule: {slide.startDate || 'Now'} → {slide.endDate || 'Ongoing'}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onToggleActive(slide)}
          title={slide.active ? 'Deactivate Slide' : 'Activate Slide'}
          className={`p-2 rounded-xl transition cursor-pointer ${
            slide.active
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100'
              : 'text-slate-400 bg-slate-100 dark:bg-slate-800 hover:text-slate-600'
          }`}
        >
          {slide.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => onDuplicate(slide)}
          title="Duplicate Slide"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onEdit(slide)}
          title="Edit Slide Details"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-xs font-bold transition cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          title="Delete Slide"
          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Carousel Slide?</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong>"{slide.caption || 'this slide'}"</strong>? Any uploaded storage images will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  onDelete(slide);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
