import mongoose from 'mongoose';

const { Schema } = mongoose;

const validSex = ['male', 'female', 'other'];
const validTopics = ['overall', 'career', 'finance', 'love', 'health'];

const UserInfoSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		birthdate: { type: String, required: true, trim: true },
		sex: { type: String, required: true, enum: validSex },
		topic: { type: String, required: true, enum: validTopics },
	},
	{ _id: false }
);

const ChatMessageSchema = new Schema(
	{
		userInfo: { type: UserInfoSchema, required: true },
		systemPrompt: { type: String, required: true },
		userMessage: { type: String, required: true },
		assistantResponse: { type: String, required: true },
	},
	{ timestamps: true }
);

ChatMessageSchema.index({ 'userInfo.name': 1, 'userInfo.birthdate': 1, createdAt: -1 });

export default mongoose.model('ChatMessage', ChatMessageSchema);


