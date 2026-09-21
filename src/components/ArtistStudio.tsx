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
} from "lucide-react";
import { Artwork, TelegramUser, Language } from "../types";
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

  // Filter artworks created by this artist (or all if simulated artist)
  const artistWorks = artworks.filter(
    (a) => !user?.username || a.artistUsername === user.username || a.artistName === user.first_name + (user.last_name ? ` ${user.last_name}` : "")
  );

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

    const newArt: Artwork = {
      id: `artist-art-${Date.now()}`,
      title: title.trim() || "Untitled Composition",
      artistId: user?.id ? String(user.id) : "artist-me",
      artistName: user ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}` : "Studio Artist",
      artistUsername: user?.username || "telegram_artist",
      artistAvatar: user?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      imageUrl: imagePreview || imageUrl,
      price: Number(price) || 450,
      width: Number(width) || 60,
      height: Number(height) || 80,
      medium: medium.trim() || "Oil on canvas",
      description: description.trim() || "Original studio piece ready for interior staging.",
      category,
      likesCount: 1,
      isAvailable: true,
      defaultFrameColor: frameColor,
      defaultFrameMaterial: frameMaterial,
      year: new Date().getFullYear(),
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

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onOpenAuth}
            className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="py-2.5 px-5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            <Plus size={16} />
            {t.uploadNewArtwork}
          </button>
        </div>
      </div>

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
                  Add artwork details, dimensions, and framing preview preferences.
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
            {t.myArtworks} ({artistWorks.length})
          </h2>
          <span className="text-xs text-neutral-500">
            Preview angles, room staging, and share
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
              Upload your first artwork to test in modern rooms and share direct 3D visualizer links with your Telegram audience.
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
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 p-1 bg-black/60 backdrop-blur-md rounded-xl text-white">
                      <span className="text-[10px] font-bold px-1.5">
                        Stage in:
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onViewOnWall(art, "living-room")}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/40 text-[9px] font-medium"
                        >
                          Living
                        </button>
                        <button
                          onClick={() => onViewOnWall(art, "home-office")}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/40 text-[9px] font-medium"
                        >
                          Office
                        </button>
                        <button
                          onClick={() => onViewOnWall(art, "bedroom")}
                          className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/40 text-[9px] font-medium"
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

                  <p className="text-[11px] text-neutral-500 mb-4 font-mono">
                    {art.width} × {art.height} cm • {art.medium}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onViewOnWall(art)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Box size={14} />
                    {t.stageAndShare}
                  </button>

                  <button
                    onClick={() => onShare(art)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                    title={t.share}
                  >
                    <Share2 size={16} />
                  </button>

                  <button
                    onClick={() => onDeleteArtwork(art.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
