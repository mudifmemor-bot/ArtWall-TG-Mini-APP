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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-white/80 relative flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-neutral-600 hover:text-black bg-white/80 backdrop-blur-md rounded-full hover:bg-white shadow-sm transition-colors"
        >
          <X size={18} />
        </button>

        {/* Artwork Image Container */}
        <div className="w-full md:w-1/2 bg-[#E8E6E1] relative flex items-center justify-center min-h-[280px] md:min-h-[460px] p-6">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="max-h-[360px] md:max-h-[420px] w-auto max-w-full object-contain shadow-2xl rounded-sm"
          />
          {artwork.featured && (
            <span className="absolute top-4 left-4 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles size={11} className="text-amber-400" /> Featured
            </span>
          )}
        </div>

        {/* Details & Actions */}
        <div className="w-full md:w-1/2 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Artist Header */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={artwork.artistAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                  alt={artwork.artistName}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-300"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-800 block leading-tight">
                    {artwork.artistName}
                  </span>
                  {artwork.artistUsername && (
                    <span className="text-[11px] text-[#2AABEE] font-medium flex items-center gap-1">
                      @{artwork.artistUsername}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleLike(artwork.id)}
                  className={`p-2 rounded-xl border transition-all ${
                    isLiked
                      ? "bg-rose-50 border-rose-200 text-rose-500"
                      : "bg-white border-neutral-200 text-neutral-500 hover:text-rose-500"
                  }`}
                  title={t.like}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => onShare(artwork)}
                  className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors"
                  title={t.share}
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <h2 className="font-serif-custom text-2xl font-light italic tracking-tight text-[#1A1A1A] mb-1">
              {artwork.title}
            </h2>

            <div className="text-2xl font-bold font-mono text-[#1A1A1A] mb-4">
              ${artwork.price.toLocaleString()} USD
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6 font-light">
              {artwork.description}
            </p>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-2 bg-[#E8E6E1]/50 p-3.5 rounded-2xl border border-[#D6D2C4]/40 text-xs mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  {t.dimensions}
                </span>
                <span className="font-medium text-neutral-800">
                  {artwork.width} × {artwork.height} cm
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  {t.medium}
                </span>
                <span className="font-medium text-neutral-800">
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

          {/* Action CTAs */}
          <div className="space-y-2 pt-2 border-t border-[#E8E6E1]">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onViewOnWall(artwork)}
                className="py-3 px-4 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Box size={16} />
                {t.viewOnWall}
              </button>

              <button
                onClick={() => onAddToBasket(artwork)}
                className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  isInBasket
                    ? "bg-[#6B7B62] text-white border-[#6B7B62]"
                    : "bg-white hover:bg-neutral-50 text-[#1A1A1A] border-neutral-300"
                }`}
              >
                {isInBasket ? (
                  <>
                    <Check size={16} />
                    {t.inBasket}
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    {t.addToBasket}
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleContactArtist}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-[#2AABEE]/30"
            >
              <Send size={14} />
              {t.contactArtist}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
