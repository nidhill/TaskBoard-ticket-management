import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

// Load env vars
dotenv.config();

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI is not defined');
            process.exit(1);
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const adminEmail = 'admin@taskboard.com';
        const adminPassword = 'adminpassword123';

        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists');
            // If exists, maybe update the role to be sure?
            userExists.role = 'admin';
            await userExists.save();
            console.log('Ensure existing user has admin role');
            console.log('Email:', adminEmail);
            process.exit(0);
        }

        await User.create({
            name: 'System Admin',
            email: adminEmail,
            password: adminPassword,
            department: 'IT',
            role: 'admin',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`
        });

        console.log('Admin user created successfully');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
