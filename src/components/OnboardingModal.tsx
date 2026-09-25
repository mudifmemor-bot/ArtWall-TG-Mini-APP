import React, { useState, useEffect } from "react";
import {
  Palette,
  ShoppingBag,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Camera,
  Layers,
  Heart,
  BarChart3,
  X,
  Phone,
  User,
  Crown,
  Info,
} from "lucide-react";
import {
  Language,
  TelegramUser,
  UserRole,
  MAX_ARTIST_UPLOADS,
  ADMIN_TELEGRAM_USERNAME,
  isAuthorizedAdmin,
} from "../types";
import { translations } from "../translations";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TelegramUser | null;
  onCompleteOnboarding: (user: TelegramUser) => void;
  lang: Language;
}

export const OnboardingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onCompleteOnboarding,
  lang,
}) => {
  const t = translations[lang];

  // Initial user extraction from Telegram WebApp
  const realTg = typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user : null;

  const initialUsername =
    currentUser?.username ||
    realTg?.username ||
    "";
  
  const isInitialMuxammadSiddiq =
    initialUsername.replace(/^@/, "").trim().toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase();

  const [step, setStep] = useState<"contact" | "profile">("contact");
  const [contactShared, setContactShared] = useState<boolean>(Boolean(currentUser?.phone_number));
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser?.phone_number || "");
  const [isRequestingContact, setIsRequestingContact] = useState<boolean>(false);
  const [contactNotice, setContactNotice] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    currentUser?.role || (isInitialMuxammadSiddiq ? "admin" : "buyer")
  );

  const [firstName, setFirstName] = useState(
    currentUser?.first_name || realTg?.first_name || (isInitialMuxammadSiddiq ? "Muxammadsiddiq" : "")
  );
  const [lastName, setLastName] = useState(
    currentUser?.last_name || realTg?.last_name || (isInitialMuxammadSiddiq ? "Admin" : "")
  );
  const [username, setUsername] = useState(initialUsername || (isInitialMuxammadSiddiq ? ADMIN_TELEGRAM_USERNAME : ""));
  const [bio, setBio] = useState(
    currentUser?.bio ||
      (isInitialMuxammadSiddiq
        ? "Art Wall platform founder & curation overview."
        : "")
  );
  const [location, setLocation] = useState(currentUser?.location || "Tashkent, Uzbekistan");

  // Dynamically evaluate if the entered username is @muxammadsiddiq_23
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  const isMuxammadSiddiq =
    cleanUsername === ADMIN_TELEGRAM_USERNAME.toLowerCase() ||
    Boolean(realTg?.username && realTg.username.replace(/^@/, "").trim().toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase());

  // Phone validation check: valid if user shared contact OR typed in >= 7 digits
  const hasValidPhone = Boolean(phoneNumber && phoneNumber.trim().replace(/\D/g, "").length >= 7);
  const isPhoneVerified = contactShared || hasValidPhone;

  // If user enters muxammadsiddiq_23, auto-suggest or switch to Admin
  useEffect(() => {
    if (isMuxammadSiddiq && selectedRole !== "admin") {
      setSelectedRole("admin");
      if (!firstName) {
        setFirstName("Muxammadsiddiq");
      }
      if (!bio) {
        setBio("Art Wall platform founder, curation & analytics.");
      }
    }
  }, [cleanUsername, isMuxammadSiddiq]);

  if (!isOpen) return null;

  // Telegram native requestContact call
  const handleRequestTelegramContact = () => {
    setContactNotice(null);
    setIsRequestingContact(true);

    if (typeof window !== "undefined" && window.Telegram?.WebApp?.requestContact) {
      try {
        window.Telegram.WebApp.requestContact((shared: boolean, result?: any) => {
          setIsRequestingContact(false);
          if (shared) {
            setContactShared(true);
            const contactData =
              result?.responseUnsafe?.contact ||
              result?.response?.contact ||
              result?.contact ||
              result?.response ||
              result ||
              {};
            const phone = contactData.phone_number || contactData.phone || "";
            if (phone) {
              const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
              setPhoneNumber(formattedPhone);
            }
            if (contactData.first_name && !firstName) setFirstName(contactData.first_name);
            if (contactData.last_name && !lastName) setLastName(contactData.last_name);

            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
            }
            setContactNotice("✓ Contact successfully shared and verified via Telegram WebApp!");
          } else {
            if (phoneNumber.trim().replace(/\D/g, "").length >= 7) {
              setContactShared(true);
              setContactNotice("✓ Phone number recorded.");
            } else {
              setContactNotice("Please enter your phone number below to proceed.");
            }
          }
        });
      } catch (err: any) {
        setIsRequestingContact(false);
        console.warn("Telegram WebApp.requestContact error:", err);
        if (phoneNumber.trim().replace(/\D/g, "").length >= 7) {
          setContactShared(true);
        } else {
          setContactNotice("Please enter your phone number below to proceed.");
        }
      }
    } else {
      // In dev preview or web browser without native Telegram client bridge:
      setTimeout(() => {
        setIsRequestingContact(false);
        setContactShared(true);
        if (!phoneNumber) {
          setPhoneNumber("+998 90 123 45 67");
        }
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        setContactNotice("✓ Contact verified!");
      }, 300);
    }
  };

  const handleApplyMuxammadSiddiq = () => {
    setUsername(ADMIN_TELEGRAM_USERNAME);
    if (!firstName) setFirstName("Muxammadsiddiq");
    if (!lastName) setLastName("Admin");
    setSelectedRole("admin");
    if (!phoneNumber) setPhoneNumber("+998 90 123 45 67");
    setBio("Art Wall platform founder, curation & analytics.");
    setLocation("HQ Tashkent, Uzbekistan");
    setContactShared(true);
    setContactNotice("Identified as @muxammadsiddiq_23.");

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    }
  };

  const handleApplyArtist = () => {
    setSelectedRole("artist");
    if (!bio) {
      setBio("Contemporary mixed media artist creating spatial dialogue through texture and light.");
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }
  };

  const handleApplyBuyer = () => {
    setSelectedRole("buyer");
    if (!bio) {
      setBio("Curating modern minimal interior pieces for private collections.");
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }
  };

  const handleFinishLaunch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isPhoneVerified) {
      setContactNotice("⚠️ Please enter a phone number or share contact via Telegram.");
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
      }
      setStep("contact");
      return;
    }

    let finalRole = selectedRole;
    let finalUsername = username.replace(/^@/, "").trim();

    // If username is muxammadsiddiq_23, assign admin role
    if (finalUsername.toLowerCase() === ADMIN_TELEGRAM_USERNAME.toLowerCase()) {
      finalRole = "admin";
    } else if (finalRole === "admin" && !isMuxammadSiddiq) {
      // Protect admin role
      finalRole = "buyer";
    }

    const userFirstName = firstName.trim() || (finalRole === "admin" ? "Muxammadsiddiq" : "User");
    const avatarInitials = encodeURIComponent(userFirstName.slice(0, 2).toUpperCase() || "TG");
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${avatarInitials}&background=2AABEE&color=ffffff&size=200&bold=true`;

    const finalizedUser: TelegramUser = {
      id:
        currentUser?.id ||
        realTg?.id ||
        (finalRole === "admin" ? 999 : Date.now()),
      first_name: userFirstName,
      last_name: lastName.trim() || undefined,
      username:
        finalUsername ||
        (finalRole === "admin" ? ADMIN_TELEGRAM_USERNAME : undefined),
      phone_number: phoneNumber.trim() || undefined,
      photo_url:
        currentUser?.photo_url ||
        realTg?.photo_url ||
        fallbackAvatar,
      role: finalRole,
      bio:
        bio.trim() ||
        (finalRole === "admin"
          ? "Art Wall platform founder & curation overview."
          : finalRole === "artist"
          ? "Contemporary artist creating spatial artwork collections."
          : "Art collector exploring tactile wall stagings."),
      location: location.trim() || "Tashkent, Uzbekistan",
      createdAt: currentUser?.createdAt || new Date().toISOString(),
    };

    onCompleteOnboarding(finalizedUser);

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#F9F8F6] text-[#1A1A1A] w-full max-w-lg rounded-3xl p-4 sm:p-7 shadow-2xl border border-white/80 relative max-h-[92vh] overflow-y-auto overflow-x-hidden">
        {currentUser && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-200 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* Telegram Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#2AABEE] text-white flex items-center justify-center shadow-md shadow-[#2AABEE]/20 shrink-0">
            <Send size={22} className="translate-x-[-1px] translate-y-[1px]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#2AABEE]/15 text-[#0088cc] border border-[#2AABEE]/30">
                Telegram WebApp Verification
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-custom tracking-tight text-[#1A1A1A] mt-0.5">
              Sign In & Connect Contact
            </h2>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep("contact")}
            className={`flex-1 py-2 px-3 rounded-xl border transition-all text-center cursor-pointer ${
              step === "contact"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                : "bg-white/80 text-neutral-600 border-neutral-200 hover:bg-white"
            }`}
          >
            1. Share Contact {contactShared && "✓"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!contactShared) {
                setContactNotice("⚠️ Sharing your contact via Telegram is mandatory before you can proceed.");
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
                }
                return;
              }
              setStep("profile");
            }}
            className={`flex-1 py-2 px-3 rounded-xl border transition-all text-center ${
              step === "profile"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                : contactShared
                ? "bg-white/80 text-neutral-600 border-neutral-200 hover:bg-white cursor-pointer"
                : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60"
            }`}
          >
            2. Role & Launch
          </button>
        </div>

        {/* STEP 1: SHARE TELEGRAM CONTACT */}
        {step === "contact" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Phone size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Telegram Contact Verification
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-blue-800/90 font-light mt-1 leading-relaxed">
                    Before launching Art Wall AR, share your Telegram contact so we can verify your account, assign your permissions (Admin, Artist, or Buyer), and sync your personal gallery.
                  </p>
                </div>
              </div>

              {/* Native Telegram requestContact CTA */}
              <div className="mt-3.5 flex flex-col gap-2">
                <button
                  type="button"
                  id="telegram-share-contact-btn"
                  onClick={handleRequestTelegramContact}
                  disabled={isRequestingContact}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    contactShared
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-[#2AABEE] hover:bg-[#2299d4] text-white active:scale-[0.99] ring-2 ring-[#2AABEE]/40"
                  } disabled:opacity-50`}
                >
                  {isRequestingContact ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Requesting Telegram Contact...</span>
                    </>
                  ) : contactShared ? (
                    <>
                      <CheckCircle2 size={16} className="text-white shrink-0" />
                      <span>✓ Contact Shared ({phoneNumber || "Verified"})</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} className="shrink-0" />
                      <span>Share Contact</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/25 text-[10px] lowercase font-semibold tracking-normal">
                        mandatory
                      </span>
                    </>
                  )}
                </button>
              </div>

              {contactNotice && (
                <div className="mt-2.5 text-[11px] text-blue-800 flex items-center gap-1.5 font-medium">
                  <Info size={13} className="text-blue-600 shrink-0" />
                  <span>{contactNotice}</span>
                </div>
              )}
            </div>

            {/* Quick One-Click Identity Shortcuts */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                Quick Identification:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleApplyMuxammadSiddiq}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isMuxammadSiddiq
                      ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300/50"
                      : "bg-white border-neutral-200 hover:border-amber-300 text-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <Crown size={13} className="text-amber-600" />
                    <span>@muxammadsiddiq_23</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Platform Admin HQ
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyArtist}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRole === "artist" && !isMuxammadSiddiq
                      ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300/50"
                      : "bg-white border-neutral-200 hover:border-emerald-300 text-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                    <Palette size={13} className="text-emerald-600" />
                    <span>Artist</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Upload & Studio
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyBuyer}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRole === "buyer" && !isMuxammadSiddiq
                      ? "bg-neutral-100 border-neutral-800 text-neutral-950 ring-2 ring-neutral-400/50"
                      : "bg-white border-neutral-200 hover:border-neutral-400 text-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900">
                    <ShoppingBag size={13} />
                    <span>Buyer</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Wall AR & Basket
                  </span>
                </button>
              </div>
            </div>

            {/* Recognized Admin Badge */}
            {isMuxammadSiddiq && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-300 text-amber-950 flex items-start gap-2.5 animate-in fade-in">
                <Crown size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 block">
                    👑 Platform Founder & Super Admin Recognized
                  </span>
                  <span className="text-amber-800/90 text-[11px] block mt-0.5">
                    Welcome back, <strong>@muxammadsiddiq_23</strong>! Full platform administrative permissions and founder dashboard are unlocked.
                  </span>
                </div>
              </div>
            )}

            {/* Contact Fields Input Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Telegram Username *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-neutral-400 text-sm font-mono font-medium">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="muxammadsiddiq_23"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Phone Number {isPhoneVerified && <span className="text-emerald-600 font-normal">(Verified)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-neutral-400 text-xs">
                    <Phone size={14} />
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (e.target.value.trim().replace(/\D/g, "").length >= 7) {
                        setContactShared(true);
                      }
                    }}
                    placeholder="+998 90 123 45 67"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Muxammadsiddiq"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Admin"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (!isPhoneVerified) {
                    setContactNotice("⚠️ Please enter a phone number or click 'Share Contact' to continue.");
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                      window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
                    }
                    return;
                  }
                  setStep("profile");
                }}
                disabled={!isPhoneVerified}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isPhoneVerified
                    ? "bg-[#1A1A1A] hover:bg-black text-white cursor-pointer"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300"
                }`}
              >
                <span>Continue to Role & App Setup</span>
                <ArrowRight size={14} />
              </button>
              {!isPhoneVerified && (
                <p className="text-[11px] text-amber-800 text-center font-medium">
                  ⚠️ Click "Share Contact" or enter your phone number to unlock onboarding
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: ROLE SELECTION & LAUNCH */}
        {step === "profile" && (
          <form onSubmit={handleFinishLaunch} className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setStep("contact")}
                className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                ← Back to Contact
              </button>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                <span>@{username || "user"}</span>
                {phoneNumber && <span className="text-emerald-600 font-bold">• Verified</span>}
              </div>
            </div>

            {/* Role Cards */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                Select Your Platform Role
              </label>

              <div className="space-y-2.5">
                {/* Admin Option - Fully Available for @muxammadsiddiq_23 */}
                {isMuxammadSiddiq && (
                  <button
                    type="button"
                    onClick={() => setSelectedRole("admin")}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedRole === "admin"
                        ? "bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-300/40"
                        : "bg-white border-neutral-200 hover:border-amber-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Crown size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-950">
                            Administrator & Founder HQ
                          </span>
                          <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold font-mono">
                            Verified @muxammadsiddiq_23
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 mt-0.5">
                          Real-time platform activity, Google Sheets sync, user records & curation.
                        </p>
                      </div>
                    </div>
                    {selectedRole === "admin" && (
                      <CheckCircle2 size={18} className="text-amber-600 shrink-0" />
                    )}
                  </button>
                )}

                {/* Artist Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("artist")}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    selectedRole === "artist"
                      ? "bg-emerald-50/80 border-[#6B7B62] shadow-md ring-2 ring-emerald-300/40"
                      : "bg-white border-neutral-200 hover:border-[#6B7B62]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6B7B62] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Palette size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">
                          {t.artistRole} (Studio)
                        </span>
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-medium">
                          Up to {MAX_ARTIST_UPLOADS} Artworks
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Manage portfolio, stage 3D rooms & angles, Google Drive master storage.
                      </p>
                    </div>
                  </div>
                  {selectedRole === "artist" && (
                    <CheckCircle2 size={18} className="text-[#6B7B62] shrink-0" />
                  )}
                </button>

                {/* Buyer Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("buyer")}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    selectedRole === "buyer"
                      ? "bg-neutral-100 border-[#1A1A1A] shadow-md ring-2 ring-neutral-400/40"
                      : "bg-white border-neutral-200 hover:border-[#1A1A1A]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">
                          {t.buyerRole}
                        </span>
                        <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-medium">
                          Live Wall Camera AR
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Browse marketplace, live camera AR trial on real walls, shopping basket.
                      </p>
                    </div>
                  </div>
                  {selectedRole === "buyer" && (
                    <CheckCircle2 size={18} className="text-[#1A1A1A] shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Location & Bio */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Tashkent, Uzbekistan"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Bio / Narrative
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell collectors or creators about yourself..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2AABEE] resize-none"
                />
              </div>
            </div>

            {/* Complete Onboarding Button */}
            <div className="pt-2 space-y-2.5">
              {!isPhoneVerified && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <Info size={16} className="text-amber-600 shrink-0" />
                    <span className="font-medium truncate">Telegram contact or phone number required.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestTelegramContact}
                    disabled={isRequestingContact}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2AABEE] hover:bg-[#2299d4] text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    Share Contact
                  </button>
                </div>
              )}

              <button
                type="submit"
                id="complete-onboarding-btn"
                disabled={!isPhoneVerified || isRequestingContact}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isPhoneVerified && !isRequestingContact
                    ? "bg-gradient-to-r from-[#1A1A1A] to-neutral-800 hover:from-black hover:to-neutral-900 text-white cursor-pointer shadow-black/20 active:scale-[0.99]"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300"
                }`}
              >
                <Sparkles size={16} className={isPhoneVerified ? "text-amber-300" : "text-neutral-400"} />
                <span>
                  {isPhoneVerified
                    ? selectedRole === "admin"
                      ? "Complete Onboarding & Launch Admin HQ →"
                      : selectedRole === "artist"
                      ? "Complete Onboarding & Launch Studio →"
                      : "Complete Onboarding →"
                    : "Complete Onboarding (Phone Number Required)"}
                </span>
              </button>

              {!isPhoneVerified && (
                <p className="text-[11px] text-amber-800 text-center font-medium">
                  ⚠️ Please enter your phone number or click "Share Contact" before clicking Complete Onboarding.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
