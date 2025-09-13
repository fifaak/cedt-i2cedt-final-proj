const mongoose = require('mongoose');

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
  }
});

// Update the updatedAt timestamp before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
