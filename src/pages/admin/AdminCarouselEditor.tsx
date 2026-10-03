import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Edit2,
  Eye,
  GripVertical,
  Laptop,
  Layers,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  CarouselConfig,
  CarouselSlide,
  DEFAULT_CAROUSEL_CONFIG,
} from '../../types/carousel';
import {
  deleteSlide,
  duplicateSlide,
  reorderSlides,
  saveCarouselConfig,
  saveSlide,
  seedDemoCarouselSlides,
  subscribeAllSlides,
  subscribeCarouselConfig,
} from '../../services/carouselService';
import { SlideCard } from '../../components/admin/carousel/SlideCard';
import { SlideEditorModal } from '../../components/admin/carousel/SlideEditorModal';
import { UploadDropzone } from '../../components/admin/carousel/UploadDropzone';
import { CarouselGlobalSettings } from '../../components/admin/carousel/CarouselGlobalSettings';
import { CarouselRecommendations } from '../../components/admin/carousel/CarouselRecommendations';
import { HeroCarousel } from '../../components/home/HeroCarousel';

export const AdminCarouselEditor: React.FC = () => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  // Firestore Data State
  const [config, setConfig] = useState<CarouselConfig>(DEFAULT_CAROUSEL_CONFIG);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);

  // Unsaved Edits State
  const [unsavedConfig, setUnsavedConfig] = useState<CarouselConfig>(DEFAULT_CAROUSEL_CONFIG);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Active Modals & Views
  const [activeTab, setActiveTab] = useState<'slides' | 'settings' | 'upload'>('slides');
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);

  // Live Preview Settings
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark');

  // Subscriptions
  useEffect(() => {
    const unsubConfig = subscribeCarouselConfig((freshConfig) => {
      setConfig(freshConfig);
      setUnsavedConfig(freshConfig);
    });

    const unsubSlides = subscribeAllSlides((freshSlides) => {
      setSlides(freshSlides);
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubSlides();
    };
  }, []);

  // Track Unsaved Config Changes
  const handleConfigChange = (newConfig: CarouselConfig) => {
    setUnsavedConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleSaveAllConfig = async () => {
    setSavingChanges(true);
    try {
      await saveCarouselConfig(unsavedConfig, user?.email);
      setConfig(unsavedConfig);
      setHasUnsavedChanges(false);
      setSaveSuccessMsg('Carousel configuration published live.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleDiscardChanges = () => {
    setUnsavedConfig(config);
    setHasUnsavedChanges(false);
  };

  // Slide CRUD Actions
  const handleOpenEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setEditorModalOpen(true);
  };

  const handleSaveSlide = async (updated: Partial<CarouselSlide>) => {
    await saveSlide(updated, user?.email);
  };

  const handleToggleActive = async (slide: CarouselSlide) => {
    await saveSlide({ ...slide, active: !slide.active }, user?.email);
  };

  const handleDuplicate = async (slide: CarouselSlide) => {
    await duplicateSlide(slide, user?.email);
  };

  const handleDelete = async (slide: CarouselSlide) => {
    await deleteSlide(slide.id, slide.storagePath, user?.email);
  };

  // Reorder Actions
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...slides];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    setSlides(reordered);
    await reorderSlides(reordered.map((s) => s.id), user?.email);
  };

  const handleMoveDown = async (index: number) => {
    if (index === slides.length - 1) return;
    const reordered = [...slides];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    setSlides(reordered);
    await reorderSlides(reordered.map((s) => s.id), user?.email);
  };

  const handleNewUploads = async (newSlideItems: Partial<CarouselSlide>[]) => {
    for (const item of newSlideItems) {
      await saveSlide(item, user?.email);
    }
    setActiveTab('slides');
  };

  const handleSeedDemo = async () => {
    if (!window.confirm('Load 5 curated travel demo slides (Udaipur, Goa, Manali, Kerala, Jaisalmer)?')) {
      return;
    }
    setSeedingDemo(true);
    try {
      await seedDemoCarouselSlides(user?.email);
      setSaveSuccessMsg('5 travel demo slides seeded successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setSeedingDemo(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md">
              Hero Section Media
            </span>
            <span className="text-xs text-slate-400">· {slides.length} slides configured</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hero Photo Carousel Editor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage full-bleed background travel photos, focal points, transition styles, and scheduling.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={seedingDemo}
            onClick={handleSeedDemo}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Database className="w-3.5 h-3.5 text-sky-500" />
            <span>{seedingDemo ? 'Seeding...' : 'Load Demo Images'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-4 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300">
            <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
            <span>You have unsaved carousel settings. Changes are rendering in the live preview below.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={savingChanges}
              onClick={handleSaveAllConfig}
              className="flex items-center gap-1 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingChanges ? 'Publishing...' : 'Save & Publish Live'}</span>
            </button>
          </div>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ----------------------------------------------------
          LIVE INTERACTIVE HERO PREVIEW
          ---------------------------------------------------- */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-black text-white">Live Hero Carousel Preview</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              ({unsavedConfig.transitionType} · {unsavedConfig.intervalMs / 1000}s)
            </span>
          </div>

          {/* Device & Theme Toggles for Preview */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg transition ${
                  previewDevice === 'desktop' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View (16:9 Full Bleed)"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg transition ${
                  previewDevice === 'mobile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View (Portrait Frame)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPreviewTheme('light')}
                className={`p-1.5 rounded-lg transition ${
                  previewTheme === 'light' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Preview in Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme('dark')}
                className={`p-1.5 rounded-lg transition ${
                  previewTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Preview in Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* The Live Hero Viewport Container */}
        <div className="flex justify-center bg-slate-950 rounded-2xl p-2 sm:p-4 overflow-hidden border border-slate-800">
          <div
            className={`relative rounded-2xl overflow-hidden border border-slate-800 transition-all duration-300 ${
              previewDevice === 'mobile'
                ? 'w-[360px] h-[520px]'
                : 'w-full h-[400px] sm:h-[460px]'
            }`}
          >
            {/* Live Component Render */}
            <HeroCarousel
              customConfig={unsavedConfig}
              previewSlides={slides.length > 0 ? slides : undefined}
              isMobilePreview={previewDevice === 'mobile'}
            />

            {/* Simulated Hero Content Overlay */}
            <div className="relative z-30 flex flex-col justify-center items-center h-full p-6 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 bg-sky-500/20 px-2.5 py-1 rounded-full mb-3 backdrop-blur-xs border border-sky-400/30">
                Verified Stays & Packages
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white max-w-md drop-shadow-md">
                Find Your Perfect Escape
              </h2>
              <p className="text-xs text-slate-200 mt-2 max-w-sm drop-shadow-xs hidden sm:block">
                Compare luxury hotels, boutique resorts, and tour packages with best price guarantee.
              </p>

              {/* Mock Search Tab Bar */}
              <div className="mt-4 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-3 shadow-lg">
                <span className="text-sky-600 dark:text-sky-400">● Hotels</span>
                <span className="text-slate-400">· Tour Packages</span>
                <span className="text-slate-400">· Mobility</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('slides')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'slides'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Manage Slides ({slides.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Photos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Carousel Timings & Overlay</span>
        </button>
      </div>

      {/* TAB 1: SLIDES LIST & REORDERING */}
      {activeTab === 'slides' && (
        <div className="space-y-4">
          <CarouselRecommendations slides={slides} />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Carousel Slides Yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Upload high-resolution landscape travel photos or load the default 5 demo luxury slides.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSeedDemo}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                >
                  Load 5 Demo Slides
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Upload First Image
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                <span>Use arrows to change slide rotation order. Click Edit to adjust focus points.</span>
                <span className="font-semibold">{slides.filter((s) => s.active).length} Active of {slides.length}</span>
              </div>

              {slides.map((slide, index) => (
                <SlideCard
                  key={slide.id}
                  slide={slide}
                  index={index}
                  totalSlides={slides.length}
                  onEdit={handleOpenEdit}
                  onToggleActive={handleToggleActive}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOAD MULTI-IMAGES */}
      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload New Travel Photos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select one or multiple landscape photos. They will be compressed to 1920px Desktop and 800px Mobile WebP.
            </p>
          </div>

          <UploadDropzone
            nextOrder={slides.length + 1}
            onUploaded={handleNewUploads}
          />
        </div>
      )}

      {/* TAB 3: GLOBAL CAROUSEL SETTINGS */}
      {activeTab === 'settings' && (
        <CarouselGlobalSettings
          config={unsavedConfig}
          onChange={handleConfigChange}
        />
      )}

      {/* Slide Edit Modal */}
      <SlideEditorModal
        slide={editingSlide}
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        onSave={handleSaveSlide}
      />
    </div>
  );
};
