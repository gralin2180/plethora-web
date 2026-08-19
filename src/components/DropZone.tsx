"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Plus } from "lucide-react";

export function DropZone({
  accept,
  multiple,
  label = "Drop files here or click",
  hint,
  onFiles,
  disabled,
  compact,
}: {
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      onFiles(list);
    },
    [onFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) take(e.dataTransfer.files);
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition ${
        compact ? "min-h-[112px] py-5" : "min-h-[160px] py-8"
      } ${
        over
          ? "border-violet-400 bg-violet-500/15"
          : "border-white/15 bg-white/[0.03] hover:border-violet-500/50 hover:bg-violet-500/5"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <div
        className={`mb-3 flex items-center justify-center rounded-2xl border border-white/10 bg-black/40 transition group-hover:border-violet-500/40 ${
          compact ? "h-10 w-10" : "h-14 w-14"
        } ${over ? "scale-105 border-violet-400" : ""}`}
      >
        <Plus className={compact ? "h-5 w-5 text-violet-400" : "h-7 w-7 text-violet-400"} strokeWidth={2.25} />
      </div>
      <p className="text-sm font-medium text-white">{label}</p>
      {hint && <p className="mt-1 max-w-xs text-xs text-zinc-500">{hint}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-600">
        <FileUp className="h-3 w-3" /> or browse
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
