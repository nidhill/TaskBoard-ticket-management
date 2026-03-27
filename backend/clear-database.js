const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Get all collections
        const collections = await mongoose.connection.db.collections();

        console.log('\n🗑️  Clearing all data from database...\n');

        // Clear each collection except users (to keep your admin account)
        for (let collection of collections) {
            const collectionName = collection.collectionName;

            if (collectionName === 'users') {
                console.log(`⏭️  Skipping: ${collectionName} (keeping user accounts)`);
            } else {
                const result = await collection.deleteMany({});
                console.log(`✅ Cleared: ${collectionName} (${result.deletedCount} documents deleted)`);
            }
        }

        console.log('\n✨ Database cleanup complete!');
        console.log('📝 Note: User accounts were preserved\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
