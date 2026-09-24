import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Persistent Data Storage Paths
const DATA_DIR = path.resolve(__dirname, "data");
const USERS_FILE = path.resolve(DATA_DIR, "users.json");
const ARTWORKS_FILE = path.resolve(DATA_DIR, "artworks.json");

// Default initial users
const DEFAULT_USERS = [
  {
    id: 101,
    first_name: "Elena",
    last_name: "Rostova",
    username: "elena_art_studio",
    phone_number: "+998 90 987 65 43",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    role: "artist",
    bio: "Contemporary mixed media artist creating spatial dialogue through texture and light.",
    location: "Tashkent Studio",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: 102,
    first_name: "Azizbek",
    last_name: "Karimov",
    username: "aziz_samarkand_art",
    phone_number: "+998 93 456 78 90",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    role: "artist",
    bio: "Ceramic textured acrylics and architectural heritage.",
    location: "Samarkand",
    createdAt: "2026-03-05T12:00:00.000Z",
  },
  {
    id: 103,
    first_name: "Mikhail",
    last_name: "Voronin",
    username: "voronin_m_art",
    phone_number: "+998 97 123 99 88",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    role: "artist",
    bio: "Minimalist geometry and atmospheric tones.",
    location: "Tashkent",
    createdAt: "2026-03-10T14:30:00.000Z",
  },
  {
    id: 201,
    first_name: "Rustam",
    last_name: "Aliev",
    username: "rustam_collector",
    phone_number: "+998 91 234 56 78",
    photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    role: "buyer",
    location: "Tashkent",
    createdAt: "2026-03-12T09:15:00.000Z",
  },
  {
    id: 202,
    first_name: "Daria",
    last_name: "Sokolova",
    username: "daria_artlover",
    phone_number: "+7 701 555 43 21",
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    role: "buyer",
    location: "Almaty",
    createdAt: "2026-03-15T11:20:00.000Z",
  },
  {
    id: 203,
    first_name: "Farrukh",
    last_name: "Khamidov",
    username: "farrukh_interior",
    phone_number: "+998 99 888 77 66",
    photo_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
    role: "buyer",
    location: "Tashkent",
    createdAt: "2026-03-18T16:45:00.000Z",
  },
  {
    id: 999,
    first_name: "Muxammadsiddiq",
    last_name: "Admin",
    username: "muxammadsiddiq_23",
    phone_number: "+998 90 123 45 67",
    photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    role: "admin",
    bio: "Chief curator & Art Wall platform operations administrator.",
    location: "HQ Tashkent",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

// Ensure data directory exists
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
  }
  if (!fs.existsSync(ARTWORKS_FILE)) {
    fs.writeFileSync(ARTWORKS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readUsers(): any[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading users:", err);
    return DEFAULT_USERS;
  }
}

function writeUsers(users: any[]) {
  ensureStorage();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function readArtworks(): any[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(ARTWORKS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading artworks:", err);
    return [];
  }
}

function writeArtworks(artworks: any[]) {
  ensureStorage();
  fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), "utf-8");
}

// Initialize on startup
ensureStorage();

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    storage: "ready",
    usersCount: readUsers().length,
    artworksCount: readArtworks().length,
    timestamp: new Date().toISOString(),
  });
});

// GET all registered platform users
app.get("/api/users", (_req: Request, res: Response) => {
  try {
    const users = readUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load users" });
  }
});

// POST register or update user (called on onboarding / profile change)
app.post("/api/users", (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    if (!incoming || !incoming.id) {
      return res.status(400).json({ error: "Missing required user id" });
    }

    const users = readUsers();
    const cleanUsername = incoming.username ? incoming.username.replace(/^@/, "").trim().toLowerCase() : "";

    const existingIndex = users.findIndex((u) => {
      const uUsername = u.username ? u.username.replace(/^@/, "").trim().toLowerCase() : "";
      return u.id === incoming.id || (cleanUsername && uUsername === cleanUsername);
    });

    const userWithTimestamp = {
      ...incoming,
      createdAt: incoming.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...userWithTimestamp,
      };
    } else {
      // Prepend newest signed up user
      users.unshift(userWithTimestamp);
    }

    writeUsers(users);
    res.json({
      success: true,
      user: userWithTimestamp,
      totalUsers: users.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save user" });
  }
});

// Batch update users (e.g. from Google Sheet pull)
app.post("/api/users/batch", (req: Request, res: Response) => {
  try {
    const incomingList = req.body.users;
    if (!Array.isArray(incomingList)) {
      return res.status(400).json({ error: "Expected array of users" });
    }

    const current = readUsers();
    const userMap = new Map();

    // Preserve existing
    current.forEach((u) => userMap.set(u.id, u));
    // Merge new ones
    incomingList.forEach((u) => {
      if (u && u.id) {
        userMap.set(u.id, { ...(userMap.get(u.id) || {}), ...u });
      }
    });

    const merged = Array.from(userMap.values());
    writeUsers(merged);

    res.json({ success: true, count: merged.length, users: merged });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to batch save users" });
  }
});

// GET uploaded community artworks
app.get("/api/artworks", (_req: Request, res: Response) => {
  try {
    const artworks = readArtworks();
    res.json(artworks);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load artworks" });
  }
});

// POST new artwork created by artist
app.post("/api/artworks", (req: Request, res: Response) => {
  try {
    const artwork = req.body;
    if (!artwork || !artwork.id || !artwork.title) {
      return res.status(400).json({ error: "Invalid artwork payload" });
    }

    const artworks = readArtworks();
    const existingIndex = artworks.findIndex((a) => a.id === artwork.id);

    if (existingIndex >= 0) {
      artworks[existingIndex] = artwork;
    } else {
      artworks.unshift(artwork);
    }

    writeArtworks(artworks);
    res.json({ success: true, artwork, totalArtworks: artworks.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save artwork" });
  }
});

// DELETE artwork
app.delete("/api/artworks/:id", (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const artworks = readArtworks();
    const filtered = artworks.filter((a) => a.id !== id);
    writeArtworks(filtered);
    res.json({ success: true, totalArtworks: filtered.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete artwork" });
  }
});

// ----------------------------------------------------
// VITE DEV SERVER MIDDLEWARE & STATIC PRODUCTION
// ----------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(port), "0.0.0.0", () => {
    console.log(`ArtWall Server running on http://0.0.0.0:${port} [mode: ${isProduction ? "production" : "development"}]`);
  });
}

startServer();
