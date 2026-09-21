import React, { useState } from "react";
import {
  X,
  Trash2,
  Send,
  ShoppingBag,
  Box,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { CartItem, Language, TelegramUser } from "../types";
import { translations } from "../translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (artworkId: string) => void;
  onClearBasket: () => void;
  lang: Language;
  onViewOnWall: (item: CartItem) => void;
  user: TelegramUser | null;
}

export const BasketDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearBasket,
  lang,
  onViewOnWall,
  user,
}) => {
  const t = translations[lang];
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.artwork.price, 0);

  const handleTelegramCheckout = () => {
    if (items.length === 0) return;

    // Create itemized order summary for Telegram
    const orderLines = items.map(
      (item, idx) =>
        `${idx + 1}. "${item.artwork.title}" by ${item.artwork.artistName} - $${item.artwork.price} (${item.selectedWidth}x${item.selectedHeight}cm, ${item.frameMaterial} frame)`
    );

    const buyerName = user ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""} (@${user.username || "collector"})` : "Telegram Collector";

    const text = encodeURIComponent(
      `🎨 *Art Wall AR - New Artwork Order Inquiry*\n\n` +
      `👤 Buyer: ${buyerName}\n` +
      `📦 Items:\n${orderLines.join("\n")}\n\n` +
      `💰 Total: $${subtotal.toLocaleString()} USD\n` +
      `✨ Delivery & Framing Included\n\nPlease confirm availability and payment details.`
    );

    // Primary artist username from the first item
    const artistHandle = items[0]?.artwork.artistUsername || "artwall_bot";
    const tgUrl = `https://t.me/${artistHandle}?text=${text}`;

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(tgUrl);
    } else {
      window.open(tgUrl, "_blank");
    }

    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      onClearBasket();
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 sm:p-7 relative border-l border-neutral-200 overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="font-serif-custom text-xl font-light italic text-[#1A1A1A]">
                  {t.yourBasket}
                </h2>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {items.length} {items.length === 1 ? "artwork" : "artworks"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {checkoutSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle size={22} className="text-emerald-600 shrink-0" />
              <span>{t.orderSuccess}</span>
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <ShoppingBag size={28} />
              </div>
              <h3 className="font-serif-custom text-xl font-light italic text-neutral-800 mb-1">
                {t.emptyBasket}
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-6 font-light">
                {t.emptyBasketSub}
              </p>
              <button
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.artwork.id}
                  className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-3 group"
                >
                  <img
                    src={item.artwork.imageUrl}
                    alt={item.artwork.title}
                    className="w-16 h-20 rounded-xl object-cover shrink-0 bg-neutral-100"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif-custom text-base font-light italic text-[#1A1A1A] truncate">
                      {item.artwork.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate">
                      by {item.artwork.artistName}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {item.selectedWidth}×{item.selectedHeight} cm • {item.frameMaterial} frame
                    </p>
                    <span className="font-mono text-xs font-bold text-[#1A1A1A] block mt-1">
                      ${item.artwork.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onViewOnWall(item);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                      title={t.viewOnWall}
                    >
                      <Box size={14} />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.artwork.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition-colors"
                      title={t.removeItem}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="pt-6 border-t border-neutral-200 mt-6 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>{t.subtotal}</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">
                  ${subtotal.toLocaleString()} USD
                </span>
              </div>
              <div className="flex justify-between text-neutral-400 text-[11px]">
                <span>Shipping & bespoke framing</span>
                <span className="text-[#6B7B62] font-medium">Free</span>
              </div>
            </div>

            <button
              onClick={handleTelegramCheckout}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#2AABEE] hover:bg-[#2299d4] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#2AABEE]/25 transition-all cursor-pointer"
            >
              <Send size={16} />
              {t.checkoutTelegram}
            </button>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const orderLines = items.map(
                    (item, idx) =>
                      `${idx + 1}. "${item.artwork.title}" by ${item.artwork.artistName} - $${item.artwork.price} (${item.selectedWidth}x${item.selectedHeight}cm, ${item.frameMaterial} frame)`
                  );
                  const buyerName = user ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""} (@${user.username || "collector"})` : "Telegram Collector";
                  const rawText = `Art Wall AR - New Artwork Order Inquiry\nBuyer: ${buyerName}\nItems:\n${orderLines.join("\n")}\nTotal: $${subtotal.toLocaleString()} USD\nDelivery & Framing Included`;
                  navigator.clipboard.writeText(rawText);
                  if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                  }
                  setCheckoutSuccess(true);
                  setTimeout(() => setCheckoutSuccess(false), 2500);
                }}
                className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium transition-colors text-center cursor-pointer"
              >
                Copy Order Text to Clipboard
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
              <ShieldCheck size={12} className="text-[#6B7B62]" />
              <span>Direct secure artist transaction via Telegram</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
