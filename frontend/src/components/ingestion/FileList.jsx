import { FileCode2, FileArchive, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function FileList({
  files = [],
  activeFileId,
  onSelectFile,
  onRemoveFile,
  onClearAll,
  isAnalyzed = false
}) {
  if (files.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800">Selected Source Files</span>
          <Badge variant="neutral" size="xs">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </Badge>
          {isAnalyzed && (
            <Badge variant="success" size="xs" dot>
              AST Extracted
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          Clear all
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {files.map((file) => {
          const isSelected = activeFileId === file.id;
          const isPython = file.extension === '.py';

          return (
            <div
              key={file.id}
              className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
              }`}
            >
              <div 
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                onClick={() => onSelectFile && onSelectFile(file.id)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isPython ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {isPython ? <FileCode2 className="w-4 h-4" /> : <FileArchive className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 font-mono truncate">
                      {file.name}
                    </span>
                    {file.isDemo && (
                      <Badge variant="purple" size="xs">
                        Demo
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.loc > 0 ? `${file.loc} LOC` : 'Package Archive'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAnalyzed ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Indexed
                  </span>
                ) : (
                  <Badge variant="neutral" size="xs">
                    Local Staged
                  </Badge>
                )}

                {file.content && (
                  <Button
                    variant={isSelected ? 'subtle' : 'ghost'}
                    size="xs"
                    icon={Eye}
                    onClick={() => onSelectFile && onSelectFile(file.id)}
                    title="View source code"
                  >
                    <span className="hidden sm:inline">{isSelected ? 'Viewing' : 'Inspect'}</span>
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
