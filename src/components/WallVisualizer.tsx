import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Move,
  Share,
  Heart,
  Image as ImageIcon,
  Maximize,
  Square,
  RotateCcw,
  Box,
  Camera,
  CameraOff,
  RefreshCw,
  X,
  ShoppingBag,
  Check,
  Sparkles,
  Sliders,
  Layers,
  AlertCircle,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import { Artwork, Language, RoomPreset } from "../types";
import { translations } from "../translations";
import { uploadFileToDrive, dataUrlToBlob } from "../services/googleWorkspace";

// Reusable Slider Component with Touch Buttons & Mobile Optimization
const CustomSlider = ({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handleStep = (delta: number) => {
    const next = Math.min(max, Math.max(min, Math.round((value + delta * step) * 10) / 10));
    onChange(next);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
  };

  return (
    <div className="flex flex-col gap-1.5 w-full mb-3.5">
      <div className="flex justify-between items-center text-xs font-semibold text-neutral-800">
        <span className="tracking-tight">{label}</span>
        <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-700 font-bold text-[11px]">
          {value}
          {unit}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-sm cursor-pointer active:scale-95 transition-all shrink-0 select-none"
          aria-label="Decrease"
        >
          -
        </button>

        <div className="relative flex-1 h-8 flex items-center touch-pan-x cursor-pointer">
          {/* Track background */}
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6B7B62] rounded-full pointer-events-none"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <input
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              onChange(Number(e.target.value));
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
            }}
          />

          {/* Tactile Thumb */}
          <div
            className="absolute w-5 h-5 bg-white border-2 border-[#6B7B62] rounded-full shadow-md pointer-events-none transition-transform -translate-x-1/2"
            style={{ left: `${percentage}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => handleStep(1)}
          className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-sm cursor-pointer active:scale-95 transition-all shrink-0 select-none"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
};

export const roomPresets: RoomPreset[] = [
  {
    id: "home-office",
    labelKey: "homeOffice",
    src: "https://images.unsplash.com/photo-1526887593587-a307ea5d46b4?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "office-space",
    labelKey: "officeSpace",
    src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "living-room",
    labelKey: "livingRoom",
    src: "https://images.unsplash.com/photo-1604762525950-13c07ecdab8b?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "bedroom",
    labelKey: "bedroom",
    src: "https://images.unsplash.com/photo-1648668425549-84b695d2ec2a?auto=format&fit=crop&q=80&w=1200",
  },
];

interface Props {
  selectedArtwork: Artwork | null;
  allArtworks: Artwork[];
  lang: Language;
  onSelectArtwork: (artwork: Artwork) => void;
  onAddToBasket: (artwork: Artwork, config: { frameColor: string; frameMaterial: any; frameThickness: number; mattingThickness: number; selectedWidth: number; selectedHeight: number }) => void;
  isInBasket: boolean;
  onOpenShareModal: (artwork: Artwork) => void;
  initialRoomId?: string;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
  onTrackArTry?: (id: string) => void;
}

export const WallVisualizer: React.FC<Props> = ({
  selectedArtwork,
  allArtworks,
  lang,
  onSelectArtwork,
  onAddToBasket,
  isInBasket,
  onOpenShareModal,
  initialRoomId,
  isLiked = false,
  onToggleLike,
  onTrackArTry,
}) => {
  const t = translations[lang];

  const currentArtwork = selectedArtwork || allArtworks[0];

  const [activeTab, setActiveTab] = useState<"Upload" | "Size" | "Frame" | "Rooms" | null>(null);
  const [isARMode, setIsARMode] = useState(true);

  // Live Camera state
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Background room preset
  const [bgImage, setBgImage] = useState(
    roomPresets.find((r) => r.id === initialRoomId)?.src || roomPresets[0].src
  );

  useEffect(() => {
    if (initialRoomId) {
      const found = roomPresets.find((r) => r.id === initialRoomId);
      if (found) {
        setBgImage(found.src);
        setIsLiveCameraActive(false);
      }
    }
  }, [initialRoomId]);

  // Track AR try when entering visualizer or changing artwork
  useEffect(() => {
    if (currentArtwork?.id && onTrackArTry) {
      onTrackArTry(currentArtwork.id);
    }
  }, [currentArtwork?.id]);

  // Live Camera Stream Lifecycle
  const startLiveCamera = async (facing: "environment" | "user" = cameraFacingMode) => {
    try {
      setCameraError(null);
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (e) {
        // Fallback for devices that don't support high-res constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch (e2) {
          // Final fallback
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.warn("Video play error:", err);
          });
        };
      }
      setIsLiveCameraActive(true);
      setIsARMode(true);

      if (currentArtwork?.id && onTrackArTry) {
        onTrackArTry(currentArtwork.id);
      }
    } catch (err: any) {
      console.warn("Camera error:", err);
      setCameraError(t.cameraAccessNeeded);
      setIsLiveCameraActive(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextFacing);
    if (isLiveCameraActive) {
      startLiveCamera(nextFacing);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame configuration
  const [frameColor, setFrameColor] = useState(currentArtwork?.defaultFrameColor || "#000000");
  const [frameMaterial, setFrameMaterial] = useState<"solid" | "wood" | "metal" | "pattern">(
    currentArtwork?.defaultFrameMaterial || "solid"
  );
  const [frameThickness, setFrameThickness] = useState(2);
  const [mattingThickness, setMattingThickness] = useState(0);
  const [artworkWidth, setArtworkWidth] = useState(currentArtwork?.width || 60);
  const [artworkHeight, setArtworkHeight] = useState(currentArtwork?.height || 80);

  // Sync with artwork prop
  useEffect(() => {
    if (currentArtwork) {
      if (currentArtwork.defaultFrameColor) setFrameColor(currentArtwork.defaultFrameColor);
      if (currentArtwork.defaultFrameMaterial) setFrameMaterial(currentArtwork.defaultFrameMaterial);
      if (currentArtwork.width) setArtworkWidth(currentArtwork.width);
      if (currentArtwork.height) setArtworkHeight(currentArtwork.height);
    }
  }, [currentArtwork]);

  // Transform / Drag / Rotate State
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ rx: 6, ry: -16, rz: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [transformMode, setTransformMode] = useState<"move" | "rotate" | "scale">("move");
  const [customScale, setCustomScale] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveNotification, setDriveNotification] = useState<{
    text: string;
    url?: string;
  } | null>(null);

  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialRx: number;
    initialRy: number;
    initialScale: number;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialRx: 0,
    initialRy: 0,
    initialScale: 1,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: dragPos.x,
      initialY: dragPos.y,
      initialRx: rotation.rx,
      initialRy: rotation.ry,
      initialScale: customScale,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (isARMode) {
      if (transformMode === "move") {
        const factor = viewport.width < 600 ? 0.8 : 1.2;
        setDragPos({
          x: dragRef.current.initialX + dx * factor,
          y: dragRef.current.initialY + dy * factor,
        });
      } else if (transformMode === "rotate") {
        setRotation({
          ...rotation,
          ry: dragRef.current.initialRy + dx * 0.5,
          rx: Math.max(-80, Math.min(80, dragRef.current.initialRx - dy * 0.5)),
        });
      } else if (transformMode === "scale") {
        const scaleChange = (dx - dy) * 0.005;
        setCustomScale(
          Math.max(0.4, Math.min(2.5, dragRef.current.initialScale + scaleChange))
        );
      }
    } else {
      setRotation({
        ...rotation,
        ry: dragRef.current.initialRy + dx * 0.5,
        rx: Math.max(-80, Math.min(80, dragRef.current.initialRx - dy * 0.5)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCustomArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const customUrl = event.target?.result as string;
        const customArtwork: Artwork = {
          id: `custom-art-${Date.now()}`,
          title: "Custom Artwork",
          artistId: "user",
          artistName: "My Upload",
          imageUrl: customUrl,
          price: 0,
          width: artworkWidth,
          height: artworkHeight,
          medium: "Digital Preview",
          description: "Uploaded custom artwork for interior visualization.",
          category: "modern",
          likesCount: 0,
          isAvailable: false,
        };
        onSelectArtwork(customArtwork);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
        stopLiveCamera();
        setIsARMode(true);
        setDragPos({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const getMaterialStyle = () => {
    let background = frameColor;
    if (frameMaterial === "wood") {
      background = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04 0.4' numOctaves='3'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='${encodeURIComponent(frameColor)}'/%3E%3Crect width='100' height='100' filter='url(%23f)' mix-blend-mode='multiply'/%3E%3C/svg%3E")`;
    } else if (frameMaterial === "metal") {
      background = `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 20%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.1) 80%, rgba(0,0,0,0.5) 100%), ${frameColor}`;
    } else if (frameMaterial === "pattern") {
      background = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='2'/%3E%3C/g%3E%3C/svg%3E"), ${frameColor}`;
    }
    return background;
  };

  // Convert logical dimensions to display pixels (scaling factor)
  // Compute safe boundaries taking viewport and active UI bars into account
  const maxAllowedW = viewport.width * (isARMode ? 0.76 : 0.82);
  const maxAllowedH = Math.max(200, (viewport.height - 190) * (isARMode ? 0.68 : 0.74));
  const fitScaleW = maxAllowedW / Math.max(1, artworkWidth);
  const fitScaleH = maxAllowedH / Math.max(1, artworkHeight);
  const maxNaturalScale = viewport.width < 640 ? 2.5 : 3.8;
  const autoFitScale = Math.min(fitScaleW, fitScaleH, maxNaturalScale);

  const displayScale = Math.max(0.8, autoFitScale * customScale);

  const canvasWidth = artworkWidth * displayScale;
  const canvasHeight = artworkHeight * displayScale;

  const handleCaptureAndShare = async () => {
    setIsCapturing(true);
    setActiveTab(null);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const node = document.getElementById("wall-capture-container");
      if (!node) return;

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 0.95,
        backgroundColor: isARMode ? undefined : "#F9F8F6",
        skipFonts: true,
      });

      if (navigator.share) {
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const file = new File([blob], `${currentArtwork.title}-on-wall.png`, {
          type: "image/png",
        });
        await navigator.share({
          title: `${currentArtwork.title} on Wall`,
          text: `Check out ${currentArtwork.title} by ${currentArtwork.artistName} in 3D wall staging!`,
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.download = `${currentArtwork.title}-wall.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSaveToGoogleDrive = async () => {
    setIsCapturing(true);
    setIsSavingToDrive(true);
    setDriveNotification(null);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const node = document.getElementById("wall-capture-container");
      if (!node) return;

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 0.95,
        backgroundColor: isARMode ? undefined : "#F9F8F6",
        skipFonts: true,
      });

      const blob = dataUrlToBlob(dataUrl);
      const safeTitle = currentArtwork.title.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `staging-${safeTitle}-${Date.now()}.png`;

      const driveFile = await uploadFileToDrive(blob, filename, "image/png");

      setDriveNotification({
        text: `Stored "${filename}" in Google Drive folder "Art Wall AR Storage"!`,
        url: driveFile.webViewLink,
      });

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    } catch (err: any) {
      console.error("Save to Drive failed:", err);
      setDriveNotification({
        text: `Drive upload failed: ${err?.message || "Please connect Google Workspace"}`,
      });
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
      }
    } finally {
      setIsCapturing(false);
      setIsSavingToDrive(false);
    }
  };

  const handleResetPose = () => {
    setDragPos({ x: 0, y: 0 });
    setRotation({ rx: 6, ry: -16, rz: -1 });
    setCustomScale(1);
  };

  return (
    <div
      id="wall-capture-container"
      className={`relative w-full h-[calc(100vh-60px)] overflow-hidden font-sans select-none transition-colors duration-700 ${
        isARMode ? "bg-black" : "bg-[#F9F8F6]"
      }`}
    >
      {/* Real-Time Live Camera Feed */}
      {isLiveCameraActive ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
      ) : (
        /* Immersive Room Background */
        isARMode && bgImage && (
          <img
            src={bgImage}
            alt="Room Environment"
            className="absolute inset-0 w-full h-full object-cover sm:object-contain pointer-events-none z-0"
          />
        )
      )}

      {/* Camera Error / Permission Notice */}
      {cameraError && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-white/20 backdrop-blur-md animate-in fade-in">
          <AlertCircle size={15} className="text-amber-400 shrink-0" />
          <span>{cameraError}</span>
          <button
            onClick={() => setCameraError(null)}
            className="text-white/70 hover:text-white ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Google Drive Upload Success Notification */}
      {driveNotification && !isCapturing && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A]/90 text-white text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2.5 border border-blue-400/40 backdrop-blur-md shadow-xl animate-in fade-in max-w-[90vw]">
          <HardDrive size={16} className="text-blue-400 shrink-0" />
          <span className="truncate">{driveNotification.text}</span>
          {driveNotification.url && (
            <a
              href={driveNotification.url}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 ml-1"
            >
              <span>Open</span>
              <ExternalLink size={10} />
            </a>
          )}
          <button
            onClick={() => setDriveNotification(null)}
            className="text-white/70 hover:text-white ml-2 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Floating Staging Bar */}
      {!isCapturing && (
        <div className="absolute top-2.5 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-30 flex items-center justify-between gap-1.5 sm:gap-3 pointer-events-none">
          {/* Artwork Info Pill - Auto-adjusts width to screen size */}
          <div className="bg-white/95 backdrop-blur-md px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border border-white/80 shadow-lg pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-[calc(100%-145px)] sm:max-w-md">
            <img
              src={currentArtwork.imageUrl}
              alt={currentArtwork.title}
              className="w-7 h-8 sm:w-8 sm:h-9 rounded-lg object-cover ring-1 ring-neutral-200 shrink-0"
            />
            <div className="min-w-0 flex-1 truncate pr-0.5">
              <span className="font-serif-custom text-xs sm:text-sm font-light italic text-[#1A1A1A] block leading-tight truncate">
                {currentArtwork.title}
              </span>
              <span className="text-[10px] sm:text-[11px] text-neutral-500 block leading-none font-mono mt-0.5 truncate">
                {artworkWidth}×{artworkHeight}cm • {currentArtwork.price.toLocaleString()} UZS
              </span>
            </div>

            {/* Favorite button */}
            {onToggleLike && (
              <button
                onClick={() => {
                  onToggleLike(currentArtwork.id);
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isLiked ? "bg-rose-50 text-rose-500" : "text-neutral-400 hover:text-rose-500"
                }`}
                title={t.like}
                aria-label={t.like}
              >
                <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
              </button>
            )}

            {/* Basket Button */}
            {currentArtwork.price > 0 && (
              <button
                onClick={() => {
                  onAddToBasket(currentArtwork, {
                    frameColor,
                    frameMaterial,
                    frameThickness,
                    mattingThickness,
                    selectedWidth: artworkWidth,
                    selectedHeight: artworkHeight,
                  });
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
                }}
                className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 ${
                  isInBasket
                    ? "bg-[#6B7B62] text-white"
                    : "bg-[#1A1A1A] hover:bg-black text-white"
                }`}
                title={isInBasket ? t.inBasket : t.addToBasket}
              >
                {isInBasket ? <Check size={13} /> : <ShoppingBag size={13} />}
                <span className="hidden md:inline">
                  {isInBasket ? t.inBasket : t.addToBasket}
                </span>
              </button>
            )}
          </div>

          {/* Action Buttons Cluster - Auto-scaling buttons in a unified floating capsule */}
          <div className="bg-white/95 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-white/80 shadow-lg pointer-events-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Live Camera Toggle */}
            <button
              onClick={() => {
                if (isLiveCameraActive) {
                  stopLiveCamera();
                } else {
                  startLiveCamera();
                }
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
              }}
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isLiveCameraActive
                  ? "bg-rose-600 text-white shadow-xs animate-pulse"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
              }`}
              title={isLiveCameraActive ? t.stopCamera : t.liveCamera}
            >
              <Camera size={14} className="shrink-0" />
              <span className="hidden md:inline">
                {isLiveCameraActive ? t.stopCamera : t.liveCamera}
              </span>
            </button>

            {/* Flip camera if active */}
            {isLiveCameraActive && (
              <button
                onClick={flipCamera}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all flex items-center justify-center cursor-pointer"
                title={t.flipCamera}
              >
                <RefreshCw size={14} />
              </button>
            )}

            {/* 3D Room / Neutral Wall Toggle */}
            <button
              onClick={() => {
                if (isLiveCameraActive) stopLiveCamera();
                setIsARMode(!isARMode);
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`h-8 sm:h-9 px-2 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isARMode
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
              }`}
              title={isARMode ? "Room View" : "Neutral Wall"}
            >
              <Box size={14} className="shrink-0" />
              <span className="hidden sm:inline">
                {isARMode ? "Room" : "Neutral"}
              </span>
            </button>

            {/* Reset Pose */}
            <button
              onClick={() => {
                handleResetPose();
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-all flex items-center justify-center cursor-pointer"
              title={t.reset}
              aria-label={t.reset}
            >
              <RotateCcw size={14} />
            </button>

            {/* Quick Capture Snapshot Button */}
            <button
              onClick={() => {
                handleCaptureAndShare();
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
              }}
              disabled={isCapturing}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              title={t.downloadSnapshot}
            >
              <Camera size={14} className={isCapturing ? "animate-pulse text-amber-500" : "text-[#6B7B62]"} />
              <span className="hidden xl:inline">
                {isCapturing && !isSavingToDrive ? t.saving : "Snapshot"}
              </span>
            </button>

            {/* Save to Google Drive Button */}
            <button
              onClick={() => {
                handleSaveToGoogleDrive();
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("medium");
              }}
              disabled={isCapturing}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
              title="Save Staging Snapshot to Google Drive"
            >
              <HardDrive size={14} className={isSavingToDrive ? "animate-spin text-blue-600" : "text-blue-600"} />
              <span className="hidden xl:inline">
                {isSavingToDrive ? "Saving..." : "To Drive"}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => {
                onOpenShareModal(currentArtwork);
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-all flex items-center justify-center cursor-pointer"
              title={t.share}
              aria-label={t.share}
            >
              <Share size={14} />
            </button>
          </div>
        </div>
      )}

      {/* AR Transform & Angle Presets Bar - Automatically adjusts width & padding */}
      {isARMode && !isCapturing && (
        <div className="absolute top-14 sm:top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center gap-1.5 max-w-[96vw]">
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-white/80 shadow-md flex items-center gap-0.5 sm:gap-1 max-w-full overflow-x-auto scrollbar-none">
            {(["move", "rotate", "scale"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setTransformMode(mode);
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                }}
                className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 ${
                  transformMode === mode
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {mode === "move" && <Move size={12} className="shrink-0" />}
                {mode === "rotate" && <RotateCcw size={12} className="shrink-0" />}
                {mode === "scale" && <Maximize size={12} className="shrink-0" />}
                <span>
                  {t[mode as keyof typeof t] || mode}
                </span>
              </button>
            ))}

            <div className="w-[1px] h-3.5 bg-neutral-200 mx-0.5 shrink-0" />

            {/* Quick Angles with responsive sizing */}
            <button
              onClick={() => {
                setRotation({ rx: 0, ry: 0, rz: 0 });
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all shrink-0 ${
                rotation.ry === 0 && rotation.rx === 0
                  ? "bg-[#6B7B62] text-white"
                  : "text-neutral-600 hover:text-black hover:bg-neutral-100"
              }`}
              title="Front Angle (0°)"
            >
              Front
            </button>
            <button
              onClick={() => {
                setRotation({ rx: 2, ry: -25, rz: 0 });
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all shrink-0 ${
                rotation.ry < -10 ? "bg-[#6B7B62] text-white" : "text-neutral-600 hover:text-black hover:bg-neutral-100"
              }`}
              title="Left Angle (30°)"
            >
              30° L
            </button>
            <button
              onClick={() => {
                setRotation({ rx: 2, ry: 25, rz: 0 });
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all shrink-0 ${
                rotation.ry > 10 ? "bg-[#6B7B62] text-white" : "text-neutral-600 hover:text-black hover:bg-neutral-100"
              }`}
              title="Right Angle (30°)"
            >
              30° R
            </button>
          </div>
        </div>
      )}

      {/* Floating On-Canvas Quick Controls (Right Edge) */}
      {!isCapturing && (
        <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto flex flex-col items-center gap-1 bg-white/95 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-white/80 shadow-lg">
          <button
            onClick={() => {
              setCustomScale((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-sm active:scale-95 transition-all cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            +
          </button>
          <div className="text-[9px] sm:text-[10px] font-mono font-bold text-center text-neutral-500 select-none py-0.5">
            {Math.round(customScale * 100)}%
          </div>
          <button
            onClick={() => {
              setCustomScale((prev) => Math.max(0.4, Math.round((prev - 0.15) * 100) / 100));
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-sm active:scale-95 transition-all cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            -
          </button>
        </div>
      )}

      {/* 3D Scene / AR Canvas */}
      <main
        className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden touch-none"
        style={{ perspective: "1200px" }}
        onClick={() => activeTab && setActiveTab(null)}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative ${
            isDragging ? "" : "transition-all duration-500 ease-out"
          } cursor-grab active:cursor-grabbing touch-none`}
          style={{
            transformStyle: "preserve-3d",
            transform: isARMode
              ? `translate3d(${dragPos.x}px, ${dragPos.y}px, 0) scale(0.9) rotateY(${rotation.ry}deg) rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)`
              : `rotateY(${rotation.ry}deg) rotateX(${rotation.rx}deg) rotateZ(${rotation.rz}deg)`,
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* The Physical 3D Frame */}
          <div
            className="w-full h-full relative box-border"
            style={{
              background: getMaterialStyle(),
              padding: `${frameThickness * (displayScale / 2)}px`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* 3D Frame Faces */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Back face */}
              <div
                className="absolute inset-0"
                style={{
                  background: getMaterialStyle(),
                  transform: "translateZ(-24px)",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                }}
              />
              {/* Top face */}
              <div
                className="absolute left-0 top-0 w-full origin-top brightness-[0.85]"
                style={{
                  background: getMaterialStyle(),
                  height: "24px",
                  transform: "rotateX(-90deg)",
                }}
              />
              {/* Bottom face */}
              <div
                className="absolute left-0 bottom-0 w-full origin-bottom brightness-[0.25]"
                style={{
                  background: getMaterialStyle(),
                  height: "24px",
                  transform: "rotateX(90deg)",
                }}
              />
              {/* Left face */}
              <div
                className="absolute left-0 top-0 h-full origin-left brightness-[0.65]"
                style={{
                  background: getMaterialStyle(),
                  width: "24px",
                  transform: "rotateY(90deg)",
                }}
              />
              {/* Right face */}
              <div
                className="absolute right-0 top-0 h-full origin-right brightness-[0.45]"
                style={{
                  background: getMaterialStyle(),
                  width: "24px",
                  transform: "rotateY(-90deg)",
                }}
              />
            </div>

            {/* Matting */}
            <div
              className="w-full h-full bg-white transition-all duration-300 relative overflow-hidden shadow-inner"
              style={{
                padding: `${mattingThickness * (displayScale / 2)}px`,
              }}
            >
              {/* Artwork Canvas */}
              <div
                className="w-full h-full relative bg-[#E8E6E1] overflow-hidden flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.06)]"
              >
                <img
                  src={currentArtwork.imageUrl}
                  alt={currentArtwork.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>

            {/* Inner frame shadow depth */}
            <div
              className="absolute inset-0 pointer-events-none shadow-[inset_0_3px_15px_rgba(0,0,0,0.3)]"
              style={{ margin: `${frameThickness * (displayScale / 2)}px` }}
            />
          </div>
        </div>
      </main>

      {/* Contextual Popovers for Tabs */}
      {!isCapturing && (
        <div className="absolute bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+56px)] sm:bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+64px)] left-0 w-full flex items-end justify-center pointer-events-none p-2 sm:p-4 z-30">
          <div
            className={`bg-white/95 backdrop-blur-xl p-3.5 sm:p-5 rounded-3xl shadow-2xl border border-neutral-200/80 transition-all duration-300 ease-out w-full max-w-[min(440px,calc(100vw-1rem))] max-h-[55vh] sm:max-h-[65vh] overflow-y-auto pointer-events-auto origin-bottom ${
              activeTab
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none"
            }`}
          >
            {/* Drawer Header with Close Button for effortless Mobile Dismissal */}
            {activeTab && (
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-100">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  {activeTab === "Upload" && <ImageIcon size={14} className="text-[#6B7B62]" />}
                  {activeTab === "Rooms" && <Layers size={14} className="text-[#6B7B62]" />}
                  {activeTab === "Frame" && <Square size={14} className="text-[#6B7B62]" />}
                  {activeTab === "Size" && <Sliders size={14} className="text-[#6B7B62]" />}
                  <span>{activeTab === "Upload" ? t.artwork : activeTab === "Rooms" ? t.roomsTab : activeTab === "Frame" ? t.frameTab : t.sizeTab}</span>
                </span>
                <button
                  onClick={() => {
                    setActiveTab(null);
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                  }}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  aria-label="Close panel"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Art / Sample Selector Tab */}
            {activeTab === "Upload" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.artwork}
                </span>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload size={14} />
                  {t.uploadCustomImage}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomArtworkUpload}
                  accept="image/*"
                  className="hidden"
                />

                <span className="text-[11px] font-medium text-neutral-600 mt-1">
                  {t.sampleGallery}
                </span>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {allArtworks.map((art) => (
                    <button
                      key={art.id}
                      onClick={() => onSelectArtwork(art)}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-transform ${
                        currentArtwork.id === art.id
                          ? "ring-2 ring-[#6B7B62] scale-95"
                          : "hover:scale-105"
                      }`}
                    >
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Room Presets Tab */}
            {activeTab === "Rooms" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.environments}
                </span>

                {/* Live Camera Button inside Rooms tab too */}
                <button
                  onClick={() => {
                    if (isLiveCameraActive) stopLiveCamera();
                    else startLiveCamera();
                    setActiveTab(null);
                  }}
                  className="w-full py-2.5 px-3 bg-[#1A1A1A] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Camera size={15} />
                  {isLiveCameraActive ? t.stopCamera : t.startCamera}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => cameraFileInputRef.current?.click()}
                    className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Camera size={14} />
                    {t.takePicture}
                  </button>
                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
                  >
                    <Upload size={14} />
                    {t.uploadCustomEnv}
                  </button>
                </div>

                <input
                  type="file"
                  ref={bgFileInputRef}
                  onChange={handleBgImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraFileInputRef}
                  onChange={handleBgImageUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <span className="text-[11px] font-medium text-neutral-600 mt-1">
                  {t.sampleRooms}
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {roomPresets.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        stopLiveCamera();
                        setBgImage(room.src);
                        setIsARMode(true);
                      }}
                      className={`relative aspect-video rounded-xl overflow-hidden border transition-all ${
                        !isLiveCameraActive && bgImage === room.src
                          ? "ring-2 ring-[#6B7B62] scale-95"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={room.src}
                        alt={room.id}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2">
                        <span className="text-white text-[10px] font-bold">
                          {t[room.labelKey as keyof typeof t]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frame Settings Tab */}
            {activeTab === "Frame" && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.frameTab}
                </span>

                {/* Color choices */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-700">{t.frameColor}</span>
                  <div className="flex gap-2">
                    {["#000000", "#D6B996", "#4A3728", "#FFFFFF"].map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setFrameColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full border border-black/20 ${
                          frameColor === hex ? "ring-2 ring-[#6B7B62] scale-110" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Material choices */}
                <div>
                  <span className="text-xs text-neutral-700 block mb-1.5">
                    {t.frameMaterial}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(["solid", "wood", "metal", "pattern"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setFrameMaterial(m);
                          window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-medium capitalize transition-all cursor-pointer ${
                          frameMaterial === m
                            ? "bg-[#1A1A1A] text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        {t[m as keyof typeof t]}
                      </button>
                    ))}
                  </div>
                </div>

                <CustomSlider
                  label={t.frameThickness}
                  value={frameThickness}
                  unit="cm"
                  min={1}
                  max={6}
                  onChange={setFrameThickness}
                />

                <CustomSlider
                  label={t.mattingThickness}
                  value={mattingThickness}
                  unit="cm"
                  min={0}
                  max={6}
                  onChange={setMattingThickness}
                />
              </div>
            )}

            {/* Size & Tilt Tab */}
            {activeTab === "Size" && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  {t.sizeTab}
                </span>

                <CustomSlider
                  label={t.width}
                  value={artworkWidth}
                  unit="cm"
                  min={20}
                  max={150}
                  onChange={setArtworkWidth}
                />

                <CustomSlider
                  label={t.height}
                  value={artworkHeight}
                  unit="cm"
                  min={20}
                  max={150}
                  onChange={setArtworkHeight}
                />

                <CustomSlider
                  label={t.scale}
                  value={Math.round(customScale * 100)}
                  unit="%"
                  min={50}
                  max={200}
                  onChange={(val) => setCustomScale(val / 100)}
                />

                <CustomSlider
                  label={t.tiltHorizontal}
                  value={Math.round(rotation.ry)}
                  unit="°"
                  min={-60}
                  max={60}
                  onChange={(ry) => setRotation({ ...rotation, ry })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Dock Navigation Tabs - Automatically adjusts to screen size and layout */}
      {!isCapturing && (
        <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-0 w-full flex justify-center z-30 pointer-events-auto px-2 sm:px-4">
          <div className="bg-white/95 backdrop-blur-xl p-1 sm:p-1.5 rounded-2xl border border-neutral-200/80 shadow-2xl flex items-center gap-1 sm:gap-1.5 w-full max-w-[min(520px,calc(100vw-1rem))]">
            <button
              onClick={() => {
                setActiveTab(activeTab === "Upload" ? null : "Upload");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 min-h-[42px] sm:min-h-[46px] px-1 sm:px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate ${
                activeTab === "Upload"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <ImageIcon size={15} className="shrink-0" />
              <span className="truncate">{t.uploadTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab(activeTab === "Rooms" ? null : "Rooms");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 min-h-[42px] sm:min-h-[46px] px-1 sm:px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate ${
                activeTab === "Rooms"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Layers size={15} className="shrink-0" />
              <span className="truncate">{t.roomsTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab(activeTab === "Frame" ? null : "Frame");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 min-h-[42px] sm:min-h-[46px] px-1 sm:px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate ${
                activeTab === "Frame"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Square size={15} className="shrink-0" />
              <span className="truncate">{t.frameTab}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab(activeTab === "Size" ? null : "Size");
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
              }}
              className={`flex-1 min-h-[42px] sm:min-h-[46px] px-1 sm:px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate ${
                activeTab === "Size"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Sliders size={15} className="shrink-0" />
              <span className="truncate">{t.sizeTab}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
