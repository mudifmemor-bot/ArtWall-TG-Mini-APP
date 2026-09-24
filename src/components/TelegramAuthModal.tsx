import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  UserCheck,
  Palette,
  ShoppingBag,
  ShieldCheck,
  Crown,
  Phone,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  TelegramUser,
  UserRole,
  Language,
  ADMIN_TELEGRAM_USERNAME,
  getRealTelegramUser,
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

  const realTg = getRealTelegramUser();

  const [role, setRole] = useState<UserRole>(currentUser?.role || "buyer");
  const [firstName, setFirstName] = useState(currentUser?.first_name || realTg?.first_name || "");
  const [lastName, setLastName] = useState(currentUser?.last_name || realTg?.last_name || "");
  const [username, setUsername] = useState(currentUser?.username || realTg?.username || "");
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone_number || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [location, setLocation] = useState(currentUser?.location || "Tashkent, Uzbekistan");
  const [isRequestingContact, setIsRequestingContact] = useState(false);
  const [contactNotice, setContactNotice] = useState<string | null>(null);

  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  const isMuxammadSiddiq =
    cleanUsername === ADMIN_TELEGRAM_USERNAME.toLowerCase() ||
    Boolean(realTg?.username && realTg.username.replace(/^@/, "").trim().toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase());

  // If username becomes muxammadsiddiq_23, auto-enable Admin
  useEffect(() => {
    if (isMuxammadSiddiq && role !== "admin") {
      setRole("admin");
      if (!firstName || firstName === "Damir" || firstName === "Elena") {
        setFirstName("Muxammadsiddiq");
      }
      if (!bio || bio.includes("interior") || bio.includes("tactile")) {
        setBio("Art Wall platform operations, curation & founder analytics.");
      }
    }
  }, [cleanUsername, isMuxammadSiddiq]);

  if (!isOpen) return null;

  // Request Telegram Contact via official WebApp API
  const handleRequestTelegramContact = () => {
    setContactNotice(null);
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.requestContact) {
      setIsRequestingContact(true);
      try {
        window.Telegram.WebApp.requestContact((shared: boolean, result?: any) => {
          setIsRequestingContact(false);
          if (shared) {
            const contactData = result?.response || result || {};
            if (contactData.phone_number) {
              const formattedPhone = contactData.phone_number.startsWith("+")
                ? contactData.phone_number
                : `+${contactData.phone_number}`;
              setPhoneNumber(formattedPhone);
            }
            if (contactData.first_name) setFirstName(contactData.first_name);
            if (contactData.last_name) setLastName(contactData.last_name);

            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
            }
            setContactNotice("Contact successfully verified via Telegram!");
          } else {
            setContactNotice("Contact sharing dismissed. You can edit your phone number manually below.");
          }
        });
      } catch (err) {
        setIsRequestingContact(false);
        setContactNotice("Telegram contact prompt is active in Telegram Mini Apps. Please confirm details below.");
      }
    } else {
      setContactNotice("Telegram native prompt is available inside Telegram. Enter your details below to continue.");
    }
  };

  const handleSignInAsMuxammadSiddiq = () => {
    setUsername(ADMIN_TELEGRAM_USERNAME);
    setFirstName("Muxammadsiddiq");
    setLastName("Admin");
    setRole("admin");
    if (!phoneNumber) setPhoneNumber("+998 90 123 45 67");
    setBio("Art Wall platform operations, curation & founder analytics.");
    setLocation("HQ Tashkent, Uzbekistan");

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let finalUsername = username.replace(/^@/, "").trim();
    let finalRole = role;

    // Check if admin is authorized
    if (finalUsername.toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase()) {
      finalRole = "admin";
    } else if (finalRole === "admin" && !isMuxammadSiddiq) {
      alert(
        lang === "ru"
          ? `Роль администратора закреплена только за @${ADMIN_TELEGRAM_USERNAME}.`
          : `Admin role is strictly restricted to @${ADMIN_TELEGRAM_USERNAME}.`
      );
      finalRole = "buyer";
    }

    const updated: TelegramUser = {
      id:
        currentUser?.id ||
        realTg?.id ||
        (finalRole === "admin" ? 999 : Math.floor(Math.random() * 100000000) + 100000),
      first_name:
        firstName.trim() ||
        (finalRole === "admin" ? "Muxammadsiddiq" : finalRole === "artist" ? "Artist" : "Art Buyer"),
      last_name: lastName.trim() || undefined,
      username:
        finalUsername ||
        (finalRole === "admin" ? ADMIN_TELEGRAM_USERNAME : finalRole === "artist" ? "telegram_artist" : "art_collector"),
      phone_number: phoneNumber.trim() || undefined,
      photo_url:
        currentUser?.photo_url ||
        realTg?.photo_url ||
        (finalRole === "admin"
          ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
          : finalRole === "artist"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"),
      role: finalRole,
      bio:
        bio.trim() ||
        (finalRole === "admin"
          ? "Art Wall platform operations, curation & founder analytics."
          : finalRole === "artist"
          ? "Contemporary mixed media artist creating spatial dialogue through texture."
          : "Passionate art collector seeking statement originals for modern interiors."),
      location: location.trim() || "Tashkent, Uzbekistan",
      createdAt: currentUser?.createdAt || new Date().toISOString(),
    };

    onSaveUser(updated);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-md rounded-3xl p-4 sm:p-7 shadow-2xl border border-white/80 relative max-h-[92vh] overflow-y-auto overflow-x-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-800 rounded-full hover:bg-neutral-200/60 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
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

        {/* Telegram Contact Sharing Button */}
        <div className="mb-4 p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={13} className="text-blue-600" />
              Telegram Contact Sharing
            </span>
            {phoneNumber && (
              <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <CheckCircle2 size={10} /> Verified
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRequestTelegramContact}
            disabled={isRequestingContact}
            className="w-full py-2.5 px-3 rounded-xl bg-[#2AABEE] hover:bg-[#2299d4] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Send size={14} />
            <span>{isRequestingContact ? "Requesting..." : "📱 Share Contact via Telegram"}</span>
          </button>
          {contactNotice && (
            <p className="text-[11px] text-blue-800 mt-2 flex items-center gap-1">
              <Info size={12} className="shrink-0 text-blue-600" />
              <span>{contactNotice}</span>
            </p>
          )}
        </div>

        {/* Quick Sign-In for Admin @muxammadsiddiq_23 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleSignInAsMuxammadSiddiq}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              isMuxammadSiddiq
                ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300/40"
                : "bg-white border-neutral-200 hover:border-amber-400 text-neutral-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-amber-600" />
              <div className="text-left">
                <span className="text-xs font-bold block text-amber-950">
                  Sign In as @{ADMIN_TELEGRAM_USERNAME}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  Platform Founder & Admin HQ
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-700 underline">
              {isMuxammadSiddiq ? "Selected ✓" : "Sign In"}
            </span>
          </button>
        </div>

        {/* Role Switcher Buttons */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Role & Window
            </label>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-200/70 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === "buyer"
                  ? "bg-[#1A1A1A] text-white shadow-sm"
                  : "text-neutral-700 hover:text-neutral-900 bg-white/70 hover:bg-white"
              }`}
            >
              <ShoppingBag size={14} />
              <span>Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("artist")}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === "artist"
                  ? "bg-[#6B7B62] text-white shadow-sm"
                  : "text-neutral-700 hover:text-neutral-900 bg-white/70 hover:bg-white"
              }`}
            >
              <Palette size={14} />
              <span>Artist</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isMuxammadSiddiq) {
                  handleSignInAsMuxammadSiddiq();
                } else {
                  setRole("admin");
                }
              }}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                role === "admin"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-neutral-700 hover:text-neutral-900 bg-white/70 hover:bg-white"
              }`}
            >
              <Crown size={14} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Telegram Username *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-neutral-400 text-xs font-mono font-medium">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="muxammadsiddiq_23"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-neutral-400 text-xs">
                <Phone size={13} />
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Muxammadsiddiq"
                className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Admin"
                className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Tashkent, Uzbekistan"
              className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Bio / Narrative
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Art style or collector preferences..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE] resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <UserCheck size={16} />
              <span>{t.saveProfile} & Launch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
