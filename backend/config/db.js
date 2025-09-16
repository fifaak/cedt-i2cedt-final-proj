import mongoose from 'mongoose';

export async function connectMongo(uri) {
	if (!uri) throw new Error('Missing MongoDB URI');
	mongoose.set('strictQuery', true);
	await mongoose.connect(uri, {
		serverSelectionTimeoutMS: 15000,
	});
	return mongoose.connection;
}


