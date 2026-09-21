import React from "react";
import { X, Heart, ShoppingBag, Box, Send, Share2, Check, Sparkles } from "lucide-react";
import { Artwork, Language } from "../types";
import { translations } from "../translations";

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
  lang: Language;
  isLiked: boolean;
  onToggleLike: (id: string) => void;
  onAddToBasket: (artwork: Artwork) => void;
  isInBasket: boolean;
  onViewOnWall: (artwork: Artwork) => void;
  onShare: (artwork: Artwork) => void;
  onViewArtistProfile?: (artwork: Artwork) => void;
}

export const ArtworkDetailModal: React.FC<Props> = ({
  artwork,
  onClose,
  lang,
  isLiked,
  onToggleLike,
  onAddToBasket,
  isInBasket,
  onViewOnWall,
  onShare,
  onViewArtistProfile,
}) => {
  const t = translations[lang];

  if (!artwork) return null;

  const handleContactArtist = () => {
    const handle = artwork.artistUsername || "artwall_bot";
    const text = encodeURIComponent(
      `Hello ${artwork.artistName}! I found your artwork "${artwork.title}" on Art Wall AR and would like to inquire about it.`
    );
    const tgUrl = `https://t.me/${handle}?text=${text}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(tgUrl);
    } else {
      window.open(tgUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-3xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/80 relative flex flex-col md:flex-row max-h-[92vh] sm:max-h-[90vh]">
        {/* Close Button - 44px hit target */}
        <button
          onClick={() => {
            onClose();
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
          }}
          className="absolute top-3.5 right-3.5 z-20 w-11 h-11 text-neutral-600 hover:text-black bg-white/90 backdrop-blur-md rounded-full hover:bg-white shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Artwork Image Container */}
        <div className="w-full md:w-1/2 bg-[#E8E6E1] relative flex items-center justify-center min-h-[260px] md:min-h-[460px] p-6">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="max-h-[300px] md:max-h-[420px] w-auto max-w-full object-contain shadow-2xl rounded-sm"
          />
          {artwork.featured && (
            <span className="absolute top-4 left-4 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles size={11} className="text-amber-400" /> Featured
            </span>
          )}
        </div>

        {/* Details & Actions */}
        <div className="w-full md:w-1/2 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Artist Header */}
            <div className="flex items-center justify-between gap-3 mb-3 pr-10 md:pr-0">
              <div
                onClick={() => {
                  if (onViewArtistProfile) {
                    onViewArtistProfile(artwork);
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                  }
                }}
                className={`flex items-center gap-2.5 min-w-0 ${
                  onViewArtistProfile ? "cursor-pointer hover:opacity-85" : ""
                }`}
                title="View Artist Profile"
              >
                <img
                  src={artwork.artistAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                  alt={artwork.artistName}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-neutral-300 shrink-0"
                />
                <div className="min-w-0 truncate">
                  <span className="text-xs font-bold text-neutral-800 block leading-tight truncate hover:underline">
                    {artwork.artistName}
                  </span>
                  {artwork.artistUsername && (
                    <span className="text-[11px] text-[#2AABEE] font-semibold flex items-center gap-1 truncate">
                      @{artwork.artistUsername}
                    </span>
                  )}
                </div>
              </div>

              {/* Like & Share - 44px min targets */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onToggleLike(artwork.id);
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                  }}
                  className={`min-w-[44px] min-h-[44px] rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                    isLiked
                      ? "bg-rose-50 border-rose-200 text-rose-500 shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-600 hover:text-rose-500"
                  }`}
                  title={t.like}
                  aria-label={t.like}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => {
                    onShare(artwork);
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                  }}
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                  title={t.share}
                  aria-label={t.share}
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <h2 className="font-serif-custom text-2xl font-light italic tracking-tight text-[#1A1A1A] mb-1">
              {artwork.title}
            </h2>

            <div className="text-xl sm:text-2xl font-bold font-mono text-[#1A1A1A] mb-3">
              {artwork.price.toLocaleString()} UZS
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-5 font-light">
              {artwork.description}
            </p>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-2 bg-[#E8E6E1]/50 p-3.5 rounded-2xl border border-[#D6D2C4]/40 text-xs mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  {t.dimensions}
                </span>
                <span className="font-mono font-medium text-neutral-800">
                  {artwork.width} × {artwork.height} cm
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  {t.medium}
                </span>
                <span className="font-medium text-neutral-800 truncate block">
                  {artwork.medium}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  {t.status}
                </span>
                <span className="font-medium text-[#6B7B62] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B7B62]" />
                  {t.available}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Style
                </span>
                <span className="font-medium text-neutral-800 capitalize">
                  {artwork.category}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs - Generous 46-48px Touch Targets & Safe Area */}
          <div className="space-y-2 pt-3 border-t border-[#E8E6E1] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  onViewOnWall(artwork);
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                }}
                className="min-h-[48px] py-3 px-3.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Box size={16} />
                <span>{t.viewOnWall}</span>
              </button>

              <button
                onClick={() => {
                  onAddToBasket(artwork);
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
                }}
                className={`min-h-[48px] py-3 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${
                  isInBasket
                    ? "bg-[#6B7B62] text-white border-[#6B7B62] shadow-xs"
                    : "bg-white hover:bg-neutral-50 text-[#1A1A1A] border-neutral-300"
                }`}
              >
                {isInBasket ? (
                  <>
                    <Check size={16} />
                    <span>{t.inBasket}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>{t.addToBasket}</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                handleContactArtist();
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-[#2AABEE]/30 cursor-pointer active:scale-95"
            >
              <Send size={15} />
              <span>{t.contactArtist}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
