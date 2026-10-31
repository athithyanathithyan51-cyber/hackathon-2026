import { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export default function UploadZone({ 
  onFilesSelected, 
  onLoadDemo, 
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndAddFiles = (fileList) => {
    setErrorMsg(null);
    const validFiles = [];
    const invalidFiles = [];

    Array.from(fileList).forEach(file => {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.py') || lowerName.endsWith('.zip')) {
        validFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          extension: lowerName.endsWith('.py') ? '.py' : '.zip',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          rawSize: file.size,
          loc: lowerName.endsWith('.py') ? Math.floor(file.size / 30) || 12 : 0,
          status: 'Selected (Local)',
          fileRef: file,
          isDemo: false
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setErrorMsg(`Unsupported file type(s): ${invalidFiles.join(', ')}. Only Python (.py) and source archives (.zip) are permitted.`);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target?.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      // Reset input value so same file can be re-selected if removed
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[0.995]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'
        } ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".py,.zip"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">
              Drop Python source files or ZIP archives here
            </div>
            <p className="text-xs text-slate-500">
              Supports <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">.py</code> scripts and multi-module <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">.zip</code> packages (max 25MB)
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400">or</span>
            <Button
              variant="secondary"
              size="xs"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
            <span className="text-slate-300">|</span>
            <Button
              variant="subtle"
              size="xs"
              type="button"
              icon={Sparkles}
              onClick={(e) => {
                e.stopPropagation();
                onLoadDemo();
              }}
              title="Load sample Python banking application (penalty_engine.py)"
            >
              Load Banking Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
