import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Heart,
  Box,
  ShoppingBag,
  Check,
  Share2,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { Artwork, Language } from "../types";
import { translations } from "../translations";

interface Props {
  artworks: Artwork[];
  lang: Language;
  onSelectArtwork: (artwork: Artwork) => void;
  onViewOnWall: (artwork: Artwork) => void;
  onAddToBasket: (artwork: Artwork) => void;
  onToggleLike: (id: string) => void;
  likedIds: Set<string>;
  basketIds: Set<string>;
  onShare: (artwork: Artwork) => void;
}

export const Marketplace: React.FC<Props> = ({
  artworks,
  lang,
  onSelectArtwork,
  onViewOnWall,
  onAddToBasket,
  onToggleLike,
  likedIds,
  basketIds,
  onShare,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "priceLow" | "priceHigh" | "popular">("newest");

  const categories = [
    { id: "all", label: t.allCategories },
    { id: "abstract", label: t.abstract },
    { id: "modern", label: t.modern },
    { id: "landscape", label: t.landscape },
    { id: "minimalist", label: t.minimalist },
    { id: "portrait", label: t.portrait },
    { id: "classic", label: t.classic },
  ];

  const filteredArtworks = useMemo(() => {
    let list = artworks.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.artistName.toLowerCase().includes(q) ||
        item.medium.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    if (sortBy === "priceLow") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceHigh") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "popular") {
      list = [...list].sort((a, b) => b.likesCount - a.likesCount);
    }

    return list;
  }, [artworks, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="mb-6 sm:mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E6E1] pb-6">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6B7B62] uppercase mb-1 block">
            Curated Telegram Art Space
          </span>
          <h1 className="font-serif-custom text-3xl sm:text-4xl font-light italic tracking-tight text-[#1A1A1A]">
            {t.exploreArtworks}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-light max-w-xl mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Total stats pill */}
        <div className="flex items-center justify-center sm:justify-end gap-3 text-xs text-neutral-500 font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200">
            {filteredArtworks.length} artworks listed
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-neutral-200 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6B7B62]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <ArrowUpDown size={14} className="text-neutral-500 hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#6B7B62] cursor-pointer"
          >
            <option value="newest">{t.newest}</option>
            <option value="popular">{t.mostLiked}</option>
            <option value="priceLow">{t.priceLowHigh}</option>
            <option value="priceHigh">{t.priceHighLow}</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-[#1A1A1A] text-white shadow-sm"
                : "bg-white/80 text-neutral-600 border border-neutral-200/80 hover:bg-white hover:text-neutral-900"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Artworks Grid */}
      {filteredArtworks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 my-8 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
            <Search size={22} />
          </div>
          <p className="text-sm font-medium text-neutral-800 mb-1">
            {t.noArtworksFound}
          </p>
          <p className="text-xs text-neutral-500 font-light">
            Try adjusting your search terms or selecting another style.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredArtworks.map((artwork) => {
            const isLiked = likedIds.has(artwork.id);
            const isInBasket = basketIds.has(artwork.id);

            return (
              <div
                key={artwork.id}
                className="group bg-white rounded-3xl overflow-hidden border border-[#E8E6E1] hover:border-[#D6D2C4] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Artwork Image Area with Hover Overlay */}
                  <div className="relative bg-[#F4F2EE] aspect-[4/5] overflow-hidden cursor-pointer">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      onClick={() => onSelectArtwork(artwork)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />

                    {/* Like & Share Floating Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(artwork.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
                          isLiked
                            ? "bg-rose-500 text-white"
                            : "bg-white/80 hover:bg-white text-neutral-700 hover:text-rose-500"
                        }`}
                        title={t.like}
                      >
                        <Heart
                          size={15}
                          fill={isLiked ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShare(artwork);
                        }}
                        className="p-2 rounded-full bg-white/80 hover:bg-white text-neutral-700 backdrop-blur-md shadow-md transition-colors"
                        title={t.share}
                      >
                        <Share2 size={15} />
                      </button>
                    </div>

                    {/* Style Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                        {artwork.category}
                      </span>
                      {artwork.featured && (
                        <span className="p-1 rounded-full bg-amber-400 text-black shadow-xs">
                          <Sparkles size={11} />
                        </span>
                      )}
                    </div>

                    {/* Quick Hover CTA: "See on Wall" */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewOnWall(artwork);
                        }}
                        className="pointer-events-auto py-2.5 px-4 rounded-xl bg-white text-[#1A1A1A] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                      >
                        <Box size={15} />
                        {t.viewOnWall}
                      </button>
                    </div>
                  </div>

                  {/* Artwork Meta */}
                  <div className="p-5">
                    {/* Artist row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={artwork.artistAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                          alt={artwork.artistName}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-neutral-200 shrink-0"
                        />
                        <span className="text-xs font-medium text-neutral-600 truncate">
                          {artwork.artistName}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                        {artwork.width}×{artwork.height} cm
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectArtwork(artwork)}
                      className="font-serif-custom text-xl font-light italic text-[#1A1A1A] hover:underline cursor-pointer tracking-tight mb-1 truncate"
                    >
                      {artwork.title}
                    </h3>

                    <p className="text-xs text-neutral-500 line-clamp-1 font-light mb-3">
                      {artwork.medium}
                    </p>
                  </div>
                </div>

                {/* Footer Price & Actions */}
                <div className="px-5 pb-5 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block tracking-wider leading-tight">
                      {t.price}
                    </span>
                    <span className="text-base font-bold font-mono text-[#1A1A1A]">
                      ${artwork.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewOnWall(artwork)}
                      className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors flex items-center gap-1"
                      title={t.viewOnWall}
                    >
                      <Box size={14} />
                      <span className="hidden sm:inline">{t.viewOnWall}</span>
                    </button>

                    <button
                      onClick={() => onAddToBasket(artwork)}
                      className={`p-2 rounded-xl border transition-all ${
                        isInBasket
                          ? "bg-[#6B7B62] text-white border-[#6B7B62]"
                          : "bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200"
                      }`}
                      title={isInBasket ? t.inBasket : t.addToBasket}
                    >
                      {isInBasket ? <Check size={16} /> : <ShoppingBag size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
