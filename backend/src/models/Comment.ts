import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
    ticketId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    text: string;
    attachments: { name: string; url: string; type: string }[];
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        ticketId: {
            type: Schema.Types.ObjectId,
            ref: 'Ticket',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
        attachments: [{
            name: String,
            url: String,
            type: String
        }],
    },
    {
        timestamps: true,
    }
);

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
