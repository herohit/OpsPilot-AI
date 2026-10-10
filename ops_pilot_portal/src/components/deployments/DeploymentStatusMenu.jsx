import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, MoreHorizontal } from "lucide-react";

const menuWidth = 160;
const menuHeight = 176;

export default function DeploymentStatusMenu({
  deployment,
  statuses,
  isUpdating,
  onChangeStatus,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const belowTop = trigger.bottom + 4;
      const top =
        belowTop + menuHeight <= window.innerHeight - 8
          ? belowTop
          : Math.max(8, trigger.top - menuHeight - 4);
      const left = Math.max(
        8,
        Math.min(trigger.right - menuWidth, window.innerWidth - menuWidth - 8),
      );
      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Update ${deployment.version} status`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Status for ${deployment.version}`}
            style={{ top: position.top, left: position.left, width: menuWidth }}
            className="fixed z-[100] rounded-md border border-slate-200 bg-white p-1 shadow-xl"
          >
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                role="menuitem"
                disabled={isUpdating}
                onClick={() => {
                  setIsOpen(false);
                  onChangeStatus(status);
                }}
                className="flex h-8 w-full items-center justify-between rounded px-2 text-left text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <span>{status[0].toUpperCase() + status.slice(1)}</span>
                {deployment.status === status && (
                  <Check
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-emerald-600"
                  />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
