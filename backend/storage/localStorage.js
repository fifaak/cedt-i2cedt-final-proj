const fs = require('fs').promises;
const path = require('path');

class LocalStorage {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.fortunesFile = path.join(this.dataDir, 'fortunes.json');
    this.chatsFile = path.join(this.dataDir, 'chats.json');
    this.init();
  }

  async init() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize files if they don't exist
      await this.initFile(this.fortunesFile, []);
      await this.initFile(this.chatsFile, []);
      
      console.log('✅ Local storage initialized');
    } catch (error) {
      console.error('❌ Error initializing local storage:', error);
    }
  }

  async initFile(filePath, defaultData) {
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Fortune methods
  async createFortune(fortuneData) {
    const fortunes = await this.readFile(this.fortunesFile);
    const newFortune = {
      id: this.generateId(),
      ...fortuneData,
      created_at: new Date().toISOString()
    };
    
    fortunes.push(newFortune);
    await this.writeFile(this.fortunesFile, fortunes);
    return newFortune;
  }

  async getFortunes(options = {}) {
    const fortunes = await this.readFile(this.fortunesFile);
    const { limit = 50, page = 1 } = options;
    
    // Sort by created_at descending
    fortunes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFortunes = fortunes.slice(startIndex, endIndex);
    
    return {
      fortunes: paginatedFortunes,
      pagination: {
        page,
        limit,
        total: fortunes.length,
        pages: Math.ceil(fortunes.length / limit)
      }
    };
  }

  async getFortuneById(id) {
    const fortunes = await this.readFile(this.fortunesFile);
    return fortunes.find(fortune => fortune.id === id);
  }

  async updateFortune(id, updateData) {
    const fortunes = await this.readFile(this.fortunesFile);
    const index = fortunes.findIndex(fortune => fortune.id === id);
    
    if (index === -1) {
      return null;
    }
    
    fortunes[index] = { ...fortunes[index], ...updateData };
    await this.writeFile(this.fortunesFile, fortunes);
    return fortunes[index];
  }

  async deleteFortune(id) {
    const fortunes = await this.readFile(this.fortunesFile);
    const index = fortunes.findIndex(fortune => fortune.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const deletedFortune = fortunes.splice(index, 1)[0];
    await this.writeFile(this.fortunesFile, fortunes);
    return deletedFortune;
  }

  // Chat methods
  async createChat(chatData) {
    const chats = await this.readFile(this.chatsFile);
    const newChat = {
      id: this.generateId(),
      ...chatData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    chats.push(newChat);
    await this.writeFile(this.chatsFile, chats);
    return newChat;
  }

  async getChatsByUserId(userId) {
    const chats = await this.readFile(this.chatsFile);
    return chats
      .filter(chat => chat.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async getChatById(id) {
    const chats = await this.readFile(this.chatsFile);
    return chats.find(chat => chat.id === id);
  }

  async updateChat(id, updateData) {
    const chats = await this.readFile(this.chatsFile);
    const index = chats.findIndex(chat => chat.id === id);
    
    if (index === -1) {
      return null;
    }
    
    chats[index] = { 
      ...chats[index], 
      ...updateData, 
      updatedAt: new Date().toISOString() 
    };
    await this.writeFile(this.chatsFile, chats);
    return chats[index];
  }

  async deleteChat(id) {
    const chats = await this.readFile(this.chatsFile);
    const index = chats.findIndex(chat => chat.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const deletedChat = chats.splice(index, 1)[0];
    await this.writeFile(this.chatsFile, chats);
    return deletedChat;
  }
}

module.exports = new LocalStorage();