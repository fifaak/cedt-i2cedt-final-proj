const mongoose = require('mongoose');
const localStorage = require('../storage/localStorage');

// MongoDB Schemas
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
  local_id: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
  }
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  messages: [{
    content: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    edited: {
      type: Boolean,
      default: false
    },
    editHistory: [{
      content: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  local_id: {
    type: String,
    unique: true,
    sparse: true,
  }
});

// Update the updatedAt timestamp before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Fortune = mongoose.model('Fortune', fortuneSchema);
const Chat = mongoose.model('Chat', chatSchema);

class MongoSync {
  constructor() {
    this.isConnected = false;
    this.syncInterval = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  async checkMongoConnection() {
    try {
      if (mongoose.connection.readyState === 1) {
        this.isConnected = true;
        return true;
      }

      // Try to connect if not connected
      if (mongoose.connection.readyState === 0) {
        await this.connectToMongo();
      }

      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async connectToMongo() {
    try {
      const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/fortune_telling";
      
      if (mongoose.connection.readyState === 0) {
        console.log("🔄 Attempting to connect to MongoDB...");
        
        await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
          socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        
        console.log("✅ Connected to MongoDB successfully");
        this.isConnected = true;
        this.connectionAttempts = 0;
      }
    } catch (err) {
      console.error("❌ MongoDB connection error:", err.message);
      this.isConnected = false;
      this.connectionAttempts++;
      
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.log("🔄 Max connection attempts reached, will retry in next sync cycle");
        this.connectionAttempts = 0;
      }
    }
  }

  async syncLocalToMongo() {
    if (!await this.checkMongoConnection()) {
      return { success: false, reason: 'MongoDB not available' };
    }

    try {
      const syncResults = {
        fortunes: { synced: 0, failed: 0 },
        chats: { synced: 0, failed: 0 }
      };

      // Sync fortunes
      const localFortunes = await localStorage.getFortunes({ limit: 1000, page: 1 });
      
      for (const localFortune of localFortunes.fortunes) {
        try {
          // Check if this local fortune already exists in MongoDB
          const existingFortune = await Fortune.findOne({ local_id: localFortune.id });
          
          if (!existingFortune) {
            // Create new fortune in MongoDB
            const mongoFortune = new Fortune({
              name: localFortune.name,
              birthdate: localFortune.birthdate,
              sex: localFortune.sex,
              topic: localFortune.topic,
              text: localFortune.text,
              prediction: localFortune.prediction,
              created_at: new Date(localFortune.created_at),
              local_id: localFortune.id
            });

            await mongoFortune.save();
            syncResults.fortunes.synced++;
            console.log(`📤 Synced fortune: ${localFortune.name} (${localFortune.id})`);
          }
        } catch (error) {
          console.error(`❌ Failed to sync fortune ${localFortune.id}:`, error.message);
          syncResults.fortunes.failed++;
        }
      }

      // Sync chats
      const localChats = await localStorage.readFile(localStorage.chatsFile);
      
      for (const localChat of localChats) {
        try {
          // Check if this local chat already exists in MongoDB
          const existingChat = await Chat.findOne({ local_id: localChat.id });
          
          if (!existingChat) {
            // Create new chat in MongoDB
            const mongoChat = new Chat({
              userId: localChat.userId,
              messages: localChat.messages,
              createdAt: new Date(localChat.createdAt),
              updatedAt: new Date(localChat.updatedAt),
              local_id: localChat.id
            });

            await mongoChat.save();
            syncResults.chats.synced++;
            console.log(`📤 Synced chat: ${localChat.id}`);
          }
        } catch (error) {
          console.error(`❌ Failed to sync chat ${localChat.id}:`, error.message);
          syncResults.chats.failed++;
        }
      }

      if (syncResults.fortunes.synced > 0 || syncResults.chats.synced > 0) {
        console.log(`✅ Sync completed: ${syncResults.fortunes.synced} fortunes, ${syncResults.chats.synced} chats synced`);
      }

      return { success: true, results: syncResults };

    } catch (error) {
      console.error("❌ Error during sync:", error.message);
      return { success: false, reason: error.message };
    }
  }

  async syncMongoToLocal() {
    if (!await this.checkMongoConnection()) {
      return { success: false, reason: 'MongoDB not available' };
    }

    try {
      // This is optional - sync MongoDB data back to local storage
      // Useful if multiple instances are writing to the same MongoDB
      
      const mongoFortunes = await Fortune.find().sort({ created_at: -1 }).limit(100);
      const mongoChats = await Chat.find().sort({ updatedAt: -1 }).limit(100);

      // You could implement logic here to merge MongoDB data back to local storage
      // For now, we'll just log the counts
      console.log(`📥 Found ${mongoFortunes.length} fortunes and ${mongoChats.length} chats in MongoDB`);

      return { success: true, mongoFortunes: mongoFortunes.length, mongoChats: mongoChats.length };
    } catch (error) {
      console.error("❌ Error syncing from MongoDB:", error.message);
      return { success: false, reason: error.message };
    }
  }

  startPeriodicSync(intervalMs = 10000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`🔄 Starting periodic sync every ${intervalMs/1000} seconds`);
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncLocalToMongo();
      } catch (error) {
        console.error("❌ Error in periodic sync:", error.message);
      }
    }, intervalMs);

    // Run initial sync after a short delay
    setTimeout(() => {
      this.syncLocalToMongo();
    }, 2000);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("🛑 Stopped periodic sync");
    }
  }

  // Manual sync endpoint
  async manualSync() {
    console.log("🔄 Manual sync triggered");
    const result = await this.syncLocalToMongo();
    return result;
  }

  // Get sync status
  getSyncStatus() {
    return {
      isConnected: this.isConnected,
      mongoState: mongoose.connection.readyState,
      syncActive: this.syncInterval !== null,
      connectionAttempts: this.connectionAttempts
    };
  }
}

module.exports = { MongoSync, Fortune, Chat };