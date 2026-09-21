import React, { useState } from "react";
import { X, Send, UserCheck, Palette, ShoppingBag, ShieldCheck } from "lucide-react";
import { TelegramUser, UserRole, Language } from "../types";
import { translations } from "../translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TelegramUser | null;
  onSaveUser: (user: TelegramUser) => void;
  lang: Language;
}

export const TelegramAuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  lang,
}) => {
  const t = translations[lang];

  const [role, setRole] = useState<UserRole>(currentUser?.role || "buyer");
  const [firstName, setFirstName] = useState(currentUser?.first_name || "");
  const [lastName, setLastName] = useState(currentUser?.last_name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [location, setLocation] = useState(currentUser?.location || "");

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TelegramUser = {
      id: currentUser?.id || Math.floor(Math.random() * 100000000) + 100000,
      first_name: firstName.trim() || (role === "artist" ? "Artist" : "Art Buyer"),
      last_name: lastName.trim() || undefined,
      username: username.replace("@", "").trim() || (role === "artist" ? "telegram_artist" : "art_collector"),
      photo_url:
        currentUser?.photo_url ||
        (role === "artist"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"),
      role,
      bio: bio.trim() || (role === "artist" ? "Contemporary mixed media artist creating spatial dialogue through texture." : "Passionate art collector seeking statement originals for modern interiors."),
      location: location.trim() || "Tashkent / Studio Central",
    };

    onSaveUser(updated);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
    onClose();
  };

  const loadPreset = (presetRole: UserRole) => {
    setRole(presetRole);
    if (presetRole === "artist") {
      setFirstName("Elena");
      setLastName("Rostova");
      setUsername("elena_art_studio");
      setBio("Creating contemporary tactile abstractions and spatial installations.");
      setLocation("Studio 4B, Tashkent");
    } else {
      setFirstName("Damir");
      setLastName("Alimov");
      setUsername("damir_collector");
      setBio("Curating modern minimal interior pieces for private collections.");
      setLocation("Tashkent, Uzbekistan");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-800 rounded-full hover:bg-neutral-200/60 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#2AABEE] text-white flex items-center justify-center shadow-md shadow-[#2AABEE]/20">
            <Send size={22} className="translate-x-[-1px] translate-y-[1px]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-custom tracking-tight flex items-center gap-2">
              {t.telegramAuth}
              <ShieldCheck size={18} className="text-[#2AABEE]" />
            </h2>
            <p className="text-xs text-neutral-500">
              {currentUser ? t.connectedAs : t.signInWithTelegram}
            </p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
            {t.switchRole}
          </label>
          <div className="grid grid-cols-2 gap-2 bg-neutral-200/70 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                role === "buyer"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <ShoppingBag size={15} />
              {t.buyerRole}
            </button>
            <button
              type="button"
              onClick={() => setRole("artist")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                role === "artist"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <Palette size={15} />
              {t.artistRole}
            </button>
          </div>
        </div>

        {/* Quick Demo Pre-fill */}
        <div className="mb-5 p-3 rounded-2xl bg-[#E8E6E1]/60 border border-[#D6D2C4]/60 flex items-center justify-between">
          <span className="text-xs text-neutral-600 font-medium">Quick switch persona:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadPreset("buyer")}
              className="text-[11px] font-bold text-[#1A1A1A] underline hover:text-[#6B7B62]"
            >
              Buyer Demo
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => loadPreset("artist")}
              className="text-[11px] font-bold text-[#6B7B62] underline hover:text-[#5a6852]"
            >
              Artist Demo
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Elena"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Rostova"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">
              {t.telegramUsername}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-neutral-400 text-sm font-medium">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="elena_art"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">
              {t.location}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Tashkent, Uzbekistan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">
              {t.bio}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={role === "artist" ? "Art style, inspirations and exhibitions..." : "Interests, preferred styles..."}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7B62] resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <UserCheck size={16} />
              {t.saveProfile}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
