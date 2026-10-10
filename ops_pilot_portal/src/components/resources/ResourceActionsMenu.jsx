import { useRef } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function ResourceActionsMenu({ label, onEdit, onDelete }) {
  const menu = useRef(null);

  const runAction = (action) => {
    menu.current.open = false;
    action();
  };

  return (
    <details ref={menu} className="relative shrink-0">
      <summary
        aria-label={`${label} actions`}
        title="Actions"
        className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 top-9 z-20 min-w-36 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
        <button type="button" onClick={() => runAction(onEdit)} className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-sm text-slate-700 hover:bg-slate-50">
          <Pencil aria-hidden="true" className="h-4 w-4" />
          Edit
        </button>
        <button type="button" onClick={() => runAction(onDelete)} className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-sm text-rose-600 hover:bg-rose-50">
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Delete
        </button>
      </div>
    </details>
  );
}