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

// Default initial users (Empty - strictly real Telegram users only)
const DEFAULT_USERS: any[] = [];

// Ensure data directory exists
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
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
    return [];
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

// DELETE all users from database (Admin reset)
app.delete("/api/users", (_req: Request, res: Response) => {
  try {
    writeUsers([]);
    res.json({ success: true, message: "All users deleted successfully", count: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to clear users" });
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
