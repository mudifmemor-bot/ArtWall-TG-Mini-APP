import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Upload,
  Trash2,
  AlertCircle,
  Folder,
  FileImage,
  FileText,
  Shield,
  Sparkles,
  UserCheck,
  Check,
  Clock,
  ChevronRight,
} from "lucide-react";
import { TelegramUser, GoogleDriveFile, GoogleWorkspaceState, Language } from "../types";
import {
  requestGoogleAccessToken,
  disconnectGoogle,
  getStoredWorkspaceState,
  syncUsersToGoogleSheet,
  fetchUsersFromGoogleSheet,
  ensureDriveFolder,
  uploadFileToDrive,
  listDriveStorageFiles,
  deleteDriveStorageFile,
} from "../services/googleWorkspace";

interface Props {
  users: TelegramUser[];
  onUpdateUsers?: (users: TelegramUser[]) => void;
  lang?: Language;
  onClose?: () => void;
}

export const GoogleWorkspacePanel: React.FC<Props> = ({
  users,
  onUpdateUsers,
  lang = "en",
  onClose,
}) => {
  const [workspaceState, setWorkspaceState] = useState<GoogleWorkspaceState>(getStoredWorkspaceState());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isPullingSheet, setIsPullingSheet] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "sheets" | "drive">("all");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Refresh files whenever connected
  const refreshDriveFiles = async () => {
    if (!workspaceState.isConnected) return;
    setIsLoadingFiles(true);
    try {
      const files = await listDriveStorageFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.warn("Could not list drive files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (workspaceState.isConnected) {
      refreshDriveFiles();
    }
  }, [workspaceState.isConnected]);

  // Connect Google account handler
  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setSyncMessage(null);
    try {
      await requestGoogleAccessToken("consent");
      const updated = getStoredWorkspaceState();
      setWorkspaceState(updated);
      setSyncMessage({
        text: "Google Account connected successfully with Sheets & Drive permissions.",
        type: "success",
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    } catch (err: any) {
      setSyncMessage({
        text: err?.message || "Google authorization was cancelled or failed.",
        type: "error",
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("error");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Disconnect handler
  const handleDisconnect = () => {
    disconnectGoogle();
    setWorkspaceState({ isConnected: false });
    setDriveFiles([]);
    setSyncMessage({ text: "Google Workspace disconnected.", type: "success" });
  };

  // Sync Users to Google Sheet handler
  const handleSyncToSheets = async () => {
    setIsSyncingSheet(true);
    setSyncMessage(null);
    try {
      const res = await syncUsersToGoogleSheet(users);
      setWorkspaceState(getStoredWorkspaceState());
      setSyncMessage({
        text: `Successfully synced ${res.updatedCount} users to Google Sheet!`,
        type: "success",
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    } catch (err: any) {
      setSyncMessage({
        text: `Sheets Sync Failed: ${err?.message || "Unknown error"}`,
        type: "error",
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("error");
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Pull Users from Google Sheet handler
  const handlePullFromSheets = async () => {
    if (!workspaceState.spreadsheetId) return;
    setIsPullingSheet(true);
    setSyncMessage(null);
    try {
      const importedUsers = await fetchUsersFromGoogleSheet(workspaceState.spreadsheetId);
      if (importedUsers.length > 0 && onUpdateUsers) {
        onUpdateUsers(importedUsers);
        setSyncMessage({
          text: `Imported ${importedUsers.length} users from Google Sheet into platform!`,
          type: "success",
        });
      } else {
        setSyncMessage({
          text: "Found no valid user rows in Google Sheet.",
          type: "error",
        });
      }
    } catch (err: any) {
      setSyncMessage({
        text: `Import Failed: ${err?.message || "Unknown error"}`,
        type: "error",
      });
    } finally {
      setIsPullingSheet(false);
    }
  };

  // Upload custom file to Google Drive
  const handleFileUploadToDrive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDrive(true);
    setUploadProgress(`Uploading ${file.name}...`);
    try {
      const uploaded = await uploadFileToDrive(file, file.name, file.type || "application/octet-stream");
      setDriveFiles((prev) => [uploaded, ...prev]);
      setSyncMessage({
        text: `File "${file.name}" stored in Google Drive (Art Wall AR Storage)!`,
        type: "success",
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    } catch (err: any) {
      setSyncMessage({
        text: `Drive Upload Failed: ${err?.message || "Unknown error"}`,
        type: "error",
      });
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("error");
    } finally {
      setIsUploadingDrive(false);
      setUploadProgress(null);
      // Reset input
      e.target.value = "";
    }
  };

  // Delete Drive file
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}" from Google Drive?`)) return;
    try {
      await deleteDriveStorageFile(fileId);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSyncMessage({ text: `Deleted "${fileName}" from Google Drive.`, type: "success" });
    } catch (err: any) {
      setSyncMessage({ text: `Delete Failed: ${err?.message}`, type: "error" });
    }
  };

  return (
    <div className="w-full max-w-full bg-white rounded-3xl border border-[#E8E6E1] shadow-xs overflow-hidden mb-8">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-7 bg-gradient-to-r from-neutral-900 via-[#1E293B] to-[#0F172A] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <Sparkles size={24} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif-custom text-xl sm:text-2xl font-light italic truncate">
                  Google Workspace Cloud
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Active
                </span>
              </div>
              <p className="text-xs text-neutral-300 font-light mt-0.5 truncate">
                Google Sheets for user data & Google Drive for high-res artwork storage
              </p>
            </div>
          </div>

          {/* Connection Status Pill / Button */}
          <div className="shrink-0">
            {workspaceState.isConnected ? (
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl max-w-full">
                {workspaceState.userPicture ? (
                  <img
                    src={workspaceState.userPicture}
                    alt={workspaceState.userName || "Google User"}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-400 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                    {workspaceState.userName?.[0] || "G"}
                  </div>
                )}
                <div className="text-left leading-none min-w-0">
                  <span className="text-xs font-bold block truncate max-w-[120px] sm:max-w-[140px]">
                    {workspaceState.userName || "Connected"}
                  </span>
                  <span className="text-[10px] text-neutral-300 block truncate max-w-[120px] sm:max-w-[140px] font-mono mt-0.5">
                    {workspaceState.userEmail || "Google Account"}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="text-[10px] text-red-300 hover:text-red-100 uppercase tracking-wider font-bold ml-2 underline cursor-pointer shrink-0"
                  title="Disconnect Google Account"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isAuthenticating}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin text-neutral-500" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                      alt="Google"
                      className="w-4 h-4 object-contain"
                    />
                    <span>Connect Google Account</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Filter Tabs */}
        <div className="w-full max-w-full flex items-center gap-1.5 sm:gap-2 mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 overflow-x-auto no-scrollbar touch-pan-x">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-neutral-900 font-bold"
                : "text-neutral-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("sheets")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "sheets"
                ? "bg-white text-neutral-900 font-bold"
                : "text-neutral-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <FileSpreadsheet size={14} className="text-emerald-500 shrink-0" />
            <span>Google Sheets <span className="hidden sm:inline">(User Directory)</span></span>
          </button>
          <button
            onClick={() => setActiveTab("drive")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === "drive"
                ? "bg-white text-neutral-900 font-bold"
                : "text-neutral-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <HardDrive size={14} className="text-blue-400 shrink-0" />
            <span>Google Drive <span className="hidden sm:inline">(Cloud Storage)</span></span>
          </button>
        </div>
      </div>

      {/* Sync / Notification Alert Banner */}
      {syncMessage && (
        <div
          className={`p-4 text-xs font-medium flex items-center justify-between border-b ${
            syncMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncMessage.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-neutral-400 hover:text-neutral-600 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-3.5 sm:p-7 space-y-6">
        {/* =========================================================================
            SECTION 1: GOOGLE SHEETS USER DIRECTORY
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "sheets") && (
          <div className="rounded-2xl border border-neutral-200 p-3.5 sm:p-6 bg-neutral-50/70">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 flex items-center gap-2">
                    <span>Google Sheets: User Directory List</span>
                    {workspaceState.spreadsheetId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check size={11} /> Linked
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">
                    Sync authenticated Telegram users, collectors, and artists directly to your spreadsheet.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncToSheets}
                  disabled={isSyncingSheet}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Push current platform users to Google Sheet"
                >
                  <RefreshCw size={13} className={isSyncingSheet ? "animate-spin" : ""} />
                  <span>{isSyncingSheet ? "Syncing..." : "Sync Users to Sheet"}</span>
                </button>

                {workspaceState.spreadsheetUrl && (
                  <a
                    href={workspaceState.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <span>Open Live Sheet</span>
                    <ExternalLink size={13} className="text-neutral-500" />
                  </a>
                )}

                {workspaceState.spreadsheetId && (
                  <button
                    onClick={handlePullFromSheets}
                    disabled={isPullingSheet}
                    className="px-3.5 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Import updated user records from Google Sheet"
                  >
                    <span>Pull from Sheet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sheets Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Platform Users Ready
                </span>
                <span className="text-lg font-mono font-bold text-neutral-900 mt-1 block">
                  {users.length} Records
                </span>
                <span className="text-[11px] text-neutral-500">
                  {users.filter((u) => u.role === "artist").length} Artists • {users.filter((u) => u.role === "buyer").length} Buyers
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Spreadsheet Status
                </span>
                <span className="text-sm font-bold text-neutral-900 mt-1 block truncate">
                  {workspaceState.spreadsheetId ? "Art Wall AR - Users" : "Ready to Create"}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono truncate block">
                  {workspaceState.spreadsheetId ? `ID: ${workspaceState.spreadsheetId.slice(0, 16)}...` : "Click Sync Users to generate"}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Last Synchronization
                </span>
                <span className="text-xs font-mono font-bold text-neutral-800 mt-1 block truncate">
                  {workspaceState.lastSyncedAt
                    ? new Date(workspaceState.lastSyncedAt).toLocaleString()
                    : "Not yet synced"}
                </span>
                <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <Clock size={11} /> Auto-formatted columns
                </span>
              </div>
            </div>

            {/* Column Schema preview */}
            <div className="bg-white rounded-xl p-3 border border-neutral-200 text-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold mb-2">
                <span>Spreadsheet Columns:</span>
                <span className="font-mono text-[10px] text-neutral-400">10 Schema Fields</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "User ID",
                  "First Name",
                  "Last Name",
                  "Telegram Username",
                  "Phone Number",
                  "Platform Role",
                  "Location",
                  "Bio / Description",
                  "Joined Date",
                  "Last Synced",
                ].map((col) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-mono border border-neutral-200"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: GOOGLE DRIVE CLOUD STORAGE
           ========================================================================= */}
        {(activeTab === "all" || activeTab === "drive") && (
          <div className="rounded-2xl border border-neutral-200 p-5 sm:p-6 bg-neutral-50/70">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 flex items-center gap-2">
                    <span>Google Drive: Artwork & Room Staging Storage</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Folder: Art Wall AR Storage
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">
                    Store high-res studio paintings, certificates, and collector room staging previews.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer">
                  <Upload size={13} />
                  <span>{isUploadingDrive ? (uploadProgress || "Uploading...") : "Upload File to Drive"}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUploadToDrive}
                    disabled={isUploadingDrive}
                  />
                </label>

                <button
                  onClick={refreshDriveFiles}
                  disabled={isLoadingFiles}
                  className="p-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-all cursor-pointer"
                  title="Refresh File List"
                >
                  <RefreshCw size={14} className={isLoadingFiles ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Storage Drive Files Browser */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-3 bg-neutral-100/60 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-600 font-semibold">
                <div className="flex items-center gap-2">
                  <Folder size={14} className="text-amber-500" />
                  <span>Stored Files in Google Drive</span>
                </div>
                <span className="font-mono text-[11px] text-neutral-400">
                  {driveFiles.length} files located
                </span>
              </div>

              {driveFiles.length === 0 ? (
                <div className="p-8 text-center">
                  <HardDrive size={32} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-xs font-medium text-neutral-600">
                    No files uploaded to Drive yet
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1 max-w-sm mx-auto">
                    When you save room wall stagings in 3D or upload artworks in the Studio, your files will appear here directly backed up to Google Drive.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 hover:bg-neutral-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.thumbnailLink ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                        ) : file.mimeType.includes("image") ? (
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <FileImage size={16} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <FileText size={16} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <span className="font-medium text-xs text-neutral-900 block truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono block truncate">
                            {file.mimeType} {file.createdTime ? `• ${new Date(file.createdTime).toLocaleDateString()}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete from Drive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
