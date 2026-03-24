import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  .sl-root { font-family: 'DM Sans', sans-serif; }

  @keyframes sl-float-a {
    0%,100% { transform: translateY(0px) rotate(-3deg); }
    50%      { transform: translateY(-14px) rotate(-3deg); }
  }
  @keyframes sl-float-b {
    0%,100% { transform: translateY(0px) rotate(4deg); }
    50%      { transform: translateY(-20px) rotate(4deg); }
  }
  @keyframes sl-float-c {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%      { transform: translateY(-9px) rotate(-1deg); }
  }
  @keyframes sl-fade-up {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes sl-slide-right {
    from { opacity:0; transform:translateX(24px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes sl-pulse-ring {
    0%   { transform:scale(1);   opacity:.6; }
    100% { transform:scale(1.5); opacity:0; }
  }
  @keyframes sl-progress {
    from { width:0; }
  }
  @keyframes sl-bar-rise {
    from { height: 0; }
  }
  @keyframes sl-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes sl-glow-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(245,166,35,.55); }
    50%      { box-shadow: 0 0 0 6px rgba(245,166,35,0); }
  }
  @keyframes sl-status-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: .2; }
  }

  .sl-float-a { animation: sl-float-a 7s ease-in-out infinite; }
  .sl-float-b { animation: sl-float-b 9s ease-in-out infinite 1.2s; }
  .sl-float-c { animation: sl-float-c 6s ease-in-out infinite 2.5s; }

  .sl-fade-1 { animation: sl-fade-up .55s ease both; }
  .sl-fade-2 { animation: sl-fade-up .55s .1s ease both; }
  .sl-fade-3 { animation: sl-fade-up .55s .18s ease both; }
  .sl-fade-4 { animation: sl-fade-up .55s .26s ease both; }
  .sl-fade-5 { animation: sl-fade-up .55s .34s ease both; }
  .sl-slide  { animation: sl-slide-right .38s ease both; }

  .sl-grid {
    background-image:
      linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
    background-size: 44px 44px;
  }

  .sl-card {
    background: rgba(255,255,255,.06);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 16px;
    padding: 18px 20px;
    color: white;
    overflow: hidden;
  }
  .sl-card-amber {
    background: rgba(245,166,35,.08);
    border-color: rgba(245,166,35,.32);
  }
  .sl-card-glow-amber {
    box-shadow: 0 0 0 1px rgba(245,166,35,.28), 0 28px 70px rgba(245,166,35,.16), 0 10px 24px rgba(0,0,0,.55);
  }
  .sl-card-glow-purple {
    box-shadow: 0 0 0 1px rgba(139,92,246,.22), 0 18px 44px rgba(139,92,246,.12), 0 7px 18px rgba(0,0,0,.45);
  }
  .sl-card-glow-teal {
    box-shadow: 0 0 0 1px rgba(20,184,166,.2), 0 18px 44px rgba(20,184,166,.09), 0 7px 18px rgba(0,0,0,.42);
  }
  .sl-live-badge { animation: sl-glow-pulse 2.2s ease-in-out infinite; }

  .sl-progress-track {
    height: 3px;
    background: rgba(255,255,255,.12);
    border-radius: 2px;
    overflow: hidden;
  }
  .sl-progress-fill {
    height: 100%;
    background: #f5a623;
    border-radius: 2px;
    animation: sl-progress .9s .4s ease both;
  }

  /* Form elements */
  .sl-label {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 1.1px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .sl-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1.5px solid #e5e7eb;
    padding: 11px 0;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    color: #111318;
    outline: none;
    transition: border-color .2s;
    box-sizing: border-box;
  }
  .sl-input::placeholder { color: #c4c9d4; }
  .sl-input:focus { border-color: #111318; }
  .sl-input:disabled { opacity: .5; }

  .sl-select {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1.5px solid #e5e7eb;
    padding: 11px 0;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    color: #111318;
    outline: none;
    appearance: none;
    cursor: pointer;
    transition: border-color .2s;
    box-sizing: border-box;
  }
  .sl-select:focus { border-color: #111318; }
  .sl-select option { color: #111318; background: white; }

  .sl-btn {
    width: 100%;
    background: #111318;
    color: #fafafa;
    border: none;
    padding: 15px;
    font-size: 14.5px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    letter-spacing: .4px;
    cursor: pointer;
    transition: background .18s, transform .1s;
    border-radius: 0;
  }
  .sl-btn:hover:not(:disabled) { background: #1c2230; }
  .sl-btn:active:not(:disabled) { transform: scale(.99); }
  .sl-btn:disabled { background: #d1d5db; cursor: not-allowed; }

  .sl-tab {
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
    padding: 0 0 14px;
    margin-bottom: -1px;
    transition: color .2s, border-color .2s;
  }
  .sl-tab-on  { color: #111318; border-bottom: 2px solid #111318; }
  .sl-tab-off { color: #c4c9d4; border-bottom: 2px solid transparent; }
  .sl-tab-off:hover { color: #9ca3af; }

  .sl-otp {
    width: 100%;
    text-align: center;
    font-size: 30px;
    letter-spacing: 14px;
    font-family: 'DM Sans', monospace;
    background: transparent;
    border: none;
    border-bottom: 1.5px solid #e5e7eb;
    padding: 16px 0;
    outline: none;
    color: #111318;
    transition: border-color .2s;
    box-sizing: border-box;
  }
  .sl-otp:focus { border-color: #111318; }

  .sl-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 10px 14px;
    color: #b91c1c;
    font-size: 13px;
    margin-bottom: 20px;
    animation: sl-fade-up .3s ease both;
  }

  .sl-pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(245,166,35,.4);
    animation: sl-pulse-ring 1.5s ease-out infinite;
  }

  .sl-badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 4px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: .8px;
    text-transform: uppercase;
  }

  .sl-avatar-row {
    display: flex;
  }
  .sl-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,.15);
    margin-left: -6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: white;
  }
`;

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ position: 'relative', width: 40, height: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #f5a623', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sl-root" style={{ minHeight: '100vh', display: 'flex', background: '#fafafa' }}>

        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div
          className="sl-grid"
          style={{
            display: 'none',
            position: 'relative',
            overflow: 'hidden',
            background: '#0f1117',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 56px',
          }}
          // Use media query via inline — handled by className below
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,166,35,.1) 0%, transparent 65%)',
            top: '-10%', left: '-5%', filter: 'blur(60px)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 65%)',
            bottom: '15%', right: '5%', filter: 'blur(50px)', pointerEvents: 'none'
          }} />

          {/* Logo */}
          <div className="sl-fade-1" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, background: '#f5a623', borderRadius: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f1117" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 600, letterSpacing: '-.3px' }}>Slate</span>
          </div>

          {/* Floating cards */}
          <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 320, height: 390 }}>

              {/* Card C — back left · Design */}
              <div className="sl-card sl-float-c sl-card-glow-teal" style={{
                position: 'absolute', top: 14, left: -18,
                width: 205, opacity: .58,
                background: 'rgba(20,184,166,.07)', borderColor: 'rgba(20,184,166,.22)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#14b8a6', flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.4)', letterSpacing: .9, textTransform: 'uppercase' }}>Design</span>
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(20,184,166,.55)', fontFamily: 'monospace', letterSpacing: .5 }}>#DES-12</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 11, lineHeight: 1.3 }}>UI Component Library</div>
                <div className="sl-progress-track" style={{ marginBottom: 10 }}>
                  <div style={{ height: '100%', width: '45%', background: 'linear-gradient(90deg,#14b8a6,#06b6d4)', borderRadius: 2, animation: 'sl-progress .9s .5s ease both' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  {[['✓','Buttons'], ['✓','Form inputs'], ['○','Data tables'], ['○','Charts']].map(([c, label], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3.5 }}>
                      <span style={{ fontSize: 9, color: c === '✓' ? '#14b8a6' : 'rgba(255,255,255,.2)', lineHeight: 1 }}>{c}</span>
                      <span style={{ fontSize: 10.5, color: c === '✓' ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.18)', textDecoration: c === '✓' ? 'line-through' : 'none' }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="sl-avatar-row">
                    {[['ML','#14b8a6'],['AR','#0891b2']].map(([init, bg], i) => (
                      <div key={i} className="sl-avatar" style={{ background: bg as string, marginLeft: i === 0 ? 0 : -6, color: '#fff' }}>{init}</div>
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>8 tasks</span>
                </div>
              </div>

              {/* Card B — back right · Backend */}
              <div className="sl-card sl-float-b sl-card-glow-purple" style={{
                position: 'absolute', bottom: 22, right: -28,
                width: 198, opacity: .6,
                background: 'rgba(139,92,246,.07)', borderColor: 'rgba(139,92,246,.22)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.4)', letterSpacing: .9, textTransform: 'uppercase' }}>Backend</span>
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(139,92,246,.55)', fontFamily: 'monospace' }}>#BKD-42</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 11, lineHeight: 1.3 }}>Auth Integration</div>
                <div style={{ marginBottom: 11, padding: '8px 10px', background: 'rgba(139,92,246,.1)', borderRadius: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', animation: 'sl-status-blink 2s ease infinite' }} />
                    <span className="sl-badge" style={{ background: 'rgba(74,222,128,.15)', color: '#4ade80', fontSize: 9 }}>In Review</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, alignItems: 'center' }}>
                    <span style={{ color: '#4ade80' }}>+247</span>
                    <span style={{ color: '#f87171' }}>-38</span>
                    <span style={{ color: 'rgba(255,255,255,.22)', fontSize: 9 }}>PR #42</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="sl-avatar-row">
                    {[['SK','#8b5cf6'],['MN','#6366f1']].map(([init, bg], i) => (
                      <div key={i} className="sl-avatar" style={{ background: bg as string, marginLeft: i === 0 ? 0 : -6, color: '#fff' }}>{init}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.28)' }}>2</span>
                  </div>
                </div>
              </div>

              {/* Card A — front/main · Active Sprint */}
              <div className="sl-card sl-card-amber sl-float-a sl-card-glow-amber" style={{
                position: 'absolute', top: 78, left: 62,
                width: 248, zIndex: 2,
              }}>
                {/* Shimmer sweep */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                  background: 'linear-gradient(105deg, transparent 35%, rgba(245,166,35,.07) 50%, transparent 65%)',
                  backgroundSize: '300% 100%',
                  animation: 'sl-shimmer 3.5s ease-in-out infinite',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="sl-badge sl-live-badge" style={{ background: '#f5a623', color: '#0f1117', fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0f1117' }} />
                      Live
                    </span>
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.35)', letterSpacing: .8, textTransform: 'uppercase' }}>Sprint</span>
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(245,166,35,.5)', fontFamily: 'monospace' }}>#DASH-07</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.25, flex: 1 }}>Dashboard Redesign</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10, flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
                    <span style={{ fontSize: 9, color: '#f87171', textTransform: 'uppercase', letterSpacing: .4 }}>High</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(245,166,35,.7)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 11, color: 'rgba(245,166,35,.65)' }}>Due in 3 days</span>
                </div>
                <div className="sl-progress-track" style={{ marginBottom: 5 }}>
                  <div style={{ height: '100%', width: '72%', background: 'linear-gradient(90deg,#f5a623,#fbbf24)', borderRadius: 2, animation: 'sl-progress .9s .4s ease both' }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 14 }}>72% complete</div>
                {/* Activity sparkline */}
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 26, marginBottom: 14 }}>
                  {[40, 65, 32, 80, 50, 88, 60, 95, 72, 100].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, borderRadius: '2px 2px 0 0',
                      background: i >= 7 ? 'rgba(245,166,35,.9)' : 'rgba(245,166,35,.22)',
                      height: `${h}%`,
                      animation: `sl-bar-rise .5s ${i * .055}s ease both`
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="sl-avatar-row">
                    {[['NM','#f5a623'],['AR','#4ade80'],['SK','#60a5fa']].map(([init, bg], i) => (
                      <div key={i} className="sl-avatar" style={{ background: bg as string, marginLeft: i === 0 ? 0 : -6, color: '#0f1117', fontWeight: 800 }}>{init}</div>
                    ))}
                    <div className="sl-avatar" style={{ background: 'rgba(255,255,255,.1)', marginLeft: -6, color: 'rgba(255,255,255,.4)', fontSize: 8 }}>+2</div>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {[['#4ade80', '5'], ['#fbbf24', '2'], ['#f87171', '1']].map(([color, count], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: color as string }} />
                        <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.32)' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom copy */}
          <div className="sl-fade-2" style={{ position: 'relative', zIndex: 10 }}>
            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 36, fontWeight: 700, color: 'white',
              lineHeight: 1.22, marginBottom: 14,
            }}>
              Every great project<br />
              <em style={{ color: '#f5a623', fontStyle: 'italic' }}>starts here.</em>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, lineHeight: 1.7, maxWidth: 340 }}>
              Track tickets, manage teams, and ship on time — all in one elegant workspace built for modern teams.
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
              <div style={{ width: 38, height: 38, background: '#0f1117', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 600, color: '#111318', letterSpacing: '-.3px' }}>Slate</span>
            </div>

            {/* ── OTP VERIFY ── */}
            {showVerify ? (
              <div className="sl-slide">
                <div style={{
                  width: 56, height: 56,
                  background: '#0f1117',
                  borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 28, position: 'relative'
                }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 16, border: '1.5px solid rgba(245,166,35,.4)', animation: 'sl-pulse-ring 2s ease-out infinite' }} />
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111318', letterSpacing: '-.5px', marginBottom: 8 }}>
                    Check your inbox
                  </h2>
                  <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.65 }}>
                    We sent a 6-digit code to{' '}
                    <span style={{ color: '#111318', fontWeight: 600 }}>{verifyEmail}</span>
                  </p>
                </div>

                {devOtp && (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
                    <p style={{ fontSize: 10, color: '#854d0e', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Dev Mode OTP</p>
                    <p style={{ fontSize: 26, fontFamily: 'monospace', fontWeight: 700, color: '#92400e', letterSpacing: 10 }}>{devOtp}</p>
                  </div>
                )}

                {error && <div className="sl-error">{error}</div>}

                <form onSubmit={handleVerifyOtp}>
                  <div style={{ marginBottom: 28 }}>
                    <label className="sl-label">Verification code</label>
                    <input
                      className="sl-otp"
                      type="text"
                      placeholder="· · · · · ·"
                      value={verifyOtp}
                      onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <button className="sl-btn" type="submit" disabled={isSubmitting} style={{ marginBottom: 20 }}>
                    {isSubmitting ? 'Verifying…' : 'Verify & continue →'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
                    Didn't receive it?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111318', fontWeight: 600, fontSize: 13, fontFamily: 'DM Sans, sans-serif', padding: 0 }}
                    >
                      Resend code
                    </button>
                  </p>
                </form>
              </div>
            ) : (
              <div className="sl-slide">

                {/* Tab bar */}
                <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid #f0f0f0', marginBottom: 36 }}>
                  <button
                    className={`sl-tab ${isLogin ? 'sl-tab-on' : 'sl-tab-off'}`}
                    onClick={() => { setIsLogin(true); setError(null); }}
                  >
                    Sign in
                  </button>
                  <button
                    className={`sl-tab ${!isLogin ? 'sl-tab-on' : 'sl-tab-off'}`}
                    onClick={() => { setIsLogin(false); setError(null); }}
                  >
                    Create account
                  </button>
                </div>

                {/* Heading */}
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 27, fontWeight: 700, color: '#111318', letterSpacing: '-.5px', marginBottom: 6 }}>
                    {isLogin ? 'Welcome back' : 'Join Slate'}
                  </h2>
                  <p style={{ color: '#b0b6c3', fontSize: 14 }}>
                    {isLogin ? 'Enter your credentials to continue' : 'Create your workspace in seconds'}
                  </p>
                </div>

                {error && <div className="sl-error">{error}</div>}

                {/* ── LOGIN FORM ── */}
                {isLogin ? (
                  <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 26 }} className="sl-fade-1">
                      <label className="sl-label">Email address</label>
                      <input className="sl-input" type="email" placeholder="you@company.com"
                        value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: 12 }} className="sl-fade-2">
                      <label className="sl-label">Password</label>
                      <input className="sl-input" type="password" placeholder="••••••••"
                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    </div>
                    <div className="sl-fade-3" style={{ marginBottom: 32, textAlign: 'right' }}>
                      <Link to="/forgot-password" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>
                        Forgot password?
                      </Link>
                    </div>
                    <div className="sl-fade-4">
                      <button className="sl-btn" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in…' : 'Sign in →'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── SIGNUP FORM ── */
                  <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: 24 }} className="sl-fade-1">
                      <label className="sl-label">Full name</label>
                      <input className="sl-input" type="text" placeholder="Muhammad Nidhil"
                        value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: 24 }} className="sl-fade-2">
                      <label className="sl-label">Work email</label>
                      <input className="sl-input" type="email" placeholder="you@company.com"
                        value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: 24, position: 'relative' }} className="sl-fade-3">
                      <label className="sl-label">Department</label>
                      <select className="sl-select" value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)} required>
                        <option value="" disabled>Select department</option>
                        <option value="Marketing Team">Marketing Team</option>
                        <option value="Developer">Developer</option>
                        <option value="Department Head">Department Head</option>
                        <option value="Other">Other</option>
                      </select>
                      <div style={{ position: 'absolute', right: 0, bottom: 14, pointerEvents: 'none', color: '#9ca3af' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>
                    <div style={{ marginBottom: 32 }} className="sl-fade-4">
                      <label className="sl-label">Password</label>
                      <input className="sl-input" type="password" placeholder="Min. 6 characters"
                        value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                    </div>
                    <div className="sl-fade-5">
                      <button className="sl-btn" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating account…' : 'Create account →'}
                      </button>
                    </div>
                  </form>
                )}

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12.5, color: '#c4c9d4' }}>
                  {isLogin ? 'No account yet?' : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111318', fontWeight: 600, fontSize: 12.5, fontFamily: 'DM Sans, sans-serif', padding: 0 }}
                  >
                    {isLogin ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Show left panel on large screens */}
        <style>{`
          @media (min-width: 1024px) {
            .sl-root > div:first-child { display: flex !important; width: 54%; }
            .sl-root > div:last-child  { width: 46%; }
          }
        `}</style>
      </div>
    </>
  );
}
