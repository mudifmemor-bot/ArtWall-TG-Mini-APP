import React, { useState } from "react";
import {
  BarChart3,
  Users,
  Palette,
  ShoppingBag,
  Eye,
  Heart,
  Box,
  TrendingUp,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { Artwork, Language, TelegramUser } from "../types";
import { translations } from "../translations";
import { GoogleWorkspacePanel } from "./GoogleWorkspacePanel";

interface Props {
  artworks: Artwork[];
  users: TelegramUser[];
  currentUser: TelegramUser | null;
  lang: Language;
  onViewOnWall: (artwork: Artwork) => void;
  onViewProfile?: (user: TelegramUser) => void;
  onUpdateUsers?: (users: TelegramUser[]) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  artworks,
  users,
  currentUser,
  lang,
  onViewOnWall,
  onViewProfile,
  onUpdateUsers,
}) => {
  const t = translations[lang];

  const [tableSearch, setTableSearch] = useState("");
  const [tableCategory, setTableCategory] = useState<string>("all");

  // Calculate real-time stats
  const totalArtists = users.filter((u) => u.role === "artist").length || 3;
  const totalBuyers = users.filter((u) => u.role === "buyer").length || 12;
  const totalArtworks = artworks.length;

  const totalViews = artworks.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const totalLikes = artworks.reduce((acc, a) => acc + (a.likesCount || 0), 0);
  const totalInBasket = artworks.reduce((acc, a) => acc + (a.inBasketCount || 0), 0);
  const totalArTries = artworks.reduce((acc, a) => acc + (a.arTriesCount || 0), 0);

  // High-level engagement rates
  const arEngagementRate = totalViews > 0 ? ((totalArTries / totalViews) * 100).toFixed(1) : "0.0";
  const basketAddRate = totalViews > 0 ? ((totalInBasket / totalViews) * 100).toFixed(1) : "0.0";

  // Filtered artworks for table
  const filteredArtworks = artworks.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
      art.artistName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (art.artistUsername && art.artistUsername.toLowerCase().includes(tableSearch.toLowerCase()));
    const matchesCat = tableCategory === "all" || art.category === tableCategory;
    return matchesSearch && matchesCat;
  });

  const handleExportCSV = () => {
    const headers = ["Title", "Artist", "Username", "Price_UZS", "Views", "Likes", "In_Basket", "AR_Tries", "Category"];
    const rows = artworks.map((a) => [
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.artistName.replace(/"/g, '""')}"`,
      `"${a.artistUsername || ""}"`,
      a.price,
      a.viewsCount || 0,
      a.likesCount || 0,
      a.inBasketCount || 0,
      a.arTriesCount || 0,
      a.category,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `artwall_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} /> Admin Mode
            </span>
            <span className="text-xs text-neutral-400">
              Founder & Platform Analytics
            </span>
          </div>
          <h1 className="font-serif-custom text-2xl sm:text-3xl font-light italic tracking-tight text-white">
            {t.adminStats}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-light mt-1 max-w-xl">
            {t.adminSub}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs font-mono">
          <div className="text-right">
            <span className="text-neutral-400 block text-[10px]">Active Session</span>
            <span className="text-white font-bold">
              {currentUser?.first_name} (@{currentUser?.username || "admin"})
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#2AABEE] text-white flex items-center justify-center font-bold">
            <Send size={16} />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Artists */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] shadow-xs">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
              {t.totalArtists}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palette size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A]">
            {totalArtists}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Verified Telegram creators
          </span>
        </div>

        {/* Total Buyers */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] shadow-xs">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
              {t.totalBuyers}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A]">
            {totalBuyers}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Registered collectors
          </span>
        </div>

        {/* Total Artworks */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] shadow-xs">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
              {t.totalArtworks}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A]">
            {totalArtworks}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            In active marketplace
          </span>
        </div>

        {/* Total AR Tries */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] shadow-xs ring-2 ring-[#6B7B62]/20">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-bold text-[#6B7B62] uppercase tracking-wider">
              {t.totalArTries}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#6B7B62]/15 text-[#6B7B62] flex items-center justify-center">
              <Camera size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-[#1A1A1A]">
            {totalArTries.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#6B7B62] mt-1 font-bold block">
            {arEngagementRate}% of viewers tried on wall!
          </span>
        </div>
      </div>

      {/* Second Row: Views, Likes, Basket & Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Views */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Eye size={22} />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-medium block">
              {t.totalViews}
            </span>
            <span className="text-2xl font-mono font-bold text-[#1A1A1A]">
              {totalViews.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-400 block">
              Marketplace impressions
            </span>
          </div>
        </div>

        {/* Likes */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Heart size={22} />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-medium block">
              {t.totalLikes}
            </span>
            <span className="text-2xl font-mono font-bold text-[#1A1A1A]">
              {totalLikes.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-400 block">
              Collector favorites
            </span>
          </div>
        </div>

        {/* In Basket */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E6E1] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2AABEE]/15 text-[#2AABEE] flex items-center justify-center shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-medium block">
              {t.totalInBasket}
            </span>
            <span className="text-2xl font-mono font-bold text-[#1A1A1A]">
              {totalInBasket.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-400 block">
              Active basket inquiries ({basketAddRate}% conversion)
            </span>
          </div>
        </div>
      </div>

      {/* Artworks Performance Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E6E1] shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-neutral-100">
          <div>
            <h2 className="font-serif-custom text-xl font-light italic text-[#1A1A1A]">
              {t.artworkPerformance}
            </h2>
            <p className="text-xs text-neutral-500 font-light">
              Detailed tracking per artwork: views, likes, basket adds, and 3D/AR wall tries.
            </p>
          </div>

          {/* Action bar: Search, Filter, Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative flex items-center flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search artwork or artist..."
                className="w-full sm:w-56 min-h-[44px] pl-9 pr-3 py-2 rounded-xl bg-neutral-100 border border-transparent focus:border-neutral-300 text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tableCategory}
                onChange={(e) => setTableCategory(e.target.value)}
                className="flex-1 sm:flex-initial min-h-[44px] py-2 px-3 rounded-xl bg-neutral-100 border border-transparent text-xs text-neutral-700 focus:outline-none capitalize cursor-pointer"
              >
                <option value="all">All Styles</option>
                <option value="abstract">Abstract</option>
                <option value="modern">Modern</option>
                <option value="landscape">Landscape</option>
                <option value="minimalist">Minimalist</option>
                <option value="portrait">Portrait</option>
                <option value="classic">Classical</option>
              </select>

              <button
                onClick={() => {
                  handleExportCSV();
                  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
                }}
                className="min-h-[44px] py-2 px-4 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 shrink-0"
                title="Download CSV report"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-bold">Artwork</th>
                <th className="pb-3 font-bold">Artist</th>
                <th className="pb-3 font-bold">Price (UZS)</th>
                <th className="pb-3 font-bold text-center">Views</th>
                <th className="pb-3 font-bold text-center">Likes</th>
                <th className="pb-3 font-bold text-center">In Basket</th>
                <th className="pb-3 font-bold text-center text-[#6B7B62]">AR Tries</th>
                <th className="pb-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredArtworks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    No artworks match the current filter.
                  </td>
                </tr>
              ) : (
                filteredArtworks.map((art) => (
                <tr key={art.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-10 h-12 rounded-lg object-cover bg-neutral-100 shrink-0"
                      />
                      <div>
                        <span className="font-medium text-neutral-900 block truncate max-w-[160px]">
                          {art.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {art.width}×{art.height}cm • {art.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <Send size={11} className="text-[#2AABEE]" />
                      <span className="font-mono text-[11px]">@{art.artistUsername || "artist"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 font-mono font-bold text-neutral-900">
                    {art.price.toLocaleString()} UZS
                  </td>
                  <td className="py-3.5 pr-3 text-center font-mono text-neutral-600">
                    {art.viewsCount || 0}
                  </td>
                  <td className="py-3.5 pr-3 text-center font-mono text-rose-500 font-medium">
                    {art.likesCount}
                  </td>
                  <td className="py-3.5 pr-3 text-center font-mono text-neutral-800 font-bold">
                    {art.inBasketCount || 0}
                  </td>
                  <td className="py-3.5 pr-3 text-center font-mono font-bold text-[#6B7B62]">
                    {art.arTriesCount || 0}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => onViewOnWall(art)}
                      className="py-1 px-2.5 rounded-lg bg-neutral-100 hover:bg-[#1A1A1A] hover:text-white text-neutral-700 text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Box size={11} /> Test AR
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Workspace Integration (Google Sheets & Google Drive) */}
      <GoogleWorkspacePanel
        users={users}
        onUpdateUsers={onUpdateUsers}
        lang={lang}
      />

      {/* Connected Telegram Users Directory */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E6E1] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif-custom text-xl font-light italic text-[#1A1A1A]">
              {t.userDirectory}
            </h2>
            <p className="text-xs text-neutral-500 font-light">
              Telegram authenticated community members and creators.
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {users.length} connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => {
                if (onViewProfile) {
                  onViewProfile(u);
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                }
              }}
              className={`p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between transition-all ${
                onViewProfile ? "cursor-pointer hover:bg-neutral-100 hover:border-neutral-300 shadow-2xs" : ""
              }`}
              title="View User Profile"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={u.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                  alt={u.first_name}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-black/10 shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-bold text-xs text-neutral-900 block truncate">
                    {u.first_name} {u.last_name || ""}
                  </span>
                  <span className="text-[10px] font-mono text-[#2AABEE] block truncate">
                    @{u.username || "tg_user"}
                  </span>
                </div>
              </div>

              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  u.role === "artist"
                    ? "bg-purple-100 text-purple-700"
                    : u.role === "admin"
                    ? "bg-black text-white"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
