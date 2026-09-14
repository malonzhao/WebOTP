import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

export function Modal({
  open,
  title,
  onClose,
  busy = false,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      className="relative z-30"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-6"
            aria-busy={busy}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <button
                type="button"
                className="icon-button -mr-2 -mt-2"
                onClick={onClose}
                disabled={busy}
                aria-label={t("common.close")}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {children}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
