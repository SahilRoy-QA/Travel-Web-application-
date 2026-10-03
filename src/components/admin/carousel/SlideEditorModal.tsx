import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Calendar,
  Check,
  HelpCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import {
  CarouselSlide,
  slideFormSchema,
  SlideFormData,
} from '../../../types/carousel';
import { FocalPointPicker } from './FocalPointPicker';
import { uploadCarouselImages } from '../../../services/carouselService';

interface SlideEditorModalProps {
  slide: CarouselSlide | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<CarouselSlide>) => Promise<void>;
}

export const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  slide,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !slide) return null;

  const [saving, setSaving] = useState(false);
  const [replacingImage, setReplacingImage] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null);
  const [currentSlideData, setCurrentSlideData] = useState<CarouselSlide>(slide);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SlideFormData>({
    resolver: zodResolver(slideFormSchema) as any,
    defaultValues: {
      altText: slide.altText || '',
      caption: slide.caption || '',
      linkUrl: slide.linkUrl || '',
      active: slide.active ?? true,
      focalX: slide.focalX ?? 50,
      focalY: slide.focalY ?? 50,
      startDate: slide.startDate ? slide.startDate.split('T')[0] : '',
      endDate: slide.endDate ? slide.endDate.split('T')[0] : '',
    },
  });

  const focalX = watch('focalX');
  const focalY = watch('focalY');

  const handleFocalChange = (x: number, y: number) => {
    setValue('focalX', x);
    setValue('focalY', y);
  };

  const handleReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReplacingImage(true);
    setReplaceProgress(10);
    try {
      const uploaded = await uploadCarouselImages(file, (pct: number) => setReplaceProgress(pct));
      setCurrentSlideData((prev: CarouselSlide) => ({
        ...prev,
        imageUrlDesktop: uploaded.imageUrlDesktop,
        imageUrlMobile: uploaded.imageUrlMobile,
        thumbnailUrl: uploaded.thumbnailUrl,
        storagePath: uploaded.storagePath,
      }));
      setReplaceProgress(null);
    } catch (err) {
      console.error('Image replace error:', err);
      alert('Failed to process image. Please try another file.');
    } finally {
      setReplacingImage(false);
    }
  };

  const onSubmit = async (data: SlideFormData) => {
    setSaving(true);
    try {
      await onSave({
        ...currentSlideData,
        altText: data.altText,
        caption: data.caption,
        linkUrl: data.linkUrl || '',
        active: data.active,
        focalX: data.focalX,
        focalY: data.focalY,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      });
      onClose();
    } catch (err) {
      console.error('Error saving slide:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Carousel Slide</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize caption, focal position, link, and scheduling.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Replace Image Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <img
              src={currentSlideData.thumbnailUrl || currentSlideData.imageUrlDesktop}
              alt="Thumbnail"
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Current Slide Media</p>
              <p className="text-[10px] text-slate-400">WebP 1920px (Desktop) & 800px (Mobile)</p>
            </div>
          </div>

          <div>
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleReplaceImage}
              className="hidden"
            />
            <button
              type="button"
              disabled={replacingImage}
              onClick={() => replaceInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-650 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${replacingImage ? 'animate-spin' : ''}`} />
              <span>{replacingImage ? `Uploading ${replaceProgress || ''}%` : 'Replace Photo'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Focal Point Picker */}
          <FocalPointPicker
            imageUrl={currentSlideData.imageUrlDesktop}
            focalX={focalX}
            focalY={focalY}
            onChange={handleFocalChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Caption */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Caption (Place Name)
              </label>
              <input
                type="text"
                {...register('caption')}
                placeholder="e.g. Udaipur, Rajasthan"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              {errors.caption && (
                <p className="text-[11px] text-red-500 mt-1">{errors.caption.message}</p>
              )}
            </div>

            {/* Destination Link */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link URL (Optional Destination Target)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  {...register('linkUrl')}
                  placeholder="/hotels or https://..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {errors.linkUrl && (
                <p className="text-[11px] text-red-500 mt-1">{errors.linkUrl.message}</p>
              )}
            </div>

            {/* Alt Text (Required) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Image Alt Text</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Required for SEO & Accessibility</span>
              </div>
              <input
                type="text"
                {...register('altText')}
                placeholder="Describe the photo clearly for screen readers and search crawlers"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Tip: Include the resort type and distinctive scenery (e.g. "Majestic marble palace resort overlooking lake at sunset").
              </p>
              {errors.altText && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.altText.message}
                </p>
              )}
            </div>

            {/* Scheduling: Start and End Dates */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Publish Start Date (Optional)</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Publish End Date (Optional)</span>
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Active in Carousel</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Slide will be eligible to rotate in customer hero section.
                </p>
              </div>
              <input
                type="checkbox"
                {...register('active')}
                className="w-4 h-4 accent-sky-600 rounded-md cursor-pointer"
              />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Changes...' : 'Save Slide'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
