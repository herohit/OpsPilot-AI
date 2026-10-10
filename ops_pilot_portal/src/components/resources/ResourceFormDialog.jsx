import { X } from "lucide-react";

export default function ResourceFormDialog({
  title,
  name,
  description,
  contextLabel,
  contextOptions = [],
  contextId = "",
  onNameChange,
  onDescriptionChange,
  onContextChange,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close dialog" onClick={onClose} disabled={isSubmitting} className="absolute inset-0 bg-slate-950/40" />
      <section role="dialog" aria-modal="true" aria-labelledby="resource-dialog-title" className="relative z-10 w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="resource-dialog-title" className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Add or update infrastructure details.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {contextLabel && (
            <label className="block text-sm font-medium text-slate-700">
              {contextLabel}
              <select required value={contextId} onChange={(event) => onContextChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="" disabled>Select {contextLabel.toLowerCase()}</option>
                {contextOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input required maxLength={100} value={name} onChange={(event) => onNameChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
            <textarea rows={3} maxLength={255} value={description} onChange={(event) => onDescriptionChange(event.target.value)} className="mt-1.5 w-full resize-y rounded-md border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="h-9 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}