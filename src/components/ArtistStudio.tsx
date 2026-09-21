import React, { useState } from "react";
import {
  Upload,
  Plus,
  Box,
  Share2,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  Send,
  Eye,
  Camera,
  Layers,
  AlertCircle,
  Info,
  Heart,
  ShoppingBag,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { Artwork, TelegramUser, Language, MAX_ARTIST_UPLOADS } from "../types";
import { translations } from "../translations";

interface Props {
  user: TelegramUser | null;
  artworks: Artwork[];
  lang: Language;
  onOpenAuth: () => void;
  onAddArtwork: (artwork: Artwork) => void;
  onDeleteArtwork: (id: string) => void;
  onViewOnWall: (artwork: Artwork, initialRoom?: string) => void;
  onShare: (artwork: Artwork) => void;
}

export const ArtistStudio: React.FC<Props> = ({
  user,
  artworks,
  lang,
  onOpenAuth,
  onAddArtwork,
  onDeleteArtwork,
  onViewOnWall,
  onShare,
}) => {
  const t = translations[lang];

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(550);
  const [width, setWidth] = useState<number>(60);
  const [height, setHeight] = useState<number>(80);
  const [medium, setMedium] = useState("Oil & mixed media on Belgian linen");
  const [category, setCategory] = useState<Artwork["category"]>("abstract");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [frameMaterial, setFrameMaterial] = useState<"solid" | "wood" | "metal" | "pattern">("wood");
  const [frameColor, setFrameColor] = useState("#D6B996");
  const [publishedToast, setPublishedToast] = useState(false);
  const [showQuotaNotice, setShowQuotaNotice] = useState(false);

  // Filter artworks created strictly by this artist
  const isMyArtwork = (a: Artwork) => {
    if (!user) return true;
    if (user.id && String(a.artistId) === String(user.id)) return true;
    if (user.username && a.artistUsername && a.artistUsername.toLowerCase() === user.username.toLowerCase()) return true;
    const fullName = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`.trim().toLowerCase();
    if (a.artistName && a.artistName.toLowerCase() === fullName) return true;
    // Default fallback for demo artist Elena Rostova
    if ((user.username === "elena_art_studio" || user.first_name.toLowerCase().includes("elena")) &&
        (a.artistId === "artist-1" || a.artistUsername === "elena_art_studio")) {
      return true;
    }
    return false;
  };

  const artistWorks = artworks.filter(isMyArtwork);

  // Calculate real-time metrics strictly for THIS artist's artworks
  const totalMyViews = artistWorks.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const totalMyLikes = artistWorks.reduce((acc, a) => acc + (a.likesCount || 0), 0);
  const totalMyInBasket = artistWorks.reduce((acc, a) => acc + (a.inBasketCount || 0), 0);
  const totalMyArTries = artistWorks.reduce((acc, a) => acc + (a.arTriesCount || 0), 0);
  const totalMyPortfolioValue = artistWorks.reduce((acc, a) => acc + (a.price || 0), 0);

  const isUploadLimitReached = artistWorks.length >= MAX_ARTIST_UPLOADS;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sampleImages = [
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl && !imagePreview) return;
    if (isUploadLimitReached) return;

    const newArt: Artwork = {
      id: `artist-art-${Date.now()}`,
      title: title.trim() || "Untitled Composition",
      artistId: user?.id ? String(user.id) : "artist-me",
      artistName: user ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}` : "Elena Rostova",
      artistUsername: user?.username || "elena_art_studio",
      artistAvatar: user?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      imageUrl: imagePreview || imageUrl,
      price: Number(price) || 450,
      width: Number(width) || 60,
      height: Number(height) || 80,
      medium: medium.trim() || "Oil on canvas",
      description: description.trim() || "Original studio piece ready for interior staging.",
      category,
      likesCount: 1,
      viewsCount: 12,
      arTriesCount: 3,
      inBasketCount: 0,
      isAvailable: true,
      defaultFrameColor: frameColor,
      defaultFrameMaterial: frameMaterial,
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
    };

    onAddArtwork(newArt);
    setShowUploadModal(false);
    setPublishedToast(true);
    setTimeout(() => setPublishedToast(false), 4000);

    // Reset form
    setTitle("");
    setDescription("");
    setImagePreview(null);
    setImageUrl("");

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* Success Toast */}
      {publishedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-in slide-in-from-bottom-4">
          <CheckCircle2 size={20} className="text-[#6B7B62]" />
          <span className="text-xs font-bold">{t.artworkPublished}</span>
        </div>
      )}

      {/* Artist Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E6E1] shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={user?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
            alt="Artist Avatar"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-[#6B7B62]/30 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-serif-custom text-2xl sm:text-3xl font-light italic tracking-tight text-[#1A1A1A]">
                {user ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}` : "Elena Rostova"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2AABEE]/15 text-[#2AABEE] text-[10px] font-bold flex items-center gap-1">
                <Send size={11} /> {user?.username ? `@${user.username}` : "@elena_art_studio"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 font-light max-w-xl mb-2">
              {user?.bio || "Creating contemporary tactile abstractions and spatial dialogue for modern architecture."}
            </p>
            <span className="text-[11px] text-neutral-400 font-mono block">
              📍 {user?.location || "Tashkent, Uzbekistan"}
            </span>
          </div>
        </div>

        {/* Quota & Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-end">
          {/* Quota Progress Tracker */}
          <div className="bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200 min-w-[180px]">
            <div className="flex justify-between text-[11px] font-bold text-neutral-700 mb-1">
              <span>{t.artworkQuota}</span>
              <span className="font-mono text-[#6B7B62]">
                {artistWorks.length} / {MAX_ARTIST_UPLOADS}
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isUploadLimitReached ? "bg-amber-500" : "bg-[#6B7B62]"
                }`}
                style={{ width: `${Math.min(100, (artistWorks.length / MAX_ARTIST_UPLOADS) * 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-400 mt-1 block">
              {t.upTo7}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenAuth();
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer active:scale-95"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                if (isUploadLimitReached) {
                  setShowQuotaNotice(true);
                  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("warning");
                } else {
                  setShowUploadModal(true);
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                }
              }}
              className={`min-h-[44px] py-2.5 px-4 sm:px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                isUploadLimitReached
                  ? "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                  : "bg-[#1A1A1A] hover:bg-black text-white hover:scale-105"
              }`}
              title={isUploadLimitReached ? t.uploadLimitReached : undefined}
            >
              <Plus size={16} />
              <span>{t.uploadNewArtwork}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats of My Artworks Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-[#6B7B62]" />
            <h2 className="font-serif-custom text-xl font-light italic text-[#1A1A1A]">
              My Artworks Performance & Stats
            </h2>
          </div>
          <span className="text-xs text-neutral-500">
            Real-time engagement across your {artistWorks.length} artworks
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-[11px] font-medium">Views on My Art</span>
              <Eye size={15} className="text-neutral-600" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#1A1A1A]">
              {totalMyViews.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-400">Total catalog impressions</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-[11px] font-medium">Collector Likes</span>
              <Heart size={15} className="text-rose-500 fill-rose-50" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-rose-600">
              {totalMyLikes.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-400">Saved to favorites</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-[11px] font-medium">In Collector Baskets</span>
              <ShoppingBag size={15} className="text-emerald-600" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-700">
              {totalMyInBasket.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-400">High purchase intent</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-[11px] font-medium">AR Wall Tries</span>
              <Layers size={15} className="text-[#2AABEE]" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#2AABEE]">
              {totalMyArTries.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-400">Virtual wall simulations</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E8E6E1] shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-neutral-500 mb-1.5">
              <span className="text-[11px] font-medium">My Portfolio Value</span>
              <TrendingUp size={15} className="text-amber-600" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#1A1A1A]">
              ${totalMyPortfolioValue.toLocaleString()}
            </div>
            <span className="text-[10px] text-neutral-400">Listed artwork total</span>
          </div>
        </div>
      </div>

      {/* Upload Quota Alert Banner if limit is reached */}
      {isUploadLimitReached && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Info size={20} className="text-amber-600 shrink-0" />
          <span>{t.uploadLimitReached}</span>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-neutral-200 pb-4">
              <div>
                <h2 className="font-serif-custom text-2xl font-light italic text-[#1A1A1A]">
                  {t.uploadNewArtwork}
                </h2>
                <p className="text-xs text-neutral-500">
                  Add artwork details, dimensions, and framing preview preferences ({artistWorks.length + 1} of {MAX_ARTIST_UPLOADS}).
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Image Upload Area */}
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  {t.uploadImageFile}
                </label>
                <div className="border-2 border-dashed border-neutral-300 hover:border-[#6B7B62] rounded-2xl p-4 sm:p-6 bg-white flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative overflow-hidden group">
                  {imagePreview ? (
                    <div className="relative max-h-48 w-full flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-44 object-contain rounded-lg shadow-md"
                      />
                      <span className="absolute bottom-2 bg-black/70 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-xs font-medium">
                        Change image
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-[#6B7B62] flex items-center justify-center">
                        <Upload size={22} />
                      </div>
                      <span className="font-medium text-neutral-800 text-sm">
                        Click or drag high-resolution artwork here
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        PNG, JPG, WEBP up to 25MB
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* Or choose demo stock artwork */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Or select sample:
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {sampleImages.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImagePreview(src);
                          setImageUrl(src);
                        }}
                        className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-300 hover:scale-110 transition-transform shrink-0"
                      >
                        <img src={src} alt="sample" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-neutral-700 block mb-1">
                    {t.artworkTitle}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Whispers of Sunset"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs sm:text-sm focus:ring-2 focus:ring-[#6B7B62] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-medium text-neutral-700 block mb-1">
                    {t.artworkPrice}
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="650"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs sm:text-sm focus:ring-2 focus:ring-[#6B7B62] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Standard Dimension Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-neutral-600 text-[11px]">
                    Quick Canvas Presets (cm):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { w: 40, h: 50, label: "40×50" },
                    { w: 50, h: 70, label: "50×70" },
                    { w: 60, h: 80, label: "60×80" },
                    { w: 70, h: 90, label: "70×90" },
                    { w: 80, h: 100, label: "80×100" },
                    { w: 100, h: 120, label: "100×120" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setWidth(preset.w);
                        setHeight(preset.h);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all ${
                        width === preset.w && height === preset.h
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-neutral-700 block mb-1">
                    {t.artworkWidth}
                  </label>
                  <input
                    type="number"
                    required
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 font-mono text-xs focus:ring-2 focus:ring-[#6B7B62] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-medium text-neutral-700 block mb-1">
                    {t.artworkHeight}
                  </label>
                  <input
                    type="number"
                    required
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 font-mono text-xs focus:ring-2 focus:ring-[#6B7B62] focus:outline-none"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="font-medium text-neutral-700 block mb-1">
                    {t.artworkCategory}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-[#6B7B62] focus:outline-none capitalize"
                  >
                    <option value="abstract">{t.abstract}</option>
                    <option value="modern">{t.modern}</option>
                    <option value="landscape">{t.landscape}</option>
                    <option value="minimalist">{t.minimalist}</option>
                    <option value="portrait">{t.portrait}</option>
                    <option value="classic">{t.classic}</option>
                  </select>
                </div>
              </div>

              {/* Medium & Description */}
              <div>
                <label className="font-medium text-neutral-700 block mb-1">
                  {t.artworkMedium}
                </label>
                <input
                  type="text"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  placeholder="e.g. Oil on Belgian linen, acrylic glaze"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-[#6B7B62] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-neutral-700 block mb-1">
                  {t.artworkDesc}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell collectors the narrative behind this artwork..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-[#6B7B62] focus:outline-none resize-none"
                />
              </div>

              {/* Frame Defaults */}
              <div className="bg-[#E8E6E1]/50 p-3 rounded-2xl border border-[#D6D2C4]/40">
                <span className="font-bold text-neutral-700 block mb-2">
                  Recommended Staging Frame
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {(["wood", "metal", "solid", "pattern"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFrameMaterial(m)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize ${
                          frameMaterial === m
                            ? "bg-[#1A1A1A] text-white"
                            : "bg-white text-neutral-700 border border-neutral-200"
                        }`}
                      >
                        {t[m as keyof typeof t]}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {["#000000", "#D6B996", "#4A3728", "#FFFFFF"].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setFrameColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full border border-black/20 ${
                          frameColor === hex ? "ring-2 ring-[#6B7B62] scale-110" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={!imagePreview && !imageUrl}
                  className="w-full py-3.5 rounded-2xl bg-[#1A1A1A] hover:bg-black disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} className="text-amber-300" />
                  {t.submitArtwork}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Artworks List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-custom text-2xl font-light italic text-[#1A1A1A]">
            {t.myArtworks} ({artistWorks.length} / {MAX_ARTIST_UPLOADS})
          </h2>
          <span className="text-xs text-neutral-500">
            Preview angles, room staging, and share with collectors
          </span>
        </div>

        {artistWorks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <ImageIcon size={26} />
            </div>
            <h3 className="font-serif-custom text-xl font-light italic text-[#1A1A1A] mb-1">
              {t.noUploadsYet}
            </h3>
            <p className="text-xs text-neutral-500 mb-5 font-light">
              Upload your first artwork (up to {MAX_ARTIST_UPLOADS} in early access) to stage in modern rooms or on walls and share direct links with your Telegram audience.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="py-2.5 px-5 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
            >
              <Plus size={15} />
              {t.uploadNewArtwork}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artistWorks.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-3xl p-5 border border-[#E8E6E1] shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all"
              >
                <div>
                  {/* Image & Quick Room Staging Badges */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 mb-4">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Staging Room Fast Launchers */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 p-1.5 bg-black/65 backdrop-blur-md rounded-xl text-white">
                      <span className="text-[10px] font-bold px-1 flex items-center gap-1">
                        <Layers size={11} /> Stage:
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onViewOnWall(art, "living-room")}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/40 text-[9px] font-medium"
                          title="Living Room"
                        >
                          Living
                        </button>
                        <button
                          onClick={() => onViewOnWall(art, "home-office")}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/40 text-[9px] font-medium"
                          title="Home Office"
                        >
                          Office
                        </button>
                        <button
                          onClick={() => onViewOnWall(art, "bedroom")}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/40 text-[9px] font-medium"
                          title="Bedroom"
                        >
                          Bed
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-serif-custom text-lg font-light italic text-[#1A1A1A] truncate">
                      {art.title}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                      ${art.price}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-500 mb-3 font-mono">
                    {art.width} × {art.height} cm • {art.medium}
                  </p>

                  {/* Artwork Individual Engagement Stats */}
                  <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-[#F9F8F6] border border-[#E8E6E1] mb-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-neutral-400 flex items-center gap-0.5">
                        <Eye size={10} /> Views
                      </span>
                      <span className="font-mono text-xs font-bold text-neutral-800">
                        {art.viewsCount || 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-neutral-400 flex items-center gap-0.5">
                        <Heart size={10} className="text-rose-400" /> Likes
                      </span>
                      <span className="font-mono text-xs font-bold text-rose-600">
                        {art.likesCount || 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-neutral-400 flex items-center gap-0.5">
                        <Layers size={10} className="text-[#2AABEE]" /> AR
                      </span>
                      <span className="font-mono text-xs font-bold text-[#2AABEE]">
                        {art.arTriesCount || 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-neutral-400 flex items-center gap-0.5">
                        <ShoppingBag size={10} className="text-emerald-500" /> Cart
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        {art.inBasketCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onViewOnWall(art);
                      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                    }}
                    className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Box size={15} />
                    <span>{t.stageAndShare}</span>
                  </button>

                  <button
                    onClick={() => {
                      onShare(art);
                      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                    }}
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    title={t.share}
                    aria-label={t.share}
                  >
                    <Share2 size={16} />
                  </button>

                  <button
                    onClick={() => {
                      onDeleteArtwork(art.id);
                      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
                    }}
                    className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                    title="Delete"
                    aria-label="Delete artwork"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quota Limit Notice Modal */}
      {showQuotaNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/80 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="font-serif-custom text-xl font-bold text-[#1A1A1A] mb-2">
              Early Access Limit Reached
            </h3>
            <p className="text-xs text-neutral-600 mb-5 leading-relaxed">
              {t.uploadLimitReached}
            </p>
            <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700 text-[11px] mb-5">
              Current slots: <strong>{artistWorks.length} of {MAX_ARTIST_UPLOADS} artworks</strong> active in your Telegram portfolio.
            </div>
            <button
              onClick={() => setShowQuotaNotice(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {t.gotIt}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
