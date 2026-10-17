import { useState, useRef } from 'react';
import {
  UploadSimple,
  CheckCircle,
  File,
  X,
  WarningCircle,
} from '@phosphor-icons/react';
import type { DatasetProfile } from '../../api/types';
import { uploadDataset } from '../../api/endpoints';
import LoadingSpinner from '../shared/LoadingSpinner';

interface DatasetUploadProps {
  onUploaded: (profile: DatasetProfile) => void;
}

export default function DatasetUpload({ onUploaded }: DatasetUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MOCK_PROFILE: DatasetProfile = {
    id: 'mock-dataset-001',
    filename: 'creditcard.csv',
    rows: 284807,
    columns: 31,
    column_names: ['Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'Amount', 'Class'],
    data_types: { Time: 'float64', Amount: 'float64', Class: 'int64', V1: 'float64', V2: 'float64' },
    missing_values: { Time: 0, Amount: 0, Class: 0, V1: 0 },
    duplicates: 0,
    problem_type: 'classification',
    imbalanced: true,
    target_column: 'Class',
  };

  function validate(f: File): string | null {
    if (!f.name.endsWith('.csv')) return 'Only CSV files are supported.';
    if (f.size > 200 * 1024 * 1024) return 'File must be under 200 MB.';
    return null;
  }

  async function handleFile(f: File) {
    const err = validate(f);
    if (err) { setError(err); return; }
    setFile(f);
    setError(null);
    setUploading(true);

    try {
      // Use real API when available, fall back to mock for dev
      let profile: DatasetProfile;
      try {
        profile = await uploadDataset(f);
      } catch {
        // Backend not yet running — use mock data for UI development
        await new Promise(r => setTimeout(r, 1200));
        profile = { ...MOCK_PROFILE, filename: f.name };
      }
      onUploaded(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function reset() {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const zoneClass = [
    'upload-zone',
    isDragging ? 'drag-active' : '',
    file && !error ? 'has-file' : '',
    error ? 'error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div>
      {/* Hidden file input — keyboard accessible alternative per WCAG 2.2 */}
      <input
        ref={fileInputRef}
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={onInputChange}
        style={{ display: 'none' }}
        aria-label="Upload CSV dataset"
      />

      <div
        className={zoneClass}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop CSV file or click to browse"
        onKeyDown={e => e.key === 'Enter' && !file && fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          {uploading ? (
            <LoadingSpinner size={20} />
          ) : file && !error ? (
            <CheckCircle size={24} weight="fill" />
          ) : error ? (
            <WarningCircle size={24} weight="fill" />
          ) : (
            <UploadSimple size={24} weight="regular" aria-hidden="true" />
          )}
        </div>

        {uploading ? (
          <>
            <p className="upload-title">Uploading & profiling dataset…</p>
            <p className="upload-subtitle text-muted">Analyzing rows, types, and class balance</p>
          </>
        ) : file && !error ? (
          <>
            <p className="upload-title" style={{ color: 'var(--color-success)' }}>
              Dataset ready
            </p>
            <div className="flex items-center justify-center gap-sm mb-xl">
              <File size={14} weight="fill" style={{ color: 'var(--color-muted-foreground)' }} aria-hidden="true" />
              <span className="text-sm text-muted font-mono">{file.name}</span>
              <span className="text-xs text-muted">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={e => { e.stopPropagation(); reset(); }}
              type="button"
            >
              <X size={14} weight="bold" aria-hidden="true" />
              Remove file
            </button>
          </>
        ) : error ? (
          <>
            <p className="upload-title" style={{ color: 'var(--color-destructive)' }}>Upload failed</p>
            <p className="upload-subtitle">{error}</p>
            <button
              className="upload-file-btn"
              onClick={e => { e.stopPropagation(); reset(); fileInputRef.current?.click(); }}
              type="button"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <p className="upload-title">Drop your CSV dataset here</p>
            <p className="upload-subtitle">
              or use the button below to browse
            </p>
            <label
              htmlFor="csv-upload"
              className="upload-file-btn"
              onClick={e => e.stopPropagation()}
            >
              <UploadSimple size={14} weight="regular" aria-hidden="true" />
              Browse file
            </label>
            <p className="upload-hint mt-md">CSV format · Max 200 MB</p>
          </>
        )}
      </div>
    </div>
  );
}
