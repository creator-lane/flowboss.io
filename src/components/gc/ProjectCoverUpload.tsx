import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { ProjectCoverPlaceholder } from '../ui/ProjectCoverPlaceholder';

interface ProjectCoverUploadProps {
  projectId: string;
  coverUrl?: string | null;
  /** Used as an alt-text fallback and to tint the placeholder. */
  projectName?: string;
  /** Hide the upload/remove controls — e.g. when a sub is viewing a GC's project. */
  readOnly?: boolean;
}

// Hero image slot for a GC project. Shows the cover if one is set, otherwise
// a photo-upload CTA. Upload happens in one shot — pick file, we push to
// Supabase storage, write the URL to gc_projects, invalidate the detail query.
// Kept intentionally plain (no crop UI) so it ships on the MVP timeline; we
// can add a cropper later without changing the storage path shape.
export function ProjectCoverUpload({
  projectId,
  coverUrl,
  projectName,
  readOnly,
}: ProjectCoverUploadProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [localError, setLocalError] = useState<string | null>(null);

  const uploadMut = useMutation({
    mutationFn: (file: File) => api.uploadProjectCover(projectId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gc-project', projectId] });
      qc.invalidateQueries({ queryKey: ['gc-projects'] });
      setLocalError(null);
    },
    onError: (err: any) => setLocalError(err?.message || 'Upload failed'),
  });

  const clearMut = useMutation({
    mutationFn: () => api.clearProjectCover(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gc-project', projectId] });
      qc.invalidateQueries({ queryKey: ['gc-projects'] });
    },
  });

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Image is too large (5 MB max).');
      return;
    }
    uploadMut.mutate(file);
    // Reset so selecting the same file again re-fires onChange.
    e.target.value = '';
  };

  const busy = uploadMut.isPending || clearMut.isPending;

  return (
    <div className="relative w-full h-44 md:h-56 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-white/5 dark:to-white/[0.02] group">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={projectName ? `${projectName} cover` : 'Project cover'}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        // Auto-generated cover — deterministic per projectId so every project
        // looks distinct even before the GC uploads a real photo.
        <ProjectCoverPlaceholder
          projectId={projectId}
          projectName={projectName}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Dark gradient for legibility of overlay controls. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 pointer-events-none" />

      {/* Controls */}
      {!readOnly && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handlePick}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-neutral-900 text-xs font-semibold shadow-md backdrop-blur-sm disabled:opacity-60 transition-colors"
          >
            {uploadMut.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {coverUrl ? 'Replace' : 'Upload cover'}
          </button>
          {coverUrl && (
            <button
              type="button"
              onClick={() => clearMut.mutate()}
              disabled={busy}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 hover:bg-red-50 hover:text-red-600 text-neutral-500 shadow-md backdrop-blur-sm disabled:opacity-60 transition-colors"
              title="Remove cover"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Error chip */}
      {localError && (
        <div className="absolute top-3 left-3 right-3 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
          {localError}
        </div>
      )}
    </div>
  );
}
