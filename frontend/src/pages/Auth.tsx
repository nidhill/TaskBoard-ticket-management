import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .sl-root { font-family: 'Outfit', sans-serif; }

  @keyframes sl-fade-up {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes sl-slide-in {
    from { opacity:0; transform:translateX(22px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes sl-pulse-ring {
    0%   { transform:scale(1);   opacity:.5; }
    100% { transform:scale(1.7); opacity:0; }
  }
  @keyframes sl-led {
    0%,100% { opacity:.9; box-shadow: 0 0 5px rgba(74,222,128,.6); }
    50%      { opacity:.4; box-shadow: 0 0 2px rgba(74,222,128,.2); }
  }

  .sl-fade-1 { animation: sl-fade-up .5s ease both; }
  .sl-fade-2 { animation: sl-fade-up .5s .07s ease both; }
  .sl-fade-3 { animation: sl-fade-up .5s .14s ease both; }
  .sl-fade-4 { animation: sl-fade-up .5s .21s ease both; }
  .sl-fade-5 { animation: sl-fade-up .5s .28s ease both; }
  .sl-slide  { animation: sl-slide-in .35s ease both; }

  .sl-nav-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 6px;
    cursor: pointer; border: none; background: none; width: 100%;
    text-align: left; font-family: 'Outfit', sans-serif;
    font-size: 14px; font-weight: 500; letter-spacing: .1px;
    transition: all .15s; border-left: 2.5px solid transparent; margin-bottom: 3px;
  }
  .sl-nav-on  { color: white; background: rgba(255,255,255,.08); border-left-color: white; }
  .sl-nav-off { color: rgba(255,255,255,.32); }
  .sl-nav-off:hover { color: rgba(255,255,255,.62); background: rgba(255,255,255,.04); }

  .sl-field-label {
    display: block; font-size: 10px; font-weight: 600;
    color: #8a8784; letter-spacing: 1.5px;
    text-transform: uppercase; margin-bottom: 9px;
  }
  .sl-input-box {
    width: 100%; background: #e1dfdb; border: none; border-radius: 7px;
    padding: 14px 16px; font-size: 15px; font-family: 'Outfit', sans-serif;
    color: #111; outline: none; transition: background .18s;
  }
  .sl-input-box::placeholder { color: #aaa8a4; }
  .sl-input-box:focus { background: #d7d5d1; }
  .sl-input-box:disabled { opacity: .5; }

  .sl-select-box {
    width: 100%; background: #e1dfdb; border: none; border-radius: 7px;
    padding: 14px 16px; font-size: 15px; font-family: 'Outfit', sans-serif;
    color: #111; outline: none; appearance: none; cursor: pointer; transition: background .18s;
  }
  .sl-select-box:focus { background: #d7d5d1; }
  .sl-select-box option { background: white; color: #111; }
  .sl-select-placeholder { color: #aaa8a4; }

  .sl-btn-primary {
    width: 100%; background: #111; color: white; border: none;
    border-radius: 8px; padding: 16px 20px; font-size: 15px;
    font-family: 'Outfit', sans-serif; font-weight: 600;
    cursor: pointer; transition: background .15s, transform .1s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .sl-btn-primary:hover:not(:disabled) { background: #1d1d1d; }
  .sl-btn-primary:active:not(:disabled) { transform: scale(.99); }
  .sl-btn-primary:disabled { background: #c4c2be; cursor: not-allowed; color: #888; }

  .sl-btn-social {
    flex: 1; background: #e1dfdb; border: none; border-radius: 7px;
    padding: 13px 14px; font-size: 13px; font-family: 'Outfit', sans-serif;
    font-weight: 500; color: #555; cursor: default;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    opacity: .6; user-select: none;
  }

  .sl-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 22px 0; color: #aaa; font-size: 10px;
    font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .sl-divider::before, .sl-divider::after {
    content: ''; flex: 1; height: 1px; background: #cdc9c5;
  }

  .sl-err {
    background: #fee2e2; border: 1px solid #fca5a5; border-radius: 7px;
    padding: 11px 14px; color: #991b1b; font-size: 13px;
    margin-bottom: 18px; animation: sl-fade-up .3s ease both;
  }

  .sl-otp-input {
    width: 100%; text-align: center; font-size: 34px; letter-spacing: 16px;
    background: #e1dfdb; border: none; border-radius: 8px;
    padding: 18px 16px; outline: none; color: #111;
    font-family: 'Outfit', monospace; transition: background .18s;
  }
  .sl-otp-input:focus { background: #d7d5d1; }

  @media (max-width: 860px) {
    .sl-left-panel { display: none !important; }
    .sl-right-panel { padding: 48px 36px !important; }
    .sl-heading { font-size: 44px !important; }
  }
`;

/* ─── Machine art component ─────────────────────────────── */
function MachineArt() {
  return (
    <div style={{
      borderRadius: 10, background: '#060606',
      border: '1px solid rgba(255,255,255,.055)',
      overflow: 'hidden', height: 196, position: 'relative', flexShrink: 0,
    }}>
      {/* Ambient glow top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 70,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.045) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main body block */}
      <div style={{
        position: 'absolute', top: 14, left: 18, right: 18, height: 106,
        background: 'linear-gradient(155deg, #1c1c1c 0%, #111 55%, #0d0d0d 100%)',
        borderRadius: 7, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden',
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        {/* Top edge highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent)',
        }} />
        {/* Left edge highlight */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: 1,
          background: 'linear-gradient(180deg, rgba(255,255,255,.1), transparent)',
        }} />
        {/* Interior horizontal lines */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          {[82, 58, 70, 44].map((w, i) => (
            <div key={i} style={{
              height: 1, width: `${w}%`, marginBottom: i < 3 ? 7 : 0,
              background: 'rgba(255,255,255,.055)', borderRadius: 1,
            }} />
          ))}
        </div>
        {/* Status dots top-right */}
        <div style={{ position: 'absolute', top: 9, right: 12, display: 'flex', gap: 5 }}>
          {[true, false, false].map((active, i) => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: active ? '#4ade80' : 'rgba(255,255,255,.1)',
              animation: active ? 'sl-led 3s ease-in-out infinite' : 'none',
            }} />
          ))}
        </div>
        {/* Subtle geometric shape */}
        <div style={{
          position: 'absolute', top: 22, left: 14,
          width: 36, height: 36,
          border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 3, transform: 'rotate(12deg)',
        }} />
        <div style={{
          position: 'absolute', top: 30, left: 22,
          width: 36, height: 36,
          border: '1px solid rgba(255,255,255,.04)',
          borderRadius: 3, transform: 'rotate(12deg)',
        }} />
      </div>

      {/* Rack units at bottom */}
      <div style={{
        position: 'absolute', bottom: 10, left: 18, right: 18,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {[
          { h: 17, op: 0.075, dots: 2, green: 0 },
          { h: 14, op: 0.055, dots: 3, green: -1 },
          { h: 12, op: 0.04,  dots: 1, green: -1 },
          { h: 9,  op: 0.028, dots: 4, green: -1 },
        ].map((rack, i) => (
          <div key={i} style={{
            height: rack.h, background: `rgba(255,255,255,${rack.op})`,
            borderRadius: 2, border: `1px solid rgba(255,255,255,${rack.op * 1.4})`,
            display: 'flex', alignItems: 'center', paddingLeft: 9, gap: 4,
          }}>
            {Array.from({ length: rack.dots }).map((_, j) => (
              <div key={j} style={{
                width: 3, height: 3, borderRadius: '50%',
                background: j === rack.green ? 'rgba(74,222,128,.75)' : 'rgba(255,255,255,.1)',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────── */
export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('');

  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) { setError(err.errors[0].message); return; }
    }
    setIsSubmitting(true);
    const result = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    if (result.error) setError(typeof result.error === 'string' ? result.error : 'Invalid credentials. Please try again.');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) { setError(err.errors[0].message); return; }
    }
    if (!signupDepartment) { setError('Please select your department'); return; }
    setIsSubmitting(true);
    const result = await signUp(signupEmail, signupPassword, signupName, signupDepartment);
    setIsSubmitting(false);
    if (result.error) {
      setError(typeof result.error === 'string' ? result.error : 'Registration failed.');
    } else if (result.needsVerification) {
      setVerifyEmail(result.email || signupEmail);
      setShowVerify(true);
      setError(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (verifyOtp.length !== 6) { setError('OTP must be 6 digits'); return; }
    setIsSubmitting(true);
    try {
      await authService.verifyEmail(verifyEmail, verifyOtp);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try { await authService.resendVerification(verifyEmail); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to resend OTP'); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eeece9' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid #111', borderTopColor: 'transparent', animation: 'spin .75s linear infinite' }} />
      </div>
    );
  }

  /* ── Eye icon ── */
  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="sl-root" style={{ minHeight: '100vh', display: 'flex' }}>

        {/* ── LEFT PANEL ─────────────────────────────────────── */}
        <div
          className="sl-left-panel"
          style={{
            width: 340, flexShrink: 0, background: '#0b0b0b',
            display: 'flex', flexDirection: 'column', padding: '44px 32px',
            position: 'relative',
          }}
        >
          {/* Logo + tagline */}
          <div style={{ marginBottom: 52 }}>
            <div style={{
              fontSize: 26, fontWeight: 700, color: 'white',
              letterSpacing: '-.2px', marginBottom: 14, fontFamily: 'Outfit, sans-serif',
            }}>
              Slate
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.28)', lineHeight: 1.65, maxWidth: 230 }}>
              The Digital Monolith. High-efficiency workspace for editorial software.
            </p>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1 }}>
            <button
              className={`sl-nav-btn ${isLogin && !showVerify ? 'sl-nav-on' : 'sl-nav-off'}`}
              onClick={() => { if (!showVerify) { setIsLogin(true); setError(null); } }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign in
            </button>
            <button
              className={`sl-nav-btn ${(!isLogin || showVerify) ? 'sl-nav-on' : 'sl-nav-off'}`}
              onClick={() => { if (!showVerify) { setIsLogin(false); setError(null); } }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Create account
            </button>
          </nav>

          {/* Machine art */}
          <MachineArt />
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────── */}
        <div
          className="sl-right-panel"
          style={{
            flex: 1, background: '#edecea',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '60px 80px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 460 }}>

            {/* ── OTP VERIFY ─────────────────────────────── */}
            {showVerify ? (
              <div className="sl-slide">
                <div style={{ marginBottom: 36 }}>
                  <div style={{
                    width: 52, height: 52, background: '#111', borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 28, position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 14,
                      border: '1.5px solid rgba(0,0,0,.15)',
                      animation: 'sl-pulse-ring 2s ease-out infinite',
                    }} />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <h1 className="sl-heading" style={{
                    fontFamily: 'Bricolage Grotesque, sans-serif',
                    fontSize: 48, fontWeight: 800, color: '#111',
                    lineHeight: 1.1, letterSpacing: '-.5px', marginBottom: 12,
                  }}>
                    Check your<br />inbox.
                  </h1>
                  <p style={{ fontSize: 14.5, color: '#888', lineHeight: 1.55 }}>
                    We sent a 6-digit code to{' '}
                    <span style={{ color: '#111', fontWeight: 600 }}>{verifyEmail}</span>
                  </p>
                </div>

                {devOtp && (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '12px 16px', marginBottom: 22 }}>
                    <p style={{ fontSize: 10, color: '#854d0e', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Dev OTP</p>
                    <p style={{ fontSize: 28, fontFamily: 'monospace', fontWeight: 700, color: '#92400e', letterSpacing: 10 }}>{devOtp}</p>
                  </div>
                )}

                {error && <div className="sl-err">{error}</div>}

                <form onSubmit={handleVerifyOtp}>
                  <div style={{ marginBottom: 24 }}>
                    <label className="sl-field-label">Verification code</label>
                    <input
                      className="sl-otp-input"
                      type="text"
                      placeholder="· · · · · ·"
                      value={verifyOtp}
                      onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  <button className="sl-btn-primary" type="submit" disabled={isSubmitting} style={{ marginBottom: 18 }}>
                    {isSubmitting ? 'Verifying…' : <>Verify &amp; continue →</>}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 13.5, color: '#888' }}>
                    Didn't receive it?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontWeight: 600, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', padding: 0 }}
                    >
                      Resend code
                    </button>
                  </p>
                </form>
              </div>

            ) : (
              /* ── AUTH FORMS ─────────────────────────────── */
              <div className="sl-slide">
                {/* Heading */}
                <div style={{ marginBottom: 38 }}>
                  <h1 className="sl-heading" style={{
                    fontFamily: 'Bricolage Grotesque, sans-serif',
                    fontSize: 54, fontWeight: 800, color: '#111',
                    lineHeight: 1.08, letterSpacing: '-.6px', marginBottom: 14,
                  }}>
                    {isLogin ? <>Welcome<br />back.</> : <>Create an<br />account</>}
                  </h1>
                  <p style={{ fontSize: 15, color: '#8a8784', lineHeight: 1.5 }}>
                    {isLogin ? 'Sign in to your Slate workspace.' : 'Join modern teams building the future.'}
                  </p>
                </div>

                {error && <div className="sl-err">{error}</div>}

                {/* ── LOGIN ─────────────── */}
                {isLogin ? (
                  <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 18 }} className="sl-fade-1">
                      <label className="sl-field-label">Email address</label>
                      <input
                        className="sl-input-box"
                        type="email"
                        placeholder="elias@slate.io"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }} className="sl-fade-2">
                      <label className="sl-field-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="sl-input-box"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          style={{ paddingRight: 48 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          style={{
                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: '#999',
                            display: 'flex', alignItems: 'center', padding: 0,
                          }}
                        >
                          <EyeIcon open={showPassword} />
                        </button>
                      </div>
                    </div>

                    <div className="sl-fade-3" style={{ textAlign: 'right', marginBottom: 28 }}>
                      <Link to="/forgot-password" style={{ fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500 }}>
                        Forgot password?
                      </Link>
                    </div>

                    <div className="sl-fade-4">
                      <button className="sl-btn-primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in…' : <>Sign in →</>}
                      </button>
                    </div>

                    <div className="sl-divider">or continue with</div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                      <div className="sl-btn-social">
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                      </div>
                      <div className="sl-btn-social">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        SSO
                      </div>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: 13.5, color: '#8a8784' }}>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setIsLogin(false); setError(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontWeight: 600, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', padding: 0 }}
                      >
                        Sign up
                      </button>
                    </p>
                  </form>

                ) : (
                  /* ── SIGNUP ────────────── */
                  <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: 18 }} className="sl-fade-1">
                      <label className="sl-field-label">Full name</label>
                      <input
                        className="sl-input-box"
                        type="text"
                        placeholder="Elias Thorne"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div style={{ marginBottom: 18 }} className="sl-fade-2">
                      <label className="sl-field-label">Email address</label>
                      <input
                        className="sl-input-box"
                        type="email"
                        placeholder="elias@slate.io"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div style={{ marginBottom: 18, position: 'relative' }} className="sl-fade-3">
                      <label className="sl-field-label">Department</label>
                      <select
                        className={`sl-select-box${!signupDepartment ? ' sl-select-placeholder' : ''}`}
                        value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)}
                        required
                        disabled={isSubmitting}
                        style={{ color: !signupDepartment ? '#aaa8a4' : '#111' }}
                      >
                        <option value="" disabled>Select department</option>
                        <option value="Marketing Team">Marketing Team</option>
                        <option value="Developer">Developer</option>
                        <option value="Department Head">Department Head</option>
                        <option value="Other">Other</option>
                      </select>
                      <div style={{ position: 'absolute', right: 14, bottom: 15, pointerEvents: 'none', color: '#999' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    </div>

                    <div style={{ marginBottom: 28 }} className="sl-fade-4">
                      <label className="sl-field-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="sl-input-box"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 6 characters"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          style={{ paddingRight: 48 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          style={{
                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: '#999',
                            display: 'flex', alignItems: 'center', padding: 0,
                          }}
                        >
                          <EyeIcon open={showPassword} />
                        </button>
                      </div>
                    </div>

                    <div className="sl-fade-5">
                      <button className="sl-btn-primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating account…' : <>Sign up →</>}
                      </button>
                    </div>

                    <div className="sl-divider">or continue with</div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                      <div className="sl-btn-social">
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                      </div>
                      <div className="sl-btn-social">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        SSO
                      </div>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: 13.5, color: '#8a8784' }}>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setIsLogin(true); setError(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontWeight: 600, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', padding: 0 }}
                      >
                        Log in
                      </button>
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
