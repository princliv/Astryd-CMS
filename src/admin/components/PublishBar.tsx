import { useLayoutEffect, useRef, useState } from 'react';
import { PreviewModal } from './PreviewModal';
import { useDraftSave, draftPreviewUrl } from '../context/DraftSaveContext';
import { useRestaurant } from '../../context/RestaurantContext';
import type { AutoSaveStatus } from '../hooks/useAutoSave';

interface PublishBarProps {
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  lastPublishedAt?: string | null;
  previewUrl?: string;
  autoSaveStatus?: AutoSaveStatus;
}

export function PublishBar({
  isDirty,
  isSaving,
  isPublishing,
  onSaveDraft,
  onPublish,
  lastPublishedAt,
  previewUrl,
  autoSaveStatus = 'idle',
}: PublishBarProps) {
  const { restaurantId } = useRestaurant();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState(previewUrl ?? draftPreviewUrl(restaurantId));
  const [isPreviewing, setIsPreviewing] = useState(false);
  const { flushDraft } = useDraftSave();
  const barRef = useRef<HTMLDivElement>(null);

  // Tell the page's sticky title block (StickyHeader) to pin just below this bar rather than under it.
  useLayoutEffect(() => {
    const bar = barRef.current;
    const page = bar?.parentElement;
    if (!bar || !page) return;
    const publish = () => page.style.setProperty('--sticky-offset', `${bar.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      page.style.removeProperty('--sticky-offset');
    };
  }, []);

  const saving = isSaving || autoSaveStatus === 'saving' || isPreviewing;

  const statusLabel = (() => {
    if (autoSaveStatus === 'error') return 'Couldn’t save changes. Retrying…';
    if (saving) return 'Saving…';
    if (isDirty) return 'Unsaved changes';
    if (autoSaveStatus === 'saved') return 'All changes saved';
    return lastPublishedAt ? `Last published ${new Date(lastPublishedAt).toLocaleString()}` : 'Not published yet';
  })();

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      await flushDraft();
      setActivePreviewUrl(previewUrl ?? draftPreviewUrl(restaurantId));
      setIsPreviewOpen(true);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <>
      <div ref={barRef} className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 astryd-sticky border-b border-[var(--astryd-divider)] px-4 sm:px-6 lg:px-8 py-3 -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
        <div className="text-[12px] astryd-text-muted">
          {statusLabel}
          {lastPublishedAt && (isDirty || saving || autoSaveStatus === 'saved') && (
            <span className="ml-2 astryd-text-dim">• Last published {new Date(lastPublishedAt).toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSaveDraft}
            disabled={!isDirty || saving}
            className="astryd-btn astryd-btn-neutral h-9 px-3.5 text-[13px]"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => void handlePreview()}
            disabled={isPreviewing}
            className="astryd-btn astryd-btn-neutral h-9 px-3.5 text-[13px]"
          >
            {isPreviewing ? 'Saving...' : 'Preview'}
          </button>
          <button
            onClick={onPublish}
            disabled={isPublishing || saving}
            className="astryd-btn h-9 px-4 text-[13px]"
          >
            {isPublishing ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} url={activePreviewUrl} />
    </>
  );
}
