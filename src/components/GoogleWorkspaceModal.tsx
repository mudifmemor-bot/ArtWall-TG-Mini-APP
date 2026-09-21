import React from "react";
import { X } from "lucide-react";
import { TelegramUser, Language } from "../types";
import { GoogleWorkspacePanel } from "./GoogleWorkspacePanel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: TelegramUser[];
  onUpdateUsers?: (users: TelegramUser[]) => void;
  lang?: Language;
}

export const GoogleWorkspaceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  users,
  onUpdateUsers,
  lang = "en",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white border border-neutral-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        <GoogleWorkspacePanel
          users={users}
          onUpdateUsers={onUpdateUsers}
          lang={lang}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
