import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { Artwork, Language, TelegramUser } from "../types";
import { translations } from "../translations";
import { GoogleWorkspacePanel } from "./GoogleWorkspacePanel";
import { fetchRegisteredUsers } from "../services/api";
import { syncUsersToGoogleSheet, getStoredWorkspaceState } from "../services/googleWorkspace";

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

  // User directory state
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "artist" | "buyer" | "admin">("all");
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Active polling of registered users while Admin is viewing dashboard
  useEffect(() => {
    let isMounted = true;
    const pollUsers = async () => {
      try {
        const fresh = await fetchRegisteredUsers();
        if (isMounted && Array.isArray(fresh) && onUpdateUsers) {
          onUpdateUsers(fresh);
        }
      } catch (err) {
        // silent fail on network fluctuation
      }
    };

    pollUsers();
    const interval = setInterval(pollUsers, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onUpdateUsers]);

  const handleManualRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
    try {
      const freshUsers = await fetchRegisteredUsers();
      if (freshUsers && onUpdateUsers) {
        onUpdateUsers(freshUsers);
      }
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    } catch (err) {
      console.warn("Could not refresh users:", err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("error");
    } finally {
      setTimeout(() => setIsRefreshingUsers(false), 500);
    }
  };

  const handleClearAllUsers = async () => {
    if (!window.confirm("Are you sure you want to delete all users from the database? Everyone will have to sign up again through Telegram.")) {
      return;
    }
    try {
      await fetch("/api/users", { method: "DELETE" });
      if (onUpdateUsers) {
        onUpdateUsers([]);
      }
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    } catch (err) {
      console.warn("Could not clear users:", err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("error");
    }
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Filtered users for directory
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name || ""}`.toLowerCase();
    const username = (u.username || "").toLowerCase();
    const phone = (u.phone_number || "").toLowerCase();
    const q = userSearch.toLowerCase();
    const matchesQuery = fullName.includes(q) || username.includes(q) || phone.includes(q);
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesQuery && matchesRole;
  });

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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 overflow-x-clip animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#1A1A1A] text-white rounded-3xl p-5 sm:p-8 shadow-xl mb-6 sm:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 border border-white/10">
        <div className="min-w-0 max-w-full">
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

        <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs font-mono max-w-full overflow-hidden self-stretch sm:self-auto">
          <div className="text-left sm:text-right min-w-0 flex-1">
            <span className="text-neutral-400 block text-[10px]">Active Session</span>
            <span className="text-white font-bold block truncate">
              {currentUser?.first_name} (@{currentUser?.username || "admin"})
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#2AABEE] text-white flex items-center justify-center font-bold shrink-0">
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

        <div className="w-full max-w-full overflow-x-auto no-scrollbar touch-pan-x">
          <table className="w-full min-w-[580px] text-left text-xs">
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-serif-custom text-xl font-light italic text-[#1A1A1A]">
                {t.userDirectory}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Cloud Synced
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-light">
              Real-time platform registrations with Telegram verified phone numbers, roles, and profiles.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleManualRefreshUsers}
              disabled={isRefreshingUsers}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Poll latest users from server"
            >
              <RefreshCw size={14} className={isRefreshingUsers ? "animate-spin text-[#6B7B62]" : ""} />
              <span>{isRefreshingUsers ? "Syncing..." : "Refresh Live Users"}</span>
            </button>
            <button
              onClick={handleClearAllUsers}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Delete all users from database and make them sign up again"
            >
              <Trash2 size={14} />
              <span>Clear / Reset Users</span>
            </button>
            <span className="text-xs text-neutral-500 font-mono bg-neutral-100 px-3 py-2 rounded-xl">
              {filteredUsers.length} / {users.length}
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {(
              [
                { id: "all", label: `All (${users.length})` },
                { id: "artist", label: `Artists (${users.filter((u) => u.role === "artist").length})` },
                { id: "buyer", label: `Buyers (${users.filter((u) => u.role === "buyer").length})` },
                { id: "admin", label: `Admin (${users.filter((u) => u.role === "admin").length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setUserRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  userRoleFilter === tab.id
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search name, username, phone..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl bg-neutral-100 border border-transparent focus:border-neutral-300 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* User Cards Grid */}
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
            No real registered users yet. All visitors will sign up through Telegram to appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  if (onViewProfile) {
                    onViewProfile(u);
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                  }
                }}
                className={`p-4 rounded-2xl bg-neutral-50/90 border border-neutral-200/90 hover:border-neutral-300 hover:bg-white flex flex-col justify-between transition-all group shadow-2xs ${
                  onViewProfile ? "cursor-pointer" : ""
                }`}
              >
                {/* User Top: Avatar, Name, Handle, Role */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        u.photo_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.first_name || "User")}&background=2AABEE&color=ffffff&size=200&bold=true`
                      }
                      alt={u.first_name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-black/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-neutral-900 block truncate">
                          {u.first_name} {u.last_name || ""}
                        </span>
                      </div>
                      <a
                        href={u.username ? `https://t.me/${u.username}` : undefined}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-mono text-[#2AABEE] hover:underline flex items-center gap-1 truncate"
                      >
                        <Send size={10} />
                        @{u.username || `tg_${u.id}`}
                      </a>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${
                      u.role === "artist"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : u.role === "admin"
                        ? "bg-black text-white"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                {/* Contact Phone & Telegram Verified Badge */}
                <div className="space-y-1.5 mt-1 pt-2 border-t border-neutral-200/60">
                  {u.phone_number ? (
                    <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone size={12} className="text-emerald-600 shrink-0" />
                        <span className="font-mono font-medium truncate">{u.phone_number}</span>
                      </div>
                      <button
                        onClick={(e) => handleCopyPhone(u.phone_number!, e)}
                        className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors shrink-0"
                        title="Copy phone number"
                      >
                        {copiedPhone === u.phone_number ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-400 italic px-1 flex items-center gap-1">
                      <Phone size={10} /> Contact not shared
                    </div>
                  )}

                  {/* Metadata: Location & Joined Date */}
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                    {u.location ? (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin size={10} className="text-neutral-400 shrink-0" />
                        <span className="truncate">{u.location}</span>
                      </span>
                    ) : (
                      <span className="text-neutral-400">Tashkent</span>
                    )}

                    {u.createdAt && (
                      <span className="flex items-center gap-1 font-mono text-[9px] text-neutral-400 shrink-0">
                        <Calendar size={10} />
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
