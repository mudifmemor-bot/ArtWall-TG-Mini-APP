import React from "react";
import {
  Palette,
  ShoppingBag,
  Layers,
  Box,
  User,
  Send,
  Sparkles,
} from "lucide-react";
import { Language, TelegramUser } from "../types";
import { translations } from "../translations";

interface Props {
  currentTab: "gallery" | "visualizer" | "studio" | "basket";
  onSelectTab: (tab: "gallery" | "visualizer" | "studio" | "basket") => void;
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

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F9F8F6]/90 backdrop-blur-md border-b border-[#E8E6E1] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab("gallery")}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-serif-custom italic font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              A
            </div>
            <div>
              <span className="font-serif-custom text-lg sm:text-xl font-medium tracking-tight text-[#1A1A1A] block leading-none">
                {t.appTitle}
              </span>
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide hidden sm:block">
                TG Mini App & AR Gallery
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#E8E6E1]/70 p-1 rounded-2xl">
          <button
            onClick={() => onSelectTab("gallery")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              currentTab === "gallery"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Layers size={14} />
            {t.galleryTab}
          </button>

          <button
            onClick={() => onSelectTab("visualizer")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              currentTab === "visualizer"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Box size={14} />
            {t.visualizerTab}
          </button>

          <button
            onClick={() => onSelectTab("studio")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 relative ${
              currentTab === "studio"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Palette size={14} />
            {t.studioTab}
            {user?.role === "artist" && (
              <span className="w-2 h-2 rounded-full bg-[#6B7B62]" />
            )}
          </button>
        </nav>

        {/* Right Actions: Lang, Cart, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-[#E8E6E1]/80 rounded-xl p-0.5 border border-[#D6D2C4]/50">
            {(["en", "ru", "uz"] as const).map((l) => (
              <button
                key={l}
                onClick={() => onSelectLang(l)}
                className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                  lang === l
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Basket Button */}
          <button
            onClick={() => onSelectTab("basket")}
            className={`relative p-2 rounded-xl transition-all border ${
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

          {/* Telegram User / Login */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/90 border border-neutral-200 hover:border-neutral-300 shadow-xs transition-all"
          >
            {user ? (
              <>
                <img
                  src={user.photo_url}
                  alt={user.first_name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-[#6B7B62]/30"
                />
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-neutral-800 block leading-tight">
                    {user.first_name}
                  </span>
                  <span className="text-[10px] text-neutral-500 block leading-none capitalize">
                    {user.role === "artist" ? t.artistRole : t.buyerRole}
                  </span>
                </div>
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

      {/* Mobile Sub Navigation Bar */}
      <div className="md:hidden flex border-t border-[#E8E6E1] bg-white/95 px-3 py-1.5 justify-around">
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
          onClick={() => onSelectTab("studio")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider relative ${
            currentTab === "studio" ? "text-[#1A1A1A]" : "text-neutral-400"
          }`}
        >
          <Palette size={16} />
          <span>{t.studioTab}</span>
          {user?.role === "artist" && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#6B7B62]" />
          )}
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
      </div>
    </header>
  );
};
