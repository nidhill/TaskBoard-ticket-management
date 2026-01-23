import { Resend } from 'resend';

// Initialize Resend only if key exists to avoid crash
const getResendClient = () => {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    return new Resend(process.env.RESEND_API_KEY);
};

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
    try {
        const resend = getResendClient();

        if (!resend) {
            console.warn('RESEND_API_KEY is not defined in environment variables');
            // Throw error so frontend knows it failed, or return null if we want to fail silently (but user expects OTP)
            throw new Error('Email service configuration missing');
        }

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Slate <onboarding@resend.dev>',
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ''), // Simple strip tags for text fallback
        });

        if (error) {
            console.error('Resend API Error:', error);
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const subject = 'Welcome to ProjectFlow!';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2662d9;">Welcome to Slate!</h1>
            <p>Hi ${name},</p>
            <p>We're excited to have you on board. Slate is your new home for efficient project management.</p>
            <p>Here are a few things you can do to get started:</p>
            <ul>
                <li>Create your first project</li>
                <li>Invite your team members</li>
                <li>Set up your profile</li>
            </ul>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
};

export const sendOtpEmail = async (email: string, otp: string) => {
    const subject = 'Password Reset OTP';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2662d9;">Password Reset Request</h1>
            <p>You requested a password reset. Please use the following OTP to reset your password:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h2>
            </div>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
};

export const sendTicketStatusNotification = async (email: string, name: string, ticketTitle: string, status: string, projectName: string) => {
    const subject = `Ticket Updated: ${ticketTitle}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2662d9;">Ticket Status Update</h2>
            <p>Hi ${name},</p>
            <p>The status of ticket "<strong>${ticketTitle}</strong>" in project "<strong>${projectName}</strong>" has been updated to:</p>
            <p style="font-size: 18px; font-weight: bold; color: #333;">${status.toUpperCase().replace('_', ' ')}</p>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

export const sendTicketCreatedNotification = async (email: string, name: string, ticketTitle: string, projectName: string, createdBy: string) => {
    const subject = `New Ticket: ${ticketTitle}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2662d9;">New Ticket Created</h2>
            <p>Hi ${name},</p>
            <p>A new ticket "<strong>${ticketTitle}</strong>" has been created in project "<strong>${projectName}</strong>" by ${createdBy}.</p>
            <p>Please check the board for more details.</p>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

export const sendProjectStatusNotification = async (email: string, name: string, projectName: string, status: string) => {
    const subject = `Project Status Update: ${projectName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2662d9;">Project Status Update</h2>
            <p>Hi ${name},</p>
            <p>The status of project "<strong>${projectName}</strong>" has been updated to:</p>
            <p style="font-size: 18px; font-weight: bold; color: #333;">${status.toUpperCase()}</p>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

export const sendProjectMemberNotification = async (email: string, name: string, projectName: string, role: string) => {
    const subject = `Added to New Project: ${projectName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2662d9;">You've been added to a project</h2>
            <p>Hi ${name},</p>
            <p>You have been added to the project "<strong>${projectName}</strong>" as a <strong>${role}</strong>.</p>
            <p>Log in to Slate to start collaborating.</p>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

export const sendProjectApprovedEmail = async (email: string, projectName: string, name: string) => {
    const subject = `Project Approved: ${projectName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2662d9;">Project Approved</h2>
            <p>Hi ${name},</p>
            <p>Your project "<strong>${projectName}</strong>" has been approved!</p>
            <p>You can now start adding pages and tickets.</p>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

export const sendProjectApprovalRequest = async (email: string, projectName: string, requestorName: string, projectId: string) => {
    const subject = `Project Approval Request: ${projectName}`;
    const approvalLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/projects/${projectId}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2662d9;">Project Approval Request</h2>
            <p>Hi,</p>
            <p>${requestorName} has created a new project "<strong>${projectName}</strong>" and assigned you as the Project Head.</p>
            <p>Please review and approve the project to activate it.</p>
            <div style="margin: 20px 0;">
                <a href="${approvalLink}" style="background-color: #2662d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Project</a>
            </div>
            <p>Best regards,<br>The Slate Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};
