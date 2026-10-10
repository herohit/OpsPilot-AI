import { Trash2, X } from "lucide-react";

export default function ResourceDeleteDialog({ name, isDeleting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close delete confirmation" disabled={isDeleting} onClick={onClose} className="absolute inset-0 bg-slate-950/40" />
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-resource-title" className="relative z-10 w-full max-w-sm rounded-md border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="delete-resource-title" className="text-base font-semibold text-slate-900">Delete this item?</h2>
            <p className="mt-2 text-sm leading-5 text-slate-600">“{name}” will be permanently removed. This cannot be undone.</p>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isDeleting} className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="inline-flex h-9 items-center gap-2 rounded-md bg-rose-600 px-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60">
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}