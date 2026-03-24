import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import api from '@/services/api';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const otpSchema = z.string().length(6, 'OTP must be exactly 6 digits');

/* ─── CSS ───────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fp-root { font-family: 'Outfit', sans-serif; }

  @keyframes fp-fade-up {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fp-slide-in {
    from { opacity:0; transform:translateX(22px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes fp-led {
    0%,100% { opacity:.9; box-shadow: 0 0 5px rgba(74,222,128,.6); }
    50%      { opacity:.4; box-shadow: 0 0 2px rgba(74,222,128,.2); }
  }
  @keyframes fp-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fp-check-pop {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }

  .fp-fade-1 { animation: fp-fade-up .48s ease both; }
  .fp-fade-2 { animation: fp-fade-up .48s .07s ease both; }
  .fp-fade-3 { animation: fp-fade-up .48s .14s ease both; }
  .fp-fade-4 { animation: fp-fade-up .48s .21s ease both; }
  .fp-slide  { animation: fp-slide-in .32s ease both; }

  /* Inputs */
  .fp-field-label {
    display: block; font-size: 10px; font-weight: 600;
    color: #8a8784; letter-spacing: 1.5px;
    text-transform: uppercase; margin-bottom: 9px;
  }
  .fp-input-box {
    width: 100%; background: #e1dfdb; border: 2px solid transparent;
    border-radius: 7px; padding: 13px 16px; font-size: 15px;
    font-family: 'Outfit', sans-serif; color: #111;
    outline: none; transition: background .18s, border-color .18s;
  }
  .fp-input-box::placeholder { color: #aaa8a4; }
  .fp-input-box:focus { background: #d8d6d2; border-color: #111; }
  .fp-input-box:disabled { opacity: .5; }
  .fp-input-err { border-color: #f87171 !important; background: #fef2f2 !important; }

  /* OTP boxes */
  .fp-otp-box {
    flex: 1; height: 60px; text-align: center;
    font-size: 24px; font-weight: 700; font-family: 'Outfit', monospace;
    background: #e1dfdb; border: 2px solid transparent;
    border-radius: 8px; outline: none; color: #111;
    transition: border-color .15s, background .15s; caret-color: transparent;
  }
  .fp-otp-box:focus { border-color: #111; background: #d8d6d2; }
  .fp-otp-box.filled { border-color: rgba(0,0,0,.2); }

  /* Button */
  .fp-btn-primary {
    width: 100%; background: #111; color: white; border: none;
    border-radius: 8px; padding: 16px 20px; font-size: 15px;
    font-family: 'Outfit', sans-serif; font-weight: 600;
    cursor: pointer; transition: background .15s, transform .1s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    min-height: 54px;
  }
  .fp-btn-primary:hover:not(:disabled) { background: #1d1d1d; }
  .fp-btn-primary:active:not(:disabled) { transform: scale(.99); }
  .fp-btn-primary:disabled { background: #c4c2be; cursor: not-allowed; color: #888; }

  /* Error / success */
  .fp-err {
    background: #fee2e2; border: 1px solid #fca5a5; border-radius: 7px;
    padding: 11px 14px; color: #991b1b; font-size: 13px;
    margin-bottom: 18px; animation: fp-fade-up .3s ease both;
  }
  .fp-success {
    background: #dcfce7; border: 1px solid #86efac; border-radius: 7px;
    padding: 11px 14px; color: #166534; font-size: 13px;
    margin-bottom: 18px; animation: fp-fade-up .3s ease both;
    display: flex; align-items: center; gap: 8px;
  }
  .fp-field-err { font-size: 12px; color: #ef4444; margin-top: 5px; display: block; }

  /* Mobile */
  .fp-mobile-logo { display: none; }
  @media (max-width: 860px) {
    .fp-left-panel { display: none !important; }
    .fp-right-panel { padding: 40px 28px !important; justify-content: flex-start !important; }
    .fp-right-inner { padding-top: 0 !important; }
    .fp-heading { font-size: 36px !important; }
    .fp-mobile-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
  }
`;

/* ─── Machine Art ───────────────────────────────────────── */
function MachineArt() {
  return (
    <div style={{
      borderRadius: 10, background: '#060606',
      border: '1px solid rgba(255,255,255,.055)',
      overflow: 'hidden', height: 196, position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 70,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.045) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 14, left: 18, right: 18, height: 106,
        background: 'linear-gradient(155deg, #1c1c1c 0%, #111 55%, #0d0d0d 100%)',
        borderRadius: 7, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 1, background: 'linear-gradient(180deg, rgba(255,255,255,.1), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          {[82, 58, 70, 44].map((w, i) => (
            <div key={i} style={{ height: 1, width: `${w}%`, marginBottom: i < 3 ? 7 : 0, background: 'rgba(255,255,255,.055)', borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: 9, right: 12, display: 'flex', gap: 5 }}>
          {[true, false, false].map((active, i) => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: active ? '#4ade80' : 'rgba(255,255,255,.1)', animation: active ? 'fp-led 3s ease-in-out infinite' : 'none' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: 22, left: 14, width: 36, height: 36, border: '1px solid rgba(255,255,255,.06)', borderRadius: 3, transform: 'rotate(12deg)' }} />
        <div style={{ position: 'absolute', top: 30, left: 22, width: 36, height: 36, border: '1px solid rgba(255,255,255,.04)', borderRadius: 3, transform: 'rotate(12deg)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 10, left: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[{ h: 17, op: 0.075, dots: 2, green: 0 }, { h: 14, op: 0.055, dots: 3, green: -1 }, { h: 12, op: 0.04, dots: 1, green: -1 }, { h: 9, op: 0.028, dots: 4, green: -1 }].map((rack, i) => (
          <div key={i} style={{ height: rack.h, background: `rgba(255,255,255,${rack.op})`, borderRadius: 2, border: `1px solid rgba(255,255,255,${rack.op * 1.4})`, display: 'flex', alignItems: 'center', paddingLeft: 9, gap: 4 }}>
            {Array.from({ length: rack.dots }).map((_, j) => (
              <div key={j} style={{ width: 3, height: 3, borderRadius: '50%', background: j === rack.green ? 'rgba(74,222,128,.75)' : 'rgba(255,255,255,.1)' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── OTP Boxes ─────────────────────────────────────────── */
function OtpBoxes({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const arr = (value + '      ').slice(0, 6).split('');
    arr[idx] = digit;
    onChange(arr.join('').trimEnd());
    if (idx < 5) focus(idx + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[idx]) {
        const arr = (value + '      ').slice(0, 6).split('');
        arr[idx] = ' ';
        onChange(arr.join('').trimEnd());
      } else if (idx > 0) {
        const arr = (value + '      ').slice(0, 6).split('');
        arr[idx - 1] = ' ';
        onChange(arr.join('').trimEnd());
        focus(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); focus(idx - 1); }
    else if (e.key === 'ArrowRight' && idx < 5) { e.preventDefault(); focus(idx + 1); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    focus(Math.min(pasted.length, 5));
  };

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el; }}
          className={`fp-otp-box${value[idx] && value[idx] !== ' ' ? ' filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={value[idx] && value[idx] !== ' ' ? value[idx] : ''}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
}

/* ─── Password strength ─────────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const level = score <= 1 ? 1 : score <= 2 ? 2 : 3;
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e'];
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= level ? colors[level] : '#d0ceca',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: colors[level], minWidth: 38, textAlign: 'right' }}>
        {labels[level]}
      </span>
    </div>
  );
}

/* ─── Eye icon ──────────────────────────────────────────── */
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── Spinner ───────────────────────────────────────────── */
const Spinner = () => (
  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', borderTopColor: 'white', animation: 'fp-spin .65s linear infinite', flexShrink: 0 }} />
);

/* ─── Back arrow icon ───────────────────────────────────── */
const BackArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

/* ─── Main component ────────────────────────────────────── */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const setFieldErr = (k: string, msg: string) => setFieldErrors(p => ({ ...p, [k]: msg }));
  const clearFieldErr = (k: string) => setFieldErrors(p => { const n = { ...p }; delete n[k]; return n; });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = emailSchema.safeParse(email);
    if (!result.success) { setFieldErr('email', result.error.errors[0].message); return; }

    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpResult = otpSchema.safeParse(otp.replace(/\s/g, ''));
    if (!otpResult.success) { setError('Please enter the complete 6-digit OTP'); return; }

    const pwResult = passwordSchema.safeParse(newPassword);
    if (!pwResult.success) { setFieldErr('newPassword', pwResult.error.errors[0].message); return; }

    if (newPassword !== confirmPassword) { setFieldErr('confirmPassword', 'Passwords do not match'); return; }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otp.trim(), password: newPassword });
      setStep('done');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftHeadings: Record<string, { title: string; sub: string }> = {
    email: { title: 'Forgot your password?', sub: "No worries. We'll send a one-time code to your inbox." },
    otp:   { title: 'Check your inbox.', sub: 'Enter the 6-digit code we sent and choose a new password.' },
    done:  { title: 'Password reset.', sub: 'Your account is secured. Redirecting you to sign in...' },
  };
  const lh = leftHeadings[step];

  return (
    <>
      <style>{styles}</style>
      <div className="fp-root" style={{ display: 'flex', minHeight: '100vh', background: '#edecea' }}>

        {/* ── Left Panel ───────────────────────────────── */}
        <div className="fp-left-panel" style={{
          width: 340, flexShrink: 0, background: '#0b0b0b',
          display: 'flex', flexDirection: 'column',
          padding: '36px 28px', gap: 0,
        }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              border: '1px solid rgba(255,255,255,.12)',
              background: 'rgba(255,255,255,.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 17, color: 'rgba(255,255,255,.88)', letterSpacing: '-.3px' }}>Slate</span>
          </div>

          {/* Step indicator */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
              {(['email', 'otp', 'done'] as const).map((s, i) => (
                <div key={s} style={{
                  height: 3, borderRadius: 2, flex: 1,
                  background: i <= (['email', 'otp', 'done'].indexOf(step)) ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.1)',
                  transition: 'background .4s',
                }} />
              ))}
            </div>

            <h1 className="fp-heading" style={{
              fontFamily: 'Bricolage Grotesque, sans-serif',
              fontWeight: 800, fontSize: 42, lineHeight: 1.1,
              color: '#fff', letterSpacing: '-.5px', marginBottom: 14,
            }}>
              {lh.title}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.42)', lineHeight: 1.6 }}>
              {lh.sub}
            </p>
          </div>

          {/* Machine art */}
          <MachineArt />
        </div>

        {/* ── Right Panel ──────────────────────────────── */}
        <div className="fp-right-panel" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 48px',
        }}>
          <div className="fp-right-inner" style={{ width: '100%', maxWidth: 420, paddingTop: 20 }}>

            {/* Mobile logo */}
            <div className="fp-mobile-logo">
              <div style={{ width: 30, height: 30, borderRadius: 7, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 17, color: '#111' }}>Slate</span>
            </div>

            {/* ── Success state ── */}
            {step === 'done' ? (
              <div className="fp-slide" style={{ textAlign: 'center', paddingTop: 40 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px', animation: 'fp-check-pop .5s cubic-bezier(.34,1.56,.64,1) both',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 28, color: '#111', marginBottom: 10 }}>
                  Password updated!
                </h2>
                <p style={{ fontSize: 14, color: '#6b6967', lineHeight: 1.6, marginBottom: 32 }}>
                  Your password has been reset successfully.<br />Redirecting to sign in...
                </p>
                <Link to="/auth" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 14, fontWeight: 600, color: '#111',
                  textDecoration: 'none', borderBottom: '1.5px solid #111', paddingBottom: 2,
                }}>
                  Go to sign in now
                </Link>
              </div>
            ) : (
              <>
                {/* Heading */}
                <div className="fp-fade-1" style={{ marginBottom: 32 }}>
                  <h2 style={{
                    fontFamily: 'Bricolage Grotesque, sans-serif',
                    fontWeight: 800, fontSize: 32, color: '#111',
                    letterSpacing: '-.4px', lineHeight: 1.15, marginBottom: 8,
                  }}>
                    {step === 'email' ? 'Reset password' : 'Create new password'}
                  </h2>
                  <p style={{ fontSize: 14, color: '#8a8784', lineHeight: 1.55 }}>
                    {step === 'email'
                      ? "Enter the email linked to your account and we'll send you a code."
                      : `Code sent to ${email}. Enter it below with your new password.`}
                  </p>
                </div>

                {/* Error */}
                {error && <div className="fp-err">{error}</div>}

                {/* ── Email step ── */}
                {step === 'email' && (
                  <form key="email-form" onSubmit={handleSendOtp} className="fp-slide">
                    <div className="fp-fade-2" style={{ marginBottom: 20 }}>
                      <label className="fp-field-label">Email address</label>
                      <input
                        className={`fp-input-box${fieldErrors.email ? ' fp-input-err' : ''}`}
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); clearFieldErr('email'); }}
                        onBlur={() => {
                          const r = emailSchema.safeParse(email);
                          if (!r.success) setFieldErr('email', r.error.errors[0].message);
                        }}
                        disabled={isSubmitting}
                        autoFocus
                      />
                      {fieldErrors.email && <span className="fp-field-err">{fieldErrors.email}</span>}
                    </div>

                    <div className="fp-fade-3" style={{ marginTop: 28 }}>
                      <button type="submit" className="fp-btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? <><Spinner /> Sending code...</> : 'Send reset code'}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── OTP + new password step ── */}
                {step === 'otp' && (
                  <form key="otp-form" onSubmit={handleResetPassword} className="fp-slide">
                    {/* OTP */}
                    <div className="fp-fade-2" style={{ marginBottom: 20 }}>
                      <label className="fp-field-label">Verification code</label>
                      <OtpBoxes value={otp} onChange={setOtp} disabled={isSubmitting} />
                    </div>

                    {/* New password */}
                    <div className="fp-fade-3" style={{ marginBottom: 20 }}>
                      <label className="fp-field-label">New password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className={`fp-input-box${fieldErrors.newPassword ? ' fp-input-err' : ''}`}
                          type={showNew ? 'text' : 'password'}
                          placeholder="Min. 6 characters"
                          value={newPassword}
                          onChange={e => { setNewPassword(e.target.value); clearFieldErr('newPassword'); }}
                          style={{ paddingRight: 48 }}
                          disabled={isSubmitting}
                        />
                        <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a8784', padding: 2 }}>
                          <EyeIcon open={showNew} />
                        </button>
                      </div>
                      {fieldErrors.newPassword && <span className="fp-field-err">{fieldErrors.newPassword}</span>}
                      <PasswordStrength password={newPassword} />
                    </div>

                    {/* Confirm password */}
                    <div className="fp-fade-4" style={{ marginBottom: 20 }}>
                      <label className="fp-field-label">Confirm password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className={`fp-input-box${fieldErrors.confirmPassword ? ' fp-input-err' : ''}`}
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repeat new password"
                          value={confirmPassword}
                          onChange={e => { setConfirmPassword(e.target.value); clearFieldErr('confirmPassword'); }}
                          style={{ paddingRight: 48 }}
                          disabled={isSubmitting}
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a8784', padding: 2 }}>
                          <EyeIcon open={showConfirm} />
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && <span className="fp-field-err">{fieldErrors.confirmPassword}</span>}
                    </div>

                    <div style={{ marginTop: 28 }}>
                      <button type="submit" className="fp-btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? <><Spinner /> Resetting...</> : 'Reset password'}
                      </button>
                    </div>

                    {/* Resend */}
                    <div style={{ textAlign: 'center', marginTop: 18 }}>
                      <button
                        type="button"
                        onClick={() => { setOtp(''); setError(null); setStep('email'); }}
                        style={{ background: 'none', border: 'none', fontSize: 13, color: '#8a8784', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                        disabled={isSubmitting}
                      >
                        Didn't receive a code? <span style={{ color: '#111', fontWeight: 600, textDecoration: 'underline' }}>Resend</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Back to login */}
                <div style={{ marginTop: 36 }}>
                  <Link to="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#8a8784', textDecoration: 'none', fontWeight: 500, transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#111')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8a8784')}>
                    <BackArrow />
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
