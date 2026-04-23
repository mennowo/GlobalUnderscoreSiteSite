import { useState } from 'react';
import { uploadImage } from '../lib/api';

type Props = {
  url: string;
  alt: string;
  canEdit: boolean;
  onChange: (url: string) => void;
  onAltChange?: (alt: string) => void;
  accept?: string;
  className?: string;
  imgClassName?: string;
};

export default function ImageUpload({
  url,
  alt,
  canEdit,
  onChange,
  onAltChange,
  accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml',
  className = '',
  imgClassName = '',
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await uploadImage(file);
      onChange(res.url);
    } catch (ex) {
      setErr(String((ex as Error).message || ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${canEdit ? 'relative' : ''} ${className}`}>
      <img src={url} alt={alt} className={imgClassName} loading="lazy" />
      {canEdit && (
        <div className="absolute inset-0 bg-ink/40 opacity-0 hover:opacity-100 focus-within:opacity-100 transition flex flex-col items-center justify-center gap-2 text-white text-sm p-3 rounded-[inherit]">
          <label className="btn-primary !px-3 !py-1.5 cursor-pointer">
            {busy ? 'uploading…' : 'replace'}
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFile}
              disabled={busy}
            />
          </label>
          {onAltChange && (
            <input
              type="text"
              defaultValue={alt}
              onBlur={(e) => onAltChange(e.target.value)}
              placeholder="alt text"
              className="text-ink text-xs px-2 py-1 rounded w-full max-w-[14rem] bg-white/95"
            />
          )}
          {err && (
            <span className="text-coral bg-white/90 rounded px-2 py-0.5 text-xs">{err}</span>
          )}
        </div>
      )}
    </div>
  );
}
