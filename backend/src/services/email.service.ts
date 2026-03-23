import Mailjet from 'node-mailjet';

const getMailjetClient = () => {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    if (!apiKey || !secretKey) {
        console.warn('MAILJET_API_KEY or MAILJET_SECRET_KEY not set');
        return null;
    }
    return Mailjet.apiConnect(apiKey, secretKey);
};

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
    const client = getMailjetClient();

    if (!client) {
        throw new Error('Email service not configured. Set MAILJET_API_KEY and MAILJET_SECRET_KEY.');
    }

    const fromEmail = process.env.EMAIL_FROM || 'noreply@slatee.tech';
    const recipients = Array.isArray(to) ? to : [to];

    await client.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: { Email: fromEmail, Name: 'TaskBoard' },
                To: recipients.map((email) => ({ Email: email })),
                Subject: subject,
                HTMLPart: html,
                TextPart: text || html.replace(/<[^>]*>?/gm, ''),
            },
        ],
    });
};

export const sendWelcomeEmail = async (email: string, name: string, tempPassword?: string) => {
    const subject = 'Welcome to TaskBoard!';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2662d9;">Welcome to TaskBoard!</h1>
            <p>Hi ${name},</p>
            <p>We're excited to have you on board. TaskBoard is your new home for efficient project management.</p>
            ${tempPassword ? `
            <p>Your account has been created by an administrator. Here are your login credentials:</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 4px 0;"><strong>Password:</strong> ${tempPassword}</p>
            </div>
            <p>Please log in and change your password from the Settings page.</p>
            ` : `
            <p>Here are a few things you can do to get started:</p>
            <ul>
                <li>Create your first project</li>
                <li>Invite your team members</li>
                <li>Set up your profile</li>
            </ul>
            `}
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The TaskBoard Team</p>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
};

export const sendOtpEmail = async (email: string, otp: string) => {
    const subject = 'Password Reset OTP - TaskBoard';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2662d9;">Password Reset Request</h1>
            <p>You requested a password reset. Please use the following OTP to reset your password:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin: 0; color: #333; letter-spacing: 5px;">${otp}</h2>
            </div>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>The TaskBoard Team</p>
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
            <p>Best regards,<br>The TaskBoard Team</p>
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
            <p>Best regards,<br>The TaskBoard Team</p>
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
            <p>Best regards,<br>The TaskBoard Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

export const sendProjectMemberNotification = async (email: string, name: string, projectName: string, role: string) => {
    const subject = `Added to Project: ${projectName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2662d9;">You've been added to a project</h2>
            <p>Hi ${name},</p>
            <p>You have been added to the project "<strong>${projectName}</strong>" as a <strong>${role}</strong>.</p>
            <p>Log in to TaskBoard to start collaborating.</p>
            <p>Best regards,<br>The TaskBoard Team</p>
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
            <p>Best regards,<br>The TaskBoard Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};

export const sendVerificationEmail = async (email: string, otp: string) => {
    const subject = 'Verify your TaskBoard account';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2662d9;">Verify Your Email</h1>
            <p>Thanks for signing up for TaskBoard! Please use the OTP below to verify your email address:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin: 0; color: #333; letter-spacing: 8px; font-size: 32px;">${otp}</h2>
            </div>
            <p>This OTP expires in <strong>10 minutes</strong>.</p>
            <p>If you didn't create a TaskBoard account, you can safely ignore this email.</p>
            <p>Best regards,<br>The TaskBoard Team</p>
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
            <p>Best regards,<br>The TaskBoard Team</p>
        </div>
    `;
    return sendEmail({ to: email, subject, html });
};
