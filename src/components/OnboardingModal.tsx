import React, { useState } from "react";
import {
  Palette,
  ShoppingBag,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Camera,
  Layers,
  Heart,
  BarChart3,
  X,
  Lock,
} from "lucide-react";
import {
  Language,
  TelegramUser,
  UserRole,
  MAX_ARTIST_UPLOADS,
  ADMIN_TELEGRAM_USERNAME,
  isAuthorizedAdmin,
} from "../types";
import { translations } from "../translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TelegramUser | null;
  onCompleteOnboarding: (user: TelegramUser) => void;
  lang: Language;
}

export const OnboardingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onCompleteOnboarding,
  lang,
}) => {
  const t = translations[lang];

  const [step, setStep] = useState<"role" | "profile">("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser?.role || "buyer");

  // Profile fields initialized from Telegram WebApp or defaults
  const tgWebAppUser = typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user : null;

  const [firstName, setFirstName] = useState(
    currentUser?.first_name || tgWebAppUser?.first_name || (selectedRole === "artist" ? "Elena" : "Alex")
  );
  const [lastName, setLastName] = useState(
    currentUser?.last_name || tgWebAppUser?.last_name || (selectedRole === "artist" ? "Rostova" : "M")
  );
  const [username, setUsername] = useState(
    currentUser?.username || tgWebAppUser?.username || (selectedRole === "artist" ? "elena_art_studio" : "alex_collector")
  );
  const [bio, setBio] = useState(
    currentUser?.bio ||
      (selectedRole === "artist"
        ? "Contemporary tactile mixed media and spatial minimalism."
        : "Art lover collecting tactile contemporary paintings.")
  );
  const [location, setLocation] = useState(currentUser?.location || "Tashkent, Uzbekistan");

  if (!isOpen) return null;

  const isAllowedAdmin = isAuthorizedAdmin(currentUser || tgWebAppUser);

  const handleSelectRole = (role: UserRole) => {
    if (role === "admin" && !isAllowedAdmin) {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
      }
      alert(
        lang === "ru"
          ? `Роль администратора доступна исключительно подтвержденному Telegram-пользователю @${ADMIN_TELEGRAM_USERNAME}. Все остальные аккаунты могут быть только Покупателями или Художниками.`
          : `Admin role is strictly restricted to verified Telegram user @${ADMIN_TELEGRAM_USERNAME}. All other accounts can only be Buyer or Artist.`
      );
      return;
    }

    setSelectedRole(role);
    if (!currentUser) {
      if (role === "artist") {
        setFirstName("Elena");
        setLastName("Rostova");
        setUsername("elena_art_studio");
        setBio("Contemporary tactile mixed media and spatial minimalism.");
      } else if (role === "buyer") {
        setFirstName("Alex");
        setLastName("M");
        setUsername("alex_collector");
        setBio("Art lover collecting tactile contemporary paintings.");
      } else if (role === "admin") {
        setFirstName("Muxammadsiddiq");
        setLastName("Admin");
        setUsername(ADMIN_TELEGRAM_USERNAME);
        setBio("Platform founder & curator.");
      }
    }
    setStep("profile");

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUsername = username.replace("@", "").trim();
    if (tgWebAppUser?.username) {
      cleanUsername = tgWebAppUser.username;
    }

    let finalRole = selectedRole;

    if (finalRole === "admin" && !isAllowedAdmin) {
      alert(
        lang === "ru"
          ? `Роль администратора доступна только для Telegram-пользователя @${ADMIN_TELEGRAM_USERNAME}. Для других аккаунтов установлена роль Покупателя.`
          : `Admin role is strictly restricted to @${ADMIN_TELEGRAM_USERNAME}. For other accounts, role is set to Buyer.`
      );
      finalRole = "buyer";
    }

    const finalizedUser: TelegramUser = {
      id: currentUser?.id || tgWebAppUser?.id || Math.floor(10000000 + Math.random() * 90000000),
      first_name: firstName.trim() || (finalRole === "artist" ? "Artist" : finalRole === "admin" ? "Muxammadsiddiq" : "Collector"),
      last_name: lastName.trim() || undefined,
      username: cleanUsername || (finalRole === "artist" ? "telegram_artist" : finalRole === "admin" ? ADMIN_TELEGRAM_USERNAME : "telegram_buyer"),
      photo_url:
        currentUser?.photo_url ||
        tgWebAppUser?.photo_url ||
        (finalRole === "artist"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"),
      role: finalRole,
      bio: bio.trim(),
      location: location.trim(),
      createdAt: currentUser?.createdAt || new Date().toISOString(),
    };

    onCompleteOnboarding(finalizedUser);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 relative max-h-[92vh] overflow-y-auto">
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-200 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Step 1: Choose Role */}
        {step === "role" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Sparkles size={22} className="text-amber-300" />
              </div>
              <h2 className="font-serif-custom text-2xl sm:text-3xl font-light italic text-[#1A1A1A]">
                {t.onboardingTitle}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 font-light mt-1 max-w-sm mx-auto">
                {t.chooseRole}
              </p>
            </div>

            <div className="space-y-3">
              {/* Buyer Option */}
              <button
                type="button"
                onClick={() => handleSelectRole("buyer")}
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-white border-2 border-neutral-200 hover:border-[#1A1A1A] hover:shadow-lg transition-all flex items-start gap-4 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-[#1A1A1A] group-hover:text-white text-neutral-800 flex items-center justify-center shrink-0 transition-colors">
                  <ShoppingBag size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif-custom text-lg font-bold text-[#1A1A1A]">
                      {t.buyerRole}
                    </h3>
                    <ArrowRight size={16} className="text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-neutral-500 font-light mt-1 leading-relaxed">
                    {t.buyerDesc}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Camera size={11} className="text-[#6B7B62]" /> Live Wall Camera
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={11} className="text-rose-500" /> Like & Collect
                    </span>
                    <span className="flex items-center gap-1">
                      <Send size={11} className="text-[#2AABEE]" /> TG Login
                    </span>
                  </div>
                </div>
              </button>

              {/* Artist Option */}
              <button
                type="button"
                onClick={() => handleSelectRole("artist")}
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-white border-2 border-neutral-200 hover:border-[#1A1A1A] hover:shadow-lg transition-all flex items-start gap-4 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-[#1A1A1A] group-hover:text-white text-neutral-800 flex items-center justify-center shrink-0 transition-colors">
                  <Palette size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif-custom text-lg font-bold text-[#1A1A1A]">
                      {t.artistRole}
                    </h3>
                    <ArrowRight size={16} className="text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-neutral-500 font-light mt-1 leading-relaxed">
                    {t.artistDesc}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600 font-medium">
                    <span className="flex items-center gap-1 text-[#6B7B62] font-bold">
                      ★ Up to {MAX_ARTIST_UPLOADS} Artworks
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={11} /> 3D & Room Angles
                    </span>
                    <span className="flex items-center gap-1">
                      <Send size={11} className="text-[#2AABEE]" /> TG Order Bridge
                    </span>
                  </div>
                </div>
              </button>

              {/* Admin Option */}
              {isAllowedAdmin ? (
                <button
                  type="button"
                  onClick={() => handleSelectRole("admin")}
                  className="w-full text-left p-3.5 px-4 rounded-xl bg-white/70 hover:bg-white border border-neutral-200 hover:border-neutral-400 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-800 block">
                          {t.adminRole} / Platform Analytics
                        </span>
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                          <Lock size={9} />
                          @{ADMIN_TELEGRAM_USERNAME}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-light">
                        {t.adminDesc}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-neutral-400 group-hover:text-black" />
                </button>
              ) : (
                <div
                  onClick={() => {
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                      window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
                    }
                    alert(
                      lang === "ru"
                        ? `Панель администратора доступна исключительно аккаунту @${ADMIN_TELEGRAM_USERNAME}. Все остальные пользователи могут зарегистрироваться как Покупатель или Художник.`
                        : `Admin panel is strictly restricted to @${ADMIN_TELEGRAM_USERNAME}. All other accounts can only be Buyer or Artist.`
                    );
                  }}
                  className="w-full text-left p-3.5 px-4 rounded-xl bg-neutral-100/70 border border-neutral-200/80 transition-all flex items-center justify-between cursor-not-allowed opacity-80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-200/60 text-neutral-400 flex items-center justify-center">
                      <Lock size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-400 block line-through">
                          {t.adminRole}
                        </span>
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5">
                          <Lock size={8} />
                          @{ADMIN_TELEGRAM_USERNAME} only
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-light">
                        {lang === "ru"
                          ? "Заблокировано: доступно только @muxammadsiddiq_23"
                          : "Locked: restricted to @muxammadsiddiq_23"}
                      </span>
                    </div>
                  </div>
                  <Lock size={14} className="text-neutral-400" />
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] text-neutral-400 flex items-center justify-center gap-1">
                <Send size={12} className="text-[#2AABEE]" />
                Single sign-in secured via Telegram WebApp
              </span>
            </div>
          </div>
        )}

        {/* Step 2: Telegram Profile Onboarding */}
        {step === "profile" && (
          <form onSubmit={handleFinish} className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1 py-1"
                >
                  ← Change Role
                </button>
                <span className="text-xs text-neutral-300">|</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider">
                  {selectedRole === "artist" ? t.artistRole : selectedRole === "admin" ? t.adminRole : t.buyerRole}
                </span>
              </div>
            </div>

            <div className="text-center py-2">
              <div className="relative inline-block mb-2">
                <img
                  src={
                    selectedRole === "artist"
                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                      : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
                  }
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#2AABEE]/40 shadow-md mx-auto"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-[#2AABEE] text-white rounded-full">
                  <Send size={10} />
                </span>
              </div>
              <h3 className="font-serif-custom text-xl font-light italic text-[#1A1A1A]">
                {selectedRole === "artist" ? "Complete Artist Studio Profile" : selectedRole === "admin" ? "Admin Access Verification" : "Welcome, Art Collector"}
              </h3>
              <p className="text-xs text-neutral-500 font-light mt-0.5">
                {selectedRole === "artist"
                  ? `Upload up to ${MAX_ARTIST_UPLOADS} artworks, stage angles, and receive orders via Telegram.`
                  : "Preview artworks live on your walls using your camera and chat with artists."}
              </p>
            </div>

            {/* Telegram Handle */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                {t.telegramUsername} *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-neutral-400 text-xs font-mono">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-mono focus:ring-2 focus:ring-[#2AABEE] focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Direct Telegram messaging link for purchase inquiries
              </span>
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-[#2AABEE] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-[#2AABEE] focus:outline-none"
                />
              </div>
            </div>

            {/* Bio & Location for Artists */}
            {selectedRole === "artist" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {t.bio}
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell collectors about your artistic vision..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-[#2AABEE] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {t.location}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-[#2AABEE] focus:outline-none"
                  />
                </div>

                {/* Quota reminder */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>Early Access:</strong> You can upload up to {MAX_ARTIST_UPLOADS} artworks now. More quota will be unlocked soon!
                  </span>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#2AABEE] hover:bg-[#2299d4] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#2AABEE]/25 transition-all mt-3"
            >
              <Send size={15} />
              {t.continueWithTelegram}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
