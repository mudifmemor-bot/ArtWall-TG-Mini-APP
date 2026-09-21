import React, { useState, useRef, useEffect } from "react";
import {
  Palette,
  ShoppingBag,
  Layers,
  Box,
  User,
  Send,
  BarChart3,
  ShieldCheck,
  LogOut,
  Sliders,
  ChevronDown,
  Check,
  Lock,
} from "lucide-react";
import {
  Language,
  TelegramUser,
  UserRole,
  ADMIN_TELEGRAM_USERNAME,
  isAuthorizedAdmin,
} from "../types";
import { translations } from "../translations";

interface Props {
  currentTab: "gallery" | "visualizer" | "studio" | "basket" | "admin" | "profile";
  onSelectTab: (tab: "gallery" | "visualizer" | "studio" | "basket" | "admin" | "profile") => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  user: TelegramUser | null;
  onOpenAuth: () => void;
  cartCount: number;
  onOpenRoleSwitcher?: () => void;
  onSwitchRole?: (role: UserRole) => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  lang,
  onSelectLang,
  user,
  onOpenAuth,
  cartCount,
  onOpenRoleSwitcher,
  onSwitchRole,
}) => {
  const t = translations[lang];
  const canAccessAdmin = isAuthorizedAdmin(user);
  const currentRole: "buyer" | "artist" | "admin" =
    user?.role === "admin" && !canAccessAdmin ? "buyer" : user?.role || "buyer";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#F9F8F6]/95 backdrop-blur-md border-b border-[#E8E6E1] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* =========================================================================
            BRAND / LOGO - Role Specific Window Identity
           ========================================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          {currentRole === "buyer" && (
            <button
              onClick={() => onSelectTab("gallery")}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-serif-custom italic font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="font-serif-custom text-lg sm:text-xl font-medium tracking-tight text-[#1A1A1A] block leading-none">
                  {t.appTitle}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wide hidden sm:block">
                  Collector Gallery & AR Staging
                </span>
              </div>
            </button>
          )}

          {currentRole === "artist" && (
            <button
              onClick={() => onSelectTab("studio")}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#6B7B62] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Palette size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-custom text-lg sm:text-xl font-medium tracking-tight text-[#1A1A1A] block leading-none">
                    Art Wall Studio
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#6B7B62]/15 text-[#6B7B62] text-[9px] font-bold uppercase tracking-wider">
                    Artist Window
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wide hidden sm:block">
                  {user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Artist Portal"} • My Artworks & Analytics
                </span>
              </div>
            </button>
          )}

          {currentRole === "admin" && (
            <button
              onClick={() => onSelectTab("admin")}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2D3748] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-custom text-lg sm:text-xl font-medium tracking-tight text-[#1A1A1A] block leading-none">
                    Art Wall HQ
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#2D3748]/15 text-[#2D3748] text-[9px] font-bold uppercase tracking-wider">
                    Admin Window
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wide hidden sm:block">
                  Founder Analytics & Platform Operations
                </span>
              </div>
            </button>
          )}
        </div>

        {/* =========================================================================
            CENTER NAVIGATION - Strict Window Isolation (Desktop)
           ========================================================================= */}
        <nav className="hidden md:flex items-center gap-1 bg-[#E8E6E1]/50 p-1 rounded-2xl">
          {/* BUYER WINDOW: Gallery, Wall AR & Profile */}
          {currentRole === "buyer" && (
            <>
              <button
                onClick={() => onSelectTab("gallery")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "gallery"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Layers size={14} />
                {t.galleryTab}
              </button>

              <button
                onClick={() => onSelectTab("visualizer")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "visualizer"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Box size={14} />
                {t.visualizerTab}
              </button>

              <button
                onClick={() => onSelectTab("profile")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "profile"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <User size={14} />
                {t.profileTab}
              </button>
            </>
          )}

          {/* ARTIST WINDOW: Studio, Wall AR Staging & Profile */}
          {currentRole === "artist" && (
            <>
              <button
                onClick={() => onSelectTab("studio")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "studio"
                    ? "bg-[#6B7B62] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Palette size={14} />
                {t.studioTab}
              </button>

              <button
                onClick={() => onSelectTab("visualizer")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "visualizer"
                    ? "bg-[#6B7B62] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Box size={14} />
                Stage My Art
              </button>

              <button
                onClick={() => onSelectTab("profile")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "profile"
                    ? "bg-[#6B7B62] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <User size={14} />
                {t.profileTab}
              </button>
            </>
          )}

          {/* ADMIN WINDOW: Analytics & Admin Profile */}
          {currentRole === "admin" && (
            <>
              <button
                onClick={() => onSelectTab("admin")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "admin"
                    ? "bg-[#2D3748] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <BarChart3 size={14} />
                <span>HQ Analytics</span>
              </button>

              <button
                onClick={() => onSelectTab("profile")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentTab === "profile"
                    ? "bg-[#2D3748] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <User size={14} />
                <span>Admin Profile</span>
              </button>
            </>
          )}
        </nav>

        {/* =========================================================================
            RIGHT ACTIONS: Language, Cart (Buyer only), Account & Window Switcher
           ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center bg-[#E8E6E1]/80 rounded-xl p-0.5 border border-[#D6D2C4]/50">
            {(["en", "ru", "uz"] as const).map((l) => (
              <button
                key={l}
                onClick={() => onSelectLang(l)}
                className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  lang === l
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Basket Button (Visible strictly to buyers) */}
          {currentRole === "buyer" && (
            <button
              onClick={() => onSelectTab("basket")}
              className={`relative p-2 rounded-xl transition-all border cursor-pointer ${
                currentTab === "basket"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-white/90 text-neutral-800 border-neutral-200 hover:bg-neutral-100"
              }`}
              title={t.basketTab}
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6B7B62] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile & Account Window Switcher Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border shadow-xs transition-all cursor-pointer group ${
                currentTab === "profile" || isDropdownOpen
                  ? "bg-white border-[#1A1A1A] ring-2 ring-[#1A1A1A]/10"
                  : "bg-white/90 border-neutral-200 hover:border-neutral-300"
              }`}
              title="Open Role Switcher & Profile"
            >
              {user ? (
                <>
                  <img
                    src={user.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                    alt={user.first_name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-neutral-300 shrink-0"
                  />
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold text-neutral-800 block leading-tight truncate max-w-[100px]">
                      {user.first_name}
                    </span>
                    <span className="text-[10px] text-neutral-500 block leading-none">
                      {user.role === "artist" ? "Artist Account" : user.role === "admin" ? "Admin Account" : "Collector"}
                    </span>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-neutral-400 group-hover:text-neutral-700 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-[#2AABEE] text-white flex items-center justify-center">
                    <Send size={12} />
                  </div>
                  <span className="text-xs font-bold text-neutral-700 hidden sm:inline">
                    {t.profileTab}
                  </span>
                  <ChevronDown size={13} className="text-neutral-400" />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {lang === "ru" ? "Активная роль" : "Current Role"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        currentRole === "artist"
                          ? "bg-[#6B7B62]/15 text-[#6B7B62]"
                          : currentRole === "admin"
                          ? "bg-neutral-900 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {currentRole === "artist" ? "Artist" : currentRole === "admin" ? "Admin" : "Collector"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-neutral-800 mt-1 truncate">
                    {user ? `${user.first_name} ${user.last_name || ""}` : "Guest User"}
                  </p>
                </div>

                {/* Instant Switch Options */}
                <div className="p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchRole) {
                        onSwitchRole("buyer");
                      } else {
                        onSelectTab("gallery");
                      }
                      setIsDropdownOpen(false);
                      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      currentRole === "buyer"
                        ? "bg-neutral-100 text-neutral-900 font-bold"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-[#1A1A1A]" />
                      <span>{lang === "ru" ? "Коллекционер (Галерея & AR)" : "Collector (Gallery & AR)"}</span>
                    </div>
                    {currentRole === "buyer" && <Check size={14} className="text-neutral-900" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchRole) {
                        onSwitchRole("artist");
                      } else {
                        onSelectTab("studio");
                      }
                      setIsDropdownOpen(false);
                      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      currentRole === "artist"
                        ? "bg-[#6B7B62]/10 text-[#6B7B62] font-bold"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-[#6B7B62]" />
                      <span>{lang === "ru" ? "Художник (Студия 7 работ)" : "Artist Studio (7 artworks)"}</span>
                    </div>
                    {currentRole === "artist" && <Check size={14} className="text-[#6B7B62]" />}
                  </button>

                  {canAccessAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSwitchRole) {
                          onSwitchRole("admin");
                        } else {
                          onSelectTab("admin");
                        }
                        setIsDropdownOpen(false);
                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        currentRole === "admin"
                          ? "bg-neutral-900 text-white font-bold"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className={currentRole === "admin" ? "text-white" : "text-[#2D3748]"} />
                        <span>{lang === "ru" ? "Администратор (HQ Dashboard)" : "Admin HQ (Platform Metrics)"}</span>
                      </div>
                      {currentRole === "admin" && <Check size={14} className="text-white" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("warning");
                        alert(
                          lang === "ru"
                            ? `Панель администратора доступна только Telegram-пользователю @${ADMIN_TELEGRAM_USERNAME}. Все остальные аккаунты могут быть только покупателями или художниками.`
                            : `Admin account is strictly restricted to Telegram user @${ADMIN_TELEGRAM_USERNAME}. All other accounts can only be Buyer or Artist.`
                        );
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-amber-50/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Lock size={13} className="text-amber-700" />
                        <span className="text-neutral-500 group-hover:text-amber-900">
                          {lang === "ru" ? "Администратор (HQ)" : "Admin HQ"}
                        </span>
                      </div>
                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300/60 font-mono px-1.5 py-0.5 rounded font-bold">
                        @{ADMIN_TELEGRAM_USERNAME}
                      </span>
                    </button>
                  )}
                </div>

                <div className="border-t border-neutral-100 mt-1 pt-1.5 p-1.5 space-y-1">
                  {onOpenRoleSwitcher && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenRoleSwitcher();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:bg-[#6B7B62]/10 hover:text-[#6B7B62] transition-colors cursor-pointer"
                    >
                      <Sliders size={14} />
                      <span>{t.switchRole}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab("profile");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <User size={14} />
                    <span>{lang === "ru" ? "Мой профиль и настройки" : "My Profile & Settings"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{lang === "ru" ? "Аккаунт Telegram" : "Telegram Account"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>

    {/* =========================================================================
        MOBILE BOTTOM APP BAR - Ergonomic, Thumb-Reachable & High-Contrast
        (Hidden during Visualizer view so AR canvas and controls have 100% immersion)
       ========================================================================= */}
    {currentTab !== "visualizer" && (
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F9F8F6]/95 backdrop-blur-xl border-t border-[#E8E6E1] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around items-center"
      >
        {/* Buyer Mobile Tabs */}
        {currentRole === "buyer" && (
          <>
            <button
              onClick={() => {
                onSelectTab("gallery");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "gallery"
                  ? "text-[#1A1A1A] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "gallery" ? "bg-[#1A1A1A] text-white" : ""
                }`}
              >
                <Layers size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                {t.galleryTab}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab("visualizer");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "visualizer"
                  ? "text-[#1A1A1A] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "visualizer" ? "bg-[#1A1A1A] text-white" : ""
                }`}
              >
                <Box size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                {t.visualizerTab}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab("basket");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all relative ${
                currentTab === "basket"
                  ? "text-[#1A1A1A] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all relative ${
                  currentTab === "basket" ? "bg-[#1A1A1A] text-white" : ""
                }`}
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#6B7B62] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#F9F8F6]">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                {t.basketTab}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab("profile");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "profile"
                  ? "text-[#1A1A1A] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "profile" ? "bg-[#1A1A1A] text-white" : ""
                }`}
              >
                <User size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                {t.profileTab}
              </span>
            </button>
          </>
        )}

        {/* Artist Mobile Tabs */}
        {currentRole === "artist" && (
          <>
            <button
              onClick={() => {
                onSelectTab("studio");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "studio"
                  ? "text-[#6B7B62] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "studio" ? "bg-[#6B7B62] text-white" : ""
                }`}
              >
                <Palette size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                My Studio
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab("visualizer");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "visualizer"
                  ? "text-[#6B7B62] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "visualizer" ? "bg-[#6B7B62] text-white" : ""
                }`}
              >
                <Box size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                Stage Art
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab("profile");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "profile"
                  ? "text-[#6B7B62] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "profile" ? "bg-[#6B7B62] text-white" : ""
                }`}
              >
                <User size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                {t.profileTab}
              </span>
            </button>
          </>
        )}

        {/* Admin Mobile Tabs */}
        {currentRole === "admin" && (
          <>
            <button
              onClick={() => {
                onSelectTab("admin");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "admin"
                  ? "text-[#2D3748] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "admin" ? "bg-[#2D3748] text-white" : ""
                }`}
              >
                <BarChart3 size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                HQ Dashboard
              </span>
            </button>

            <button
              onClick={() => {
                onSelectTab("profile");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 rounded-2xl transition-all ${
                currentTab === "profile"
                  ? "text-[#2D3748] font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  currentTab === "profile" ? "bg-[#2D3748] text-white" : ""
                }`}
              >
                <User size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider whitespace-nowrap mt-0.5">
                Admin Profile
              </span>
            </button>
          </>
        )}
      </nav>
    )}
    </>
  );
};
