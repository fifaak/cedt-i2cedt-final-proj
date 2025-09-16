import mongoose from 'mongoose';

const { Schema } = mongoose;

const VALID_SEX = ['male', 'female', 'other'];
const VALID_TOPICS = ['overall', 'career', 'finance', 'love', 'health'];

const FortuneSchema = new Schema(
	{
		name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
		birthdate: { type: String, required: true, trim: true }, // DD/MM/YYYY stored as string
		sex: { type: String, required: true, enum: VALID_SEX },
		topic: { type: String, required: true, enum: VALID_TOPICS },
		text: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
		prediction: { type: String, required: false, trim: true, default: '' },
	},
	{ timestamps: true }
);

// Helpful index for history ordering by creation time
FortuneSchema.index({ createdAt: -1 });

export default mongoose.model('Fortune', FortuneSchema);


