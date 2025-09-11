const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: "Request timeout" });
  });
  next();
});

// Helper function to replace fetch with https module
function makeHttpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// MongoDB Schema
const fortuneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  birthdate: {
    type: String,
    required: true,
    match: /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY format
  },
  sex: {
    type: String,
    required: true,
    enum: ["male", "female", "other"],
  },
  topic: {
    type: String,
    required: true,
    enum: ["overall", "career", "finance", "love", "health"],
  },
  text: {
    type: String,
    required: true,
  },
  prediction: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Fortune = mongoose.model("Fortune", fortuneSchema);

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/fortune_telling"
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

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

    // Save to database
    const fortune = new Fortune({
      name: name.trim(),
      birthdate,
      sex,
      topic,
      text: text.trim(),
      prediction,
    });

    const savedFortune = await fortune.save();
    console.log(`✅ New fortune created for ${name}`);

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
    const limit = parseInt(req.query.limit) || 50; // Default limit
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const fortunes = await Fortune.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean(); // Use lean() for better performance

    const total = await Fortune.countDocuments();

    res.json({
      fortunes: fortunes.map((fortune) => ({
        id: fortune._id,
        name: fortune.name,
        birthdate: fortune.birthdate,
        sex: fortune.sex,
        topic: fortune.topic,
        prediction: fortune.prediction,
        created_at: fortune.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching fortunes:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

app.get("/api/fortune/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "รูปแบบ ID ไม่ถูกต้อง" });
    }

    const fortune = await Fortune.findById(req.params.id).lean();

    if (!fortune) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการดูดวง" });
    }

    res.json({
      id: fortune._id,
      name: fortune.name,
      birthdate: fortune.birthdate,
      sex: fortune.sex,
      topic: fortune.topic,
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
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "รูปแบบ ID ไม่ถูกต้อง" });
    }

    const { name, birthdate, sex, topic, text } = req.body;

    // Get new prediction with updated info
    const userInfo = { name, birthdate, sex, topic };
    const prediction = await getAiPrediction(
      userInfo,
      text || "อัปเดตข้อมูลการดูดวง"
    );

    const updatedFortune = await Fortune.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        birthdate,
        sex,
        topic,
        text: text.trim(),
        prediction,
      },
      { new: true, runValidators: true }
    );

    if (!updatedFortune) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการดูดวง" });
    }

    console.log(`✅ Fortune updated for ${name}`);

    res.json({
      id: updatedFortune._id,
      name: updatedFortune.name,
      birthdate: updatedFortune.birthdate,
      sex: updatedFortune.sex,
      topic: updatedFortune.topic,
      prediction: updatedFortune.prediction,
    });
  } catch (error) {
    console.error("❌ Error updating fortune:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});

app.delete("/api/fortune/:id", async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "รูปแบบ ID ไม่ถูกต้อง" });
    }

    const deletedFortune = await Fortune.findByIdAndDelete(req.params.id);

    if (!deletedFortune) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการดูดวง" });
    }

    console.log(`🗑️  Fortune deleted: ${deletedFortune.name}`);
    res.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("❌ Error deleting fortune:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, userInfo } = req.body;

    if (!message || !userInfo) {
      return res.status(400).json({
        error: "กรุณาส่งข้อความและข้อมูลผู้ใช้",
      });
    }

    const prediction = await getAiPrediction(userInfo, message);

    res.json({ prediction });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสนทนา" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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
  try {
    await mongoose.connection.close();
    console.log("📦 MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  try {
    await mongoose.connection.close();
    console.log("📦 MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🔮 Fortune Telling API Server running on port ${PORT}`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
