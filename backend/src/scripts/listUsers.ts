import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

// Load env vars
// Try multiple paths
const envPath1 = path.resolve(__dirname, '../../../.env');
const envPath2 = path.resolve('/Users/nidhil/Desktop/TaskBoard/modern-mern-hub/backend/.env');

dotenv.config({ path: envPath2 });

const listUsers = async () => {
    try {
        const mongoUri = 'mongodb+srv://techhaca_db_user:8h9AGwSl6goia2ol@ticket-management-proje.j3cicog.mongodb.net/taskboard?retryWrites=true&w=majority';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email _id role');

        console.log('\n--- SYSTEM USERS ---');
        users.forEach(user => {
            console.log(`ID: ${user._id} | Name: ${user.name} | Email: ${user.email} | Role: ${user.role}`);
        });
        console.log('--------------------\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listUsers();
