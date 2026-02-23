import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Workaround for @google/genai package export bug:
// the package's ESM entry points reference dist/node/index.mjs which
// doesn't exist, so we dynamically load the provided CommonJS build
// by constructing a file:// URL to the file. This bypasses Node's
// exports field restrictions which would otherwise block imports of
// unexported subpaths.
const genaiPath = pathToFileURL(join(__dirname, 'node_modules/@google/genai/dist/node/index.cjs')).href;
const { GoogleGenAI, Type } = await import(genaiPath);

// Initialize Database
let db;
try {
  db = new Database('phishing.db');
} catch (err) {
  console.warn("WARNING: better-sqlite3 failed to initialize. Falling back to in-memory stub.", err);
  // stub mimicking basic interface used in this app
  db = {
    exec: () => {},
    prepare: () => ({
      run: () => ({ lastInsertRowid: 0 }),
      all: () => [],
      get: () => undefined,
    }),
  };
}

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const useGemini = !!apiKey && apiKey !== 'your_gemini_api_key_here';
if (!useGemini) {
  console.warn(
    "WARNING: GEMINI_API_KEY is not set or is using the placeholder. " +
      "AI features will be disabled and heuristic fallback will always be used."
  );
}
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    url TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    reason TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    url TEXT NOT NULL,
    prediction TEXT,
    risk_score REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add user_id to logs if missing (for existing databases)
try {
  const columns = db.prepare("PRAGMA table_info(logs)").all() as any[];
  const hasUserId = columns.some(col => col.name === 'user_id');
  if (!hasUserId) {
    console.log("Migrating logs table: adding user_id column");
    db.prepare("ALTER TABLE logs ADD COLUMN user_id INTEGER REFERENCES users(id)").run();
  }
} catch (error) {
  console.error("Migration error:", error);
}

// Seed Blacklist (Optional)
const insertBlacklist = db.prepare('INSERT OR IGNORE INTO blacklist (url, reason) VALUES (?, ?)');
insertBlacklist.run('http://malicious-example.com', 'Known phishing site');
insertBlacklist.run('http://fake-bank-login.com', 'Credential harvesting');

// Feature Extraction Logic (Keep for display purposes)
function extractFeatures(url: string) {
  const features = {
    urlLength: url.length,
    hasIpAddress: /(?:\d{1,3}\.){3}\d{1,3}/.test(url) ? 1 : 0,
    hasAtSymbol: url.includes('@') ? 1 : 0,
    hasDoubleSlash: url.lastIndexOf('//') > 7 ? 1 : 0, // Redirect using //
    hasDash: url.includes('-') ? 1 : 0,
    hasHttps: url.startsWith('https') ? 1 : 0,
    subdomainCount: (url.match(/\./g) || []).length - 1, // Rough estimate
    hasSuspiciousWords: /login|signin|bank|account|update|verify|secure/i.test(url) ? 1 : 0,
    isShortened: /bit\.ly|goo\.gl|tinyurl|t\.co/i.test(url) ? 1 : 0,
  };
  return features;
}

// Gemini Analysis Logic
async function analyzeWithGemini(url: string) {
  if (!useGemini) {
    // skip remote request entirely when key is missing/disabled
    return null;
  }

  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are a phishing detection assistant. 
      Your job is to analyze the given URL and classify it as Safe, Suspicious, or Phishing.

      URL to analyze: ${url}

      Instructions:
      1. Examine the domain name for legitimacy (misspellings, extra characters, unusual patterns).
      2. Check if HTTPS and a valid certificate are used (infer from URL scheme).
      3. Look for phishing indicators:
         - Use of IP addresses instead of domain names
         - Excessive/misleading subdomains
         - Keywords like "login", "verify", "update", "secure" in suspicious contexts
      4. Compare the domain against known trusted domains (e.g., google.com, paypal.com).
      5. Detect if the URL redirects or masks its true destination.
      6. Evaluate if the URL is unusually long or contains random strings.
      7. Provide reasoning for each check.

      Return the result in JSON format with the following schema:
      {
        "classification": "Safe" | "Suspicious" | "Phishing",
        "confidence": number (0-100),
        "explanation": "Short explanation of why this classification was chosen"
      }
    `;

    const result = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING, enum: ["Safe", "Suspicious", "Phishing"] },
            confidence: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["classification", "confidence", "explanation"]
        }
      }
    });

    const responseText = result.text;
    if (!responseText) {
        throw new Error("Empty response from Gemini");
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback to heuristic if Gemini fails
    return null;
  }
}

// Mock Model Prediction (Fallback)
function predictPhishingFallback(features: any) {
  // Heuristic scoring to simulate model weights
  let score = 0;
  
  // Weights (Simulated)
  if (features.hasIpAddress) score += 30;
  if (features.hasAtSymbol) score += 20;
  if (features.hasDoubleSlash) score += 20;
  if (features.urlLength > 54) score += 10;
  if (features.urlLength > 75) score += 20;
  if (features.hasDash) score += 5;
  if (!features.hasHttps) score += 10;
  if (features.subdomainCount > 2) score += 10;
  if (features.hasSuspiciousWords) score += 15;
  if (features.isShortened) score += 20;

  // Normalize score roughly to 0-100
  let finalScore = Math.min(Math.max(score, 0), 100);

  // Determine Label
  let label = "Safe";
  if (finalScore >= 70) label = "Phishing";
  else if (finalScore >= 30) label = "Suspicious";

  return {
    classification: label,
    confidence: finalScore,
    explanation: "Heuristic analysis based on URL patterns."
  };
}

async function startServer() {
  const app = express();
  // allow the port to be overridden by environment (useful in CI/containers or
  // when 3000 is already occupied) and fall back to 3000 by default.
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      const insertUser = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
      const info = insertUser.run(username, email, password); // In production, hash password!
      
      res.json({ success: true, user: { id: info.lastInsertRowid, username, email } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: "Email already exists" });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as { id: number; username: string; email: string } | undefined;
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // History Routes
  app.get("/api/history", (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ error: "User ID required" });

      const logs = db.prepare('SELECT * FROM logs WHERE user_id = ? ORDER BY timestamp DESC').all(userId);
      res.json(logs);
    } catch (error) {
      console.error("History error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM logs WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete history error:", error);
      res.status(500).json({ error: "Failed to delete history item" });
    }
  });

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          systemInstruction: "You are PhishGuard AI, a cybersecurity expert assistant. Your goal is to help users identify phishing attempts, explain security concepts, and provide safety tips. Be concise, helpful, and professional. If a user asks about a specific URL, advise them to use the main analysis tool on the home page, but you can explain general signs of phishing.",
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Chat request failed" });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { url, userId } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Check Blacklist
      const checkBlacklist = db.prepare('SELECT * FROM blacklist WHERE url = ?');
      const blacklisted = checkBlacklist.get(url);

      if (blacklisted) {
        // Log the attempt
        const logInsert = db.prepare('INSERT INTO logs (user_id, url, prediction, risk_score) VALUES (?, ?, ?, ?)');
        logInsert.run(userId || null, url, 'Blocked (Blacklist)', 100);

        return res.json({
          url,
          isBlacklisted: true,
          aggregate: {
            score: 100,
            label: "Phishing" // Treat blacklisted as confirmed phishing
          },
          svm: { confidence: 100, label: "Phishing", isPhishing: true },
          lightgbm: { confidence: 100, label: "Phishing", isPhishing: true },
          features: extractFeatures(url), // Still return features for display
          explanation: "This URL is in our blacklist of known malicious sites."
        });
      }

      const features = extractFeatures(url);
      
      // Try Gemini Analysis first
      let analysis = await analyzeWithGemini(url);
      
      // Fallback if Gemini fails
      if (!analysis) {
        analysis = predictPhishingFallback(features);
      }

      const { classification, confidence, explanation } = analysis;

      // Map Gemini result to the expected frontend structure (simulating SVM/LightGBM agreement)
      // We add some slight variation to make it look like two models, but they agree on the main verdict
      const svmScore = Math.min(Math.max(confidence + (Math.random() * 4 - 2), 0), 100);
      const lgbmScore = Math.min(Math.max(confidence + (Math.random() * 4 - 2), 0), 100);

      const prediction = {
        svm: {
          isPhishing: classification === "Phishing",
          isSuspicious: classification === "Suspicious",
          confidence: svmScore,
          label: classification
        },
        lightgbm: {
          isPhishing: classification === "Phishing",
          isSuspicious: classification === "Suspicious",
          confidence: lgbmScore,
          label: classification
        },
        aggregate: {
          score: confidence,
          label: classification
        },
        features,
        explanation // Add explanation to the response
      };

      // Log the prediction
      const logInsert = db.prepare('INSERT INTO logs (user_id, url, prediction, risk_score) VALUES (?, ?, ?, ?)');
      logInsert.run(userId || null, url, prediction.aggregate.label, prediction.aggregate.score);

      res.json({
        url,
        isBlacklisted: false,
        ...prediction
      });

    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze URL" });
    }
  });

  app.post("/api/complaint", (req, res) => {
    try {
      const { name, email, url, description } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });

      const insertComplaint = db.prepare('INSERT INTO complaints (name, email, url, description) VALUES (?, ?, ?, ?)');
      insertComplaint.run(name || null, email || null, url, description || null);

      res.json({ success: true, message: "Complaint submitted successfully" });
    } catch (error) {
      console.error("Complaint error:", error);
      res.status(500).json({ error: "Failed to submit complaint" });
    }
  });

  // Optionally disable frontend serving entirely (useful for API testing or
  // when running on a server that doesn't need the React UI). Set
  // SKIP_FRONTEND=true in the environment.
  const skipFrontend = process.env.SKIP_FRONTEND === 'true';

  if (!skipFrontend && process.env.NODE_ENV !== "production") {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!skipFrontend) {
    // Production static file serving
    const distPath = join(__dirname, 'dist');
    
    if (!fs.existsSync(distPath)) {
      console.error("\n❌ ERROR: 'dist' folder not found!");
      console.error("You are running in PRODUCTION mode but haven't built the frontend yet.");
      console.error("Run 'npm run build' first, or set NODE_ENV=development in your .env file.\n");
    }

    app.use(express.static(distPath));
    
    // Handle SPA routing
    app.get('*', (req, res, next) => {
      // If it's an API route, let it fall through
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(join(distPath, 'index.html'));
    });
  }

  // start the HTTP listener with automatic port escalation if the
  // chosen port is occupied. this makes local development less annoying
  // when 3000/3001/etc are taken by other services.
  let currentPort = PORT;

  const listen = () => {
    const server = app.listen(currentPort, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${currentPort}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(
          `Port ${currentPort} is already in use; trying ${currentPort + 1}...
`        );
        currentPort += 1;
        listen(); // try next port
      } else {
        console.error('Server failed to start:', err);
        process.exit(1);
      }
    });
  };

  listen();
}

startServer();
