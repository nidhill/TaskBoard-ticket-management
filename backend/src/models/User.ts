import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'user';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department: string;
    avatar_url?: string;
    resetPasswordOtp?: string;
    resetPasswordExpire?: Date;
    createdAt: Date;
    updatedAt: Date;
    notifications: {
        email: boolean;
        pageApproval: boolean;
        ticketUpdates: boolean;
        ticketLimit: boolean;
    };
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user',
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
        },
        avatar_url: {
            type: String,
            default: null,
        },
        resetPasswordOtp: {
            type: String,
            select: false,
        },
        resetPasswordExpire: {
            type: Date,
            select: false,
        },
        notifications: {
            email: { type: Boolean, default: true },
            pageApproval: { type: Boolean, default: true },
            ticketUpdates: { type: Boolean, default: true },
            ticketLimit: { type: Boolean, default: true },
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
