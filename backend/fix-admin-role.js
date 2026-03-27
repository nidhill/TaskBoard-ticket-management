const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Update the user role
        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            role: String,
        }));

        const result = await User.findOneAndUpdate(
            { email: 'nidhiljabbar@gmail.com' },
            { role: 'tech_admin' },
            { new: true }
        );

        console.log('Updated user:', result);
        console.log('✅ Role restored to tech_admin');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
