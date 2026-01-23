import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderKanban, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';
import api from '@/services/api';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const otpSchema = z.string().length(6, 'OTP must be 6 digits');

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            emailSchema.parse(email);
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.errors[0].message);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setStep('otp');
            setSuccessMessage('OTP sent to your email address');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            otpSchema.parse(otp);
            passwordSchema.parse(newPassword);
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.errors[0].message);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                otp,
                password: newPassword
            });
            setSuccessMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/auth'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Hero Image with Overlay */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: 'url(/auth-hero.png)' }}
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <FolderKanban className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold">Slate</span>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-5xl font-bold leading-tight mb-4">
                                Secure your<br />account access
                            </h1>
                            <p className="text-xl text-white/90 max-w-md">
                                Reset your password securely with OTP verification.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                            <FolderKanban className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">Slate</span>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
                        </h2>
                        <p className="text-muted-foreground">
                            {step === 'email'
                                ? 'Enter your email to receive a 6-digit OTP'
                                : 'Enter the OTP sent to your email and your new password'
                            }
                        </p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    {/* Forms */}
                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-medium"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="h-11 font-mono tracking-widest text-center"
                                    maxLength={6}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-11"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-11"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-medium"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-sm text-primary hover:underline"
                                    disabled={isSubmitting}
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Back to Login */}
                    <div className="text-center">
                        <Link
                            to="/auth"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// CheckCircle2 is used in Alert but not imported in the original prompt imports, adding it now.
import { CheckCircle2 } from 'lucide-react';
