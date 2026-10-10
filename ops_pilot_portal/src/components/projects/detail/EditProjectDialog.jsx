import { X } from "lucide-react";

export default function EditProjectDialog({
  name,
  description,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit project dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
        className="relative z-10 w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="edit-project-title"
              className="text-lg font-semibold text-slate-900"
            >
              Edit project
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update this project’s details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Project name
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              rows={3}
              maxLength={255}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              className="mt-1.5 w-full resize-y rounded-md border border-slate-200 px-3 py-2 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
