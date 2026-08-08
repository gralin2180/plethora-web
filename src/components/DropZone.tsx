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
}: {
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
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
      className={`group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
        over
          ? "border-violet-400 bg-violet-500/15"
          : "border-white/15 bg-white/[0.03] hover:border-violet-500/50 hover:bg-violet-500/5"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <div
        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40 transition group-hover:border-violet-500/40 ${
          over ? "scale-105 border-violet-400" : ""
        }`}
      >
        <Plus className="h-7 w-7 text-violet-400" strokeWidth={2.25} />
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
