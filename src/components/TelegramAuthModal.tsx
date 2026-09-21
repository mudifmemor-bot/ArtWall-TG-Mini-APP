import React, { useState } from "react";
import { X, Send, UserCheck, Palette, ShoppingBag, ShieldCheck, Lock } from "lucide-react";
import {
  TelegramUser,
  UserRole,
  Language,
  ADMIN_TELEGRAM_USERNAME,
  isAuthorizedAdmin,
} from "../types";
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

  const normalizedUsername = username.replace("@", "").trim().toLowerCase();
  const isEligibleForAdmin = normalizedUsername === ADMIN_TELEGRAM_USERNAME.toLowerCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.replace("@", "").trim();

    // STRICT CHECK: Only @muxammadsiddiq_23 is permitted as admin.
    // All other accounts can only be either artist or buyer.
    let finalRole = role;
    if (role === "admin") {
      if (cleanUsername.toLowerCase() !== ADMIN_TELEGRAM_USERNAME.toLowerCase()) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
        }
        alert(
          lang === "ru"
            ? `Аккаунт администратора строго закреплен за Telegram-пользователем @${ADMIN_TELEGRAM_USERNAME}. Для логина @${cleanUsername} разрешена только роль Покупателя или Художника.`
            : `The Admin account is strictly restricted to Telegram user @${ADMIN_TELEGRAM_USERNAME}. For @${cleanUsername}, only Buyer or Artist roles are permitted.`
        );
        return;
      }
    }

    const updated: TelegramUser = {
      id: currentUser?.id || Math.floor(Math.random() * 100000000) + 100000,
      first_name: firstName.trim() || (finalRole === "artist" ? "Artist" : finalRole === "admin" ? "Muxammadsiddiq" : "Art Buyer"),
      last_name: lastName.trim() || undefined,
      username: cleanUsername || (finalRole === "artist" ? "telegram_artist" : finalRole === "admin" ? ADMIN_TELEGRAM_USERNAME : "art_collector"),
      photo_url:
        currentUser?.photo_url ||
        (finalRole === "artist"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"),
      role: finalRole,
      bio: bio.trim() || (finalRole === "artist" ? "Contemporary mixed media artist creating spatial dialogue through texture." : finalRole === "admin" ? "Platform founder & curation overview." : "Passionate art collector seeking statement originals for modern interiors."),
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
    } else if (presetRole === "admin") {
      setFirstName("Muxammadsiddiq");
      setLastName("Admin");
      setUsername(ADMIN_TELEGRAM_USERNAME);
      setBio("Art Wall platform operations, curation & founder analytics.");
      setLocation("HQ Tashkent, Uzbekistan");
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

        {/* Role Window Switcher */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Select Window & Account Role
            </label>
            <span className="text-[11px] text-neutral-400 font-medium">Tap to switch</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-200/70 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setRole("buyer");
                // Immediately switch role if user wants quick switch
                const updated: TelegramUser = {
                  id: currentUser?.id || 201,
                  first_name: firstName.trim() || currentUser?.first_name || "Damir",
                  last_name: lastName.trim() || currentUser?.last_name || "Alimov",
                  username: username.replace("@", "").trim() || currentUser?.username || "damir_collector",
                  photo_url: currentUser?.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                  role: "buyer",
                  bio: bio.trim() || currentUser?.bio || "Curating modern interior pieces for private collections.",
                  location: location.trim() || currentUser?.location || "Tashkent, Uzbekistan",
                };
                onSaveUser(updated);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                }
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === "buyer"
                  ? "bg-[#1A1A1A] text-white shadow-sm"
                  : "text-neutral-700 hover:text-neutral-900 bg-white/70 hover:bg-white"
              }`}
            >
              <ShoppingBag size={15} />
              <span>{t.buyerRole.split(" ")[0]}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("artist");
                const updated: TelegramUser = {
                  id: currentUser?.id || 101,
                  first_name: firstName.trim() || (currentUser?.role === "artist" ? currentUser.first_name : "Elena"),
                  last_name: lastName.trim() || (currentUser?.role === "artist" ? currentUser.last_name : "Rostova"),
                  username: username.replace("@", "").trim() || (currentUser?.role === "artist" ? currentUser.username : "elena_art_studio"),
                  photo_url: currentUser?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                  role: "artist",
                  bio: bio.trim() || "Contemporary mixed media artist creating spatial dialogue through texture.",
                  location: location.trim() || "Studio 4B, Tashkent",
                };
                onSaveUser(updated);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                }
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === "artist"
                  ? "bg-[#6B7B62] text-white shadow-sm"
                  : "text-neutral-700 hover:text-neutral-900 bg-white/70 hover:bg-white"
              }`}
            >
              <Palette size={15} />
              <span>{t.artistRole}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("admin");
                // Admin role requires @muxammadsiddiq_23 username
                const targetUsername = ADMIN_TELEGRAM_USERNAME;
                const targetFirstName = isEligibleForAdmin && firstName ? firstName : "Muxammadsiddiq";
                setUsername(targetUsername);
                setFirstName(targetFirstName);

                const updated: TelegramUser = {
                  id: currentUser?.id || 999,
                  first_name: targetFirstName,
                  last_name: lastName.trim() || (isEligibleForAdmin && currentUser?.last_name ? currentUser.last_name : "Admin"),
                  username: targetUsername,
                  photo_url: currentUser?.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
                  role: "admin",
                  bio: bio.trim() || "Art Wall platform founder & curation overview.",
                  location: location.trim() || "HQ Tashkent",
                };
                onSaveUser(updated);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                }
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                role === "admin"
                  ? "bg-[#2D3748] text-white shadow-sm"
                  : "text-neutral-700 hover:text-neutral-900 bg-white/70 hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-1">
                <ShieldCheck size={15} />
                <Lock size={10} className="text-amber-400" />
              </div>
              <span className="truncate">{t.adminRole}</span>
              <span className="text-[9px] opacity-80 font-normal">@{ADMIN_TELEGRAM_USERNAME}</span>
            </button>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1.5 text-center">
            {lang === "ru"
              ? "Аккаунт администратора доступен исключительно для @muxammadsiddiq_23"
              : "Admin account is strictly restricted to @muxammadsiddiq_23"}
          </p>
        </div>

        {/* Quick Demo Pre-fill */}
        <div className="mb-5 p-3 rounded-2xl bg-[#E8E6E1]/60 border border-[#D6D2C4]/60 flex items-center justify-between">
          <span className="text-xs text-neutral-600 font-medium">Quick login & switch:</span>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => {
                const user: TelegramUser = {
                  id: 201,
                  first_name: "Damir",
                  last_name: "Alimov",
                  username: "damir_collector",
                  photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                  role: "buyer",
                  bio: "Curating modern minimal interior pieces for private collections.",
                  location: "Tashkent, Uzbekistan",
                };
                onSaveUser(user);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                }
                onClose();
              }}
              className="text-[11px] font-bold text-[#1A1A1A] underline hover:text-[#6B7B62] cursor-pointer"
            >
              Buyer
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => {
                const user: TelegramUser = {
                  id: 101,
                  first_name: "Elena",
                  last_name: "Rostova",
                  username: "elena_art_studio",
                  photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                  role: "artist",
                  bio: "Creating contemporary tactile abstractions and spatial installations.",
                  location: "Studio 4B, Tashkent",
                };
                onSaveUser(user);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                }
                onClose();
              }}
              className="text-[11px] font-bold text-[#6B7B62] underline hover:text-[#5a6852] cursor-pointer"
            >
              Artist
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => {
                const user: TelegramUser = {
                  id: 999,
                  first_name: "Muxammadsiddiq",
                  last_name: "Admin",
                  username: ADMIN_TELEGRAM_USERNAME,
                  photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
                  role: "admin",
                  bio: "Art Wall platform operations, curation & founder analytics.",
                  location: "HQ Tashkent",
                };
                onSaveUser(user);
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                }
                onClose();
              }}
              className="text-[11px] font-bold text-[#2D3748] underline hover:text-black cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck size={12} />
              Admin (@{ADMIN_TELEGRAM_USERNAME})
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
            {role === "admin" && !isEligibleForAdmin && (
              <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                <Lock size={12} />
                {lang === "ru"
                  ? `Только @${ADMIN_TELEGRAM_USERNAME} может иметь статус администратора.`
                  : `Only @${ADMIN_TELEGRAM_USERNAME} is authorized for the Admin account.`}
              </p>
            )}
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
