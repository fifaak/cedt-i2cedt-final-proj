const express = require("express");
const cors = require("cors");
const https = require("https");
const { MongoSync, Fortune } = require("./services/mongoSync");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => res.status(408).json({ error: "Request timeout" }));
  next();
});

// Mount routes
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

// Helper function for HTTPS requests (Node 18+ compatible)
function makeHttpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Thai-Fortune-API/1.0',
        ...options.headers
      },
      timeout: 30000 // 30 second timeout
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Initialize Mongo (cloud-only storage)
console.log("🔄 Initializing MongoDB connection (cloud storage)...");
const mongoSync = new MongoSync();
mongoSync.connectToMongo();

async function getAiPrediction(userInfo, userMessage) {
  const API_KEY = process.env.TYPHOON_API_KEY;
  const API_ENDPOINT = "https://api.opentyphoon.ai/v1/chat/completions";

  if (!API_KEY) {
    console.error("❌ TYPHOON_API_KEY not found in environment variables");
    return "ไม่พบ API Key สำหรับการเชื่อมต่อ AI กรุณาตรวจสอบการตั้งค่า";
  }

  const systemPrompt = `คุณคือ "อาจารย์คม" หมอดูสายตรงที่อ่านดวงตามความเป็นจริงโดยใช้หลักโหราศาสตร์ และ ดวงชะตา สไตล์การพูดของคุณคือ ตรงไปตรงมา, ขวานผ่าซาก เพื่อกระตุ้นให้คนฟังตื่นจากกันแล้วยอมรับความจริง เป้าหมายของคุณคือการใช้ข้อมูล วันเกิด และคำถามของผู้ใช้ เพื่อชี้ให้เห็น "ความจริง", จุดอ่อนที่พวกเขาอาจมองข้าม, และทางออกที่ต้องลงมือทำจริง ไม่ใช่แค่การให้กำลังใจลอยๆ จงตอบคำถามแบบกระชับ, เน้นความเป็นจริงที่เกิดขึ้นได้ และไม่ต้องกลัวที่จะพูดถึงผลลัพธ์ในแง่ลบถ้าดวงชะตามันชี้ไปทางนั้น โดยตอบแบบสั้นๆ ซัก 4-5 ประโยค แต่ได้ใจความ
---
ข้อมูลผู้ใช้:
- ชื่อ: ${userInfo.name}
- วันเกิด: ${userInfo.birthdate}
- เพศ: ${userInfo.sex}
- หัวข้อที่กังวล: ${userInfo.topic}
---`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  try {
    const response = await makeHttpsRequest(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "typhoon-v2.1-12b-instruct",
        messages: messages,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 0.8,
        repetition_penalty: 1.1,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("❌ AI API Error:", error.message);
    return "เซิร์ฟเวอร์พลังงานจักรวาลล่ม ติดต่อไม่ได้ ลองใหม่อีกที";
  }
}

// Input validation middleware
const validateFortuneInput = (req, res, next) => {
  const { name, birthdate, sex, topic, text } = req.body;

  if (!name || !birthdate || !sex || !topic || !text) {
    return res.status(400).json({
      error: "กรุณากรอกข้อมูลให้ครบถ้วน",
    });
  }

  // Validate birthdate format
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(birthdate)) {
    return res.status(400).json({
      error: "รูปแบบวันเกิดไม่ถูกต้อง กรุณาใช้รูปแบบ DD/MM/YYYY",
    });
  }

  // Validate enum values
  const validSex = ["male", "female", "other"];
  const validTopics = ["overall", "career", "finance", "love", "health"];

  if (!validSex.includes(sex)) {
    return res.status(400).json({ error: "ข้อมูลเพศไม่ถูกต้อง" });
  }

  if (!validTopics.includes(topic)) {
    return res.status(400).json({ error: "หัวข้อการดูดวงไม่ถูกต้อง" });
  }

  next();
};

// Routes
app.post("/api/fortune", validateFortuneInput, async (req, res) => {
  try {
    const { name, birthdate, sex, topic, text } = req.body;

    // Get AI prediction
    const userInfo = { name, birthdate, sex, topic };
    const prediction = await getAiPrediction(userInfo, text);

    // Save to MongoDB (cloud)
    const doc = new Fortune({
      name: name.trim(),
      birthdate,
      sex,
      topic,
      text: text.trim(),
      prediction,
      created_at: new Date()
    });
    const savedFortune = await doc.save();

    console.log(`✅ New fortune created for ${name} (cloud)`);

    res.status(201).json({
      id: savedFortune._id,
      prediction: savedFortune.prediction,
    });
  } catch (error) {
    console.error("❌ Error creating fortune:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดูดวง" });
  }
});

app.get("/api/fortune", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const [fortunes, total] = await Promise.all([
      Fortune.find({}).sort({ created_at: -1 }).skip(skip).limit(limit),
      Fortune.countDocuments()
    ]);

    res.json({
      fortunes: fortunes.map((fortune) => ({
        id: fortune._id,
        name: fortune.name,
        birthdate: fortune.birthdate,
        sex: fortune.sex,
        topic: fortune.topic,
        text: fortune.text,
        prediction: fortune.prediction,
        created_at: fortune.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
    });
  } catch (error) {
    console.error("❌ Error fetching fortunes:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

app.get("/api/fortune/:id", async (req, res) => {
  try {
    const fortune = await Fortune.findById(req.params.id);
    if (!fortune) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการดูดวง" });
    }
    res.json({
      id: fortune._id,
      name: fortune.name,
      birthdate: fortune.birthdate,
      sex: fortune.sex,
      topic: fortune.topic,
      text: fortune.text,
      prediction: fortune.prediction,
      created_at: fortune.created_at,
    });
  } catch (error) {
    console.error("❌ Error fetching fortune:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

app.put("/api/fortune/:id", validateFortuneInput, async (req, res) => {
  try {
    const { name, birthdate, sex, topic, text } = req.body;

    const userInfo = { name, birthdate, sex, topic };
    const prediction = await getAiPrediction(
      userInfo,
      text || "อัปเดตข้อมูลการดูดวง"
    );

    const updated = await Fortune.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        birthdate,
        sex,
        topic,
        text: text.trim(),
        prediction,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการดูดวง" });
    }

    console.log(`✅ Fortune updated for ${name} (cloud)`);

    res.json({
      id: updated._id,
      name: updated.name,
      birthdate: updated.birthdate,
      sex: updated.sex,
      topic: updated.topic,
      prediction: updated.prediction,
    });
  } catch (error) {
    console.error("❌ Error updating fortune:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});

app.delete("/api/fortune/:id", async (req, res) => {
  try {
    const deleted = await Fortune.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการดูดวง" });
    }
    console.log(`🗑️  Fortune deleted: ${deleted.name} (cloud)`);
    res.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("❌ Error deleting fortune:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
});

// Chat endpoints are handled in routes/chat via cloud storage

// Manual sync endpoint
// Sync endpoints removed: cloud-only storage, no local sync

// Health check endpoint
app.get("/api/health", (req, res) => {
  const syncStatus = mongoSync.getSyncStatus();
  
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    storage: {
      type: "cloud",
      mongodb: syncStatus.isConnected ? "connected" : "disconnected"
    },
    sync: {
      active: false,
      mongoState: syncStatus.mongoState,
      connectionAttempts: syncStatus.connectionAttempts
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ error: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "ไม่พบหน้าที่ต้องการ" });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  mongoSync.stopPeriodicSync();
  console.log("📦 Local storage data saved");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  mongoSync.stopPeriodicSync();
  console.log("📦 Local storage data saved");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🔮 Fortune Telling API Server running on port ${PORT}`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
