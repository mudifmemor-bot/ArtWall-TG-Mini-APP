import React from "react";
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
} from "lucide-react";
import { Language, TelegramUser } from "../types";
import { translations } from "../translations";

interface Props {
  currentTab: "gallery" | "visualizer" | "studio" | "basket" | "admin";
  onSelectTab: (tab: "gallery" | "visualizer" | "studio" | "basket" | "admin") => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  user: TelegramUser | null;
  onOpenAuth: () => void;
  cartCount: number;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  lang,
  onSelectLang,
  user,
  onOpenAuth,
  cartCount,
}) => {
  const t = translations[lang];
  const currentRole: "buyer" | "artist" | "admin" = user?.role || "buyer";

  return (
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
          {/* BUYER WINDOW: Only Gallery & Wall AR */}
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
            </>
          )}

          {/* ARTIST WINDOW: Only My Studio & Wall AR Staging */}
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
            </>
          )}

          {/* ADMIN WINDOW: Single Dedicated Analytics Window */}
          {currentRole === "admin" && (
            <div className="px-4 py-1.5 flex items-center gap-2 text-xs font-bold text-neutral-700">
              <BarChart3 size={15} className="text-[#2D3748]" />
              <span>Platform KPI Overview & Analytics</span>
            </div>
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

          {/* User Profile & Account Window Switcher Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/90 border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
            title="Manage Account or Switch Window Role"
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
                <span className="text-[10px] text-neutral-400 group-hover:text-neutral-700 hidden sm:inline ml-0.5">
                  ▾
                </span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-[#2AABEE] text-white flex items-center justify-center">
                  <Send size={12} />
                </div>
                <span className="text-xs font-bold text-neutral-700 hidden sm:inline">
                  {t.signInWithTelegram}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE NAVIGATION - Role-Gated Sub Navigation (No Leaked Cross-Tabs)
         ========================================================================= */}
      <div className="md:hidden flex border-t border-[#E8E6E1] bg-white/95 px-2 py-1.5 justify-around">
        {/* Buyer Mobile Tabs */}
        {currentRole === "buyer" && (
          <>
            <button
              onClick={() => onSelectTab("gallery")}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                currentTab === "gallery" ? "text-[#1A1A1A]" : "text-neutral-400"
              }`}
            >
              <Layers size={16} />
              <span>{t.galleryTab}</span>
            </button>

            <button
              onClick={() => onSelectTab("visualizer")}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                currentTab === "visualizer" ? "text-[#1A1A1A]" : "text-neutral-400"
              }`}
            >
              <Box size={16} />
              <span>{t.visualizerTab}</span>
            </button>

            <button
              onClick={() => onSelectTab("basket")}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider relative ${
                currentTab === "basket" ? "text-[#1A1A1A]" : "text-neutral-400"
              }`}
            >
              <ShoppingBag size={16} />
              <span>{t.basketTab}</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-2 w-3.5 h-3.5 rounded-full bg-[#6B7B62] text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAuth}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              <User size={16} />
              <span>{t.profileTab}</span>
            </button>
          </>
        )}

        {/* Artist Mobile Tabs */}
        {currentRole === "artist" && (
          <>
            <button
              onClick={() => onSelectTab("studio")}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                currentTab === "studio" ? "text-[#6B7B62]" : "text-neutral-400"
              }`}
            >
              <Palette size={16} />
              <span>My Studio</span>
            </button>

            <button
              onClick={() => onSelectTab("visualizer")}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                currentTab === "visualizer" ? "text-[#6B7B62]" : "text-neutral-400"
              }`}
            >
              <Box size={16} />
              <span>Stage Art</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              <User size={16} />
              <span>{t.profileTab}</span>
            </button>
          </>
        )}

        {/* Admin Mobile Tabs */}
        {currentRole === "admin" && (
          <>
            <button
              onClick={() => onSelectTab("admin")}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                currentTab === "admin" ? "text-[#2D3748]" : "text-neutral-400"
              }`}
            >
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-neutral-400"
            >
              <User size={16} />
              <span>{t.profileTab}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
