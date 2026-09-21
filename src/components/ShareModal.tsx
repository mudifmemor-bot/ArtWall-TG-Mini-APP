import React, { useState } from "react";
import {
  X,
  Send,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Artwork, Language } from "../types";
import { translations } from "../translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  artwork: Artwork | null;
  lang: Language;
  onDownloadSnapshot?: () => void;
  isCapturing?: boolean;
}

export const ShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  artwork,
  lang,
  onDownloadSnapshot,
  isCapturing,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen || !artwork) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://artwall.app";
  const shareText = `Check out "${artwork.title}" by ${artwork.artistName} (${artwork.price.toLocaleString()} UZS) on Art Wall AR! View it on your room walls in 3D:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${currentUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
  };

  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(tgUrl);
    } else {
      window.open(tgUrl, "_blank");
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${currentUrl}`)}`;
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(waUrl);
    } else {
      window.open(waUrl, "_blank");
    }
  };

  const handleShareTwitter = () => {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(twUrl);
    } else {
      window.open(twUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-800 rounded-full hover:bg-neutral-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h3 className="font-serif-custom text-2xl font-light italic text-[#1A1A1A]">
            {t.shareTitle}
          </h3>
          <p className="text-xs text-neutral-500 font-light mt-1">
            {t.shareSubtitle}
          </p>
        </div>

        {/* Artwork Card Preview */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-neutral-200 mb-5">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="w-14 h-16 rounded-xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-serif-custom text-sm font-light italic text-neutral-900 truncate">
              {artwork.title}
            </h4>
            <p className="text-[11px] text-neutral-500 truncate">
              by {artwork.artistName}
            </p>
            <span className="font-mono text-xs font-bold text-[#1A1A1A]">
              {artwork.price.toLocaleString()} UZS
            </span>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="space-y-2.5 mb-6">
          {/* Telegram */}
          <button
            onClick={handleShareTelegram}
            className="w-full py-3 px-4 rounded-2xl bg-[#2AABEE] hover:bg-[#239cdb] text-white text-xs font-bold flex items-center justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Send size={16} />
              <span>{t.shareTelegram}</span>
            </div>
            <ExternalLink size={14} className="opacity-70" />
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle size={16} />
              <span>{t.shareWhatsApp}</span>
            </div>
            <ExternalLink size={14} className="opacity-70" />
          </button>

          {/* Twitter / X */}
          <button
            onClick={handleShareTwitter}
            className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-black text-sm">𝕏</span>
              <span>{t.shareTwitter}</span>
            </div>
            <ExternalLink size={14} className="opacity-70" />
          </button>

          {/* Download Snapshot */}
          {onDownloadSnapshot && (
            <button
              onClick={onDownloadSnapshot}
              disabled={isCapturing}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-between shadow-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Download size={16} />
                <span>{isCapturing ? t.saving : t.downloadSnapshot}</span>
              </div>
            </button>
          )}
        </div>

        {/* Copy Link Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="w-full pl-3.5 pr-24 py-2.5 rounded-2xl bg-white border border-neutral-200 text-xs text-neutral-600 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="absolute right-1.5 py-1.5 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} className="text-[#6B7B62]" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
