import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

/* ─── CSS ───────────────────────────────────────────────── */
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
    0%   { transform:scale(1);   opacity:.45; }
    100% { transform:scale(1.7); opacity:0; }
  }
  @keyframes sl-led {
    0%,100% { opacity:.9; box-shadow: 0 0 5px rgba(74,222,128,.6); }
    50%      { opacity:.4; box-shadow: 0 0 2px rgba(74,222,128,.2); }
  }
  @keyframes sl-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes sl-amber-glow {
    0%,100% { opacity:1; }
    50%      { opacity:.5; }
  }
  @keyframes sl-tile-fade {
    0%,100% { opacity:.55; }
    50%      { opacity:.95; }
  }
  @keyframes sl-float-a {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-2px); }
  }
  @keyframes sl-float-b {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-2.5px); }
  }
  @keyframes sl-progress {
    0%,8%      { width:12%; }
    55%,72%    { width:80%; }
    96%,100%   { width:12%; }
  }
  @keyframes sl-drag {
    0%,34%  { transform:translateX(0) rotate(0deg); border-color:rgba(217,119,6,.3); box-shadow:none; }
    46%,56% { transform:translateX(4px) rotate(.5deg); border-color:rgba(217,119,6,.65); box-shadow:0 4px 16px rgba(217,119,6,.2); }
    68%,100%{ transform:translateX(0) rotate(0deg); border-color:rgba(217,119,6,.3); box-shadow:none; }
  }
  @keyframes sl-appear {
    0%,54%    { opacity:0; transform:translateY(5px); }
    67%,88%   { opacity:1; transform:translateY(0); }
    98%,100%  { opacity:0; transform:translateY(0); }
  }
  @keyframes sl-count-pulse {
    0%,100% { opacity:1; }
    50%     { opacity:.45; }
  }

  .sl-fade-1 { animation: sl-fade-up .48s ease both; }
  .sl-fade-2 { animation: sl-fade-up .48s .07s ease both; }
  .sl-fade-3 { animation: sl-fade-up .48s .14s ease both; }
  .sl-fade-4 { animation: sl-fade-up .48s .21s ease both; }
  .sl-fade-5 { animation: sl-fade-up .48s .28s ease both; }
  .sl-slide  { animation: sl-slide-in .32s ease both; }

  /* Left nav */
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
  .sl-nav-off:hover { color: rgba(255,255,255,.65); background: rgba(255,255,255,.04); }

  /* Inputs */
  .sl-field-label {
    display: block; font-size: 10px; font-weight: 600;
    color: #8a8784; letter-spacing: 1.5px;
    text-transform: uppercase; margin-bottom: 9px;
  }
  .sl-input-box {
    width: 100%; background: #e1dfdb; border: 2px solid transparent;
    border-radius: 7px; padding: 13px 16px; font-size: 15px;
    font-family: 'Outfit', sans-serif; color: #111;
    outline: none; transition: background .18s, border-color .18s;
  }
  .sl-input-box::placeholder { color: #aaa8a4; }
  .sl-input-box:focus { background: #d8d6d2; border-color: #111; }
  .sl-input-box:disabled { opacity: .5; }
  .sl-input-err { border-color: #f87171 !important; background: #fef2f2 !important; }

  .sl-select-box {
    width: 100%; background: #e1dfdb; border: 2px solid transparent;
    border-radius: 7px; padding: 13px 16px; font-size: 15px;
    font-family: 'Outfit', sans-serif; color: #111;
    outline: none; appearance: none; cursor: pointer; transition: background .18s, border-color .18s;
  }
  .sl-select-box:focus { background: #d8d6d2; border-color: #111; }
  .sl-select-box option { background: white; color: #111; }

  /* OTP boxes */
  .sl-otp-box {
    width: 48px; height: 52px; flex-shrink: 0; text-align: center;
    font-size: 20px; font-weight: 700; font-family: 'Outfit', monospace;
    background: #e1dfdb; border: 2px solid transparent;
    border-radius: 8px; outline: none; color: #111;
    transition: border-color .15s, background .15s; caret-color: transparent;
  }
  .sl-otp-box:focus { border-color: #111; background: #d8d6d2; }
  .sl-otp-box.filled { border-color: rgba(0,0,0,.2); }

  /* Buttons */
  .sl-btn-primary {
    width: 100%; background: #111; color: white; border: none;
    border-radius: 8px; padding: 16px 20px; font-size: 15px;
    font-family: 'Outfit', sans-serif; font-weight: 600;
    cursor: pointer; transition: background .15s, transform .1s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    min-height: 54px;
  }
  .sl-btn-primary:hover:not(:disabled) { background: #1d1d1d; }
  .sl-btn-primary:active:not(:disabled) { transform: scale(.99); }
  .sl-btn-primary:disabled { background: #c4c2be; cursor: not-allowed; color: #888; }

  /* Divider */
  .sl-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0; color: #aaa; font-size: 10px;
    font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .sl-divider::before, .sl-divider::after { content:''; flex:1; height:1px; background:#cdc9c5; }

  /* Custom checkbox */
  .sl-check-wrap { display: flex; align-items: center; gap: 9px; cursor: pointer; user-select: none; }
  .sl-check-box {
    width: 17px; height: 17px; border-radius: 4px; flex-shrink: 0;
    border: 1.5px solid #c0bebb; background: #e1dfdb;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .sl-check-box.checked { background: #111; border-color: #111; }

  /* Field-level error */
  .sl-field-err { font-size: 12px; color: #ef4444; margin-top: 5px; display: block; }

  /* Global error box */
  .sl-err {
    background: #fee2e2; border: 1px solid #fca5a5; border-radius: 7px;
    padding: 11px 14px; color: #991b1b; font-size: 13px;
    margin-bottom: 18px; animation: sl-fade-up .3s ease both;
  }

  /* Mobile header */
  .sl-mobile-logo { display: none; }

  @media (max-width: 860px) {
    .sl-left-panel { display: none !important; }
    .sl-right-panel { padding: 40px 28px !important; justify-content: flex-start !important; }
    .sl-right-inner { padding-top: 0 !important; }
    .sl-heading { font-size: 40px !important; }
    .sl-mobile-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
  }
`;

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

/* ─── Custom checkbox ───────────────────────────────────── */
function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label className="sl-check-wrap" onClick={() => onChange(!checked)}>
      <div className={`sl-check-box${checked ? ' checked' : ''}`}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13.5, color: '#6b6967', lineHeight: 1.45 }}>{label}</span>
    </label>
  );
}

/* ─── 6-box OTP input ───────────────────────────────────── */
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
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el; }}
          className={`sl-otp-box${value[idx] && value[idx] !== ' ' ? ' filled' : ''}`}
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

/* ─── Machine art (left panel bottom) ──────────────────── */
function MachineArt() {
  return (
    <div style={{
      borderRadius: 12,
      background: '#080808',
      border: '1px solid rgba(255,255,255,.07)',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 13px 8px',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        background: 'rgba(255,255,255,.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* Animated logo mark */}
          <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="8.5" height="8.5" rx="2"
              fill="rgba(255,255,255,0.55)"
              style={{ animation: 'sl-tile-fade 3s ease-in-out infinite' }} />
            <rect x="12.5" y="1" width="8.5" height="8.5" rx="2"
              fill="#d97706"
              style={{ animation: 'sl-amber-glow 2s ease-in-out infinite' }} />
            <rect x="1" y="12.5" width="8.5" height="8.5" rx="2"
              fill="rgba(255,255,255,0.55)"
              style={{ animation: 'sl-tile-fade 3s ease-in-out infinite 1s' }} />
            <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="2"
              fill="rgba(255,255,255,0.2)"
              style={{ animation: 'sl-tile-fade 3s ease-in-out infinite 0.5s' }} />
          </svg>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.3px',
            color: 'rgba(255,255,255,.45)',
            fontFamily: 'Bricolage Grotesque, sans-serif',
          }}>Slate</span>
        </div>
        {/* Status dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {['#4ade80', 'rgba(255,255,255,.12)', 'rgba(255,255,255,.12)'].map((c, i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: c,
              animation: i === 0 ? 'sl-led 2.5s ease-in-out infinite' : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* ── Kanban columns ── */}
      <div style={{ display: 'flex', gap: 7, padding: '9px 11px 10px' }}>

        {/* TO DO */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.22)', flexShrink: 0 }} />
            <span style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>To Do</span>
          </div>
          {/* card 1 */}
          <div style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 5, padding: '6px 7px', marginBottom: 5,
            animation: 'sl-float-a 4s ease-in-out infinite',
          }}>
            <div style={{ height: 2.5, width: '82%', background: 'rgba(255,255,255,.18)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 2, width: '55%', background: 'rgba(255,255,255,.08)', borderRadius: 1, marginBottom: 5 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
              <div style={{ height: 2.5, width: 14, borderRadius: 2, background: 'rgba(255,255,255,.08)' }} />
            </div>
          </div>
          {/* card 2 */}
          <div style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 5, padding: '6px 7px',
            animation: 'sl-float-b 5s ease-in-out infinite .8s',
          }}>
            <div style={{ height: 2.5, width: '65%', background: 'rgba(255,255,255,.13)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 2, width: '40%', background: 'rgba(255,255,255,.06)', borderRadius: 1 }} />
          </div>
        </div>

        {/* IN PROGRESS */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#d97706', flexShrink: 0, animation: 'sl-led 2.5s ease-in-out infinite .5s' }} />
            <span style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Progress</span>
          </div>
          {/* dragging card */}
          <div style={{
            background: 'rgba(217,119,6,.09)', border: '1px solid rgba(217,119,6,.3)',
            borderRadius: 5, padding: '6px 7px', marginBottom: 5,
            animation: 'sl-drag 6s ease-in-out infinite',
          }}>
            <div style={{ height: 2.5, width: '88%', background: 'rgba(217,119,6,.6)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 2, width: '60%', background: 'rgba(217,119,6,.25)', borderRadius: 1, marginBottom: 5 }} />
            {/* inline progress */}
            <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#d97706,#f59e0b)', borderRadius: 2, animation: 'sl-progress 6s ease-in-out infinite' }} />
            </div>
          </div>
          {/* card 2 */}
          <div style={{
            background: 'rgba(217,119,6,.05)', border: '1px solid rgba(217,119,6,.2)',
            borderRadius: 5, padding: '6px 7px',
            animation: 'sl-float-a 4.5s ease-in-out infinite 1.2s',
          }}>
            <div style={{ height: 2.5, width: '70%', background: 'rgba(217,119,6,.4)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(217,119,6,.25)' }} />
              <div style={{ height: 2.5, width: 14, borderRadius: 2, background: 'rgba(217,119,6,.2)' }} />
            </div>
          </div>
        </div>

        {/* DONE */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Done</span>
          </div>
          {/* existing done card */}
          <div style={{
            background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.15)',
            borderRadius: 5, padding: '6px 7px', marginBottom: 5,
            animation: 'sl-float-b 5.5s ease-in-out infinite .3s',
          }}>
            <div style={{ height: 2.5, width: '76%', background: 'rgba(74,222,128,.4)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1px solid rgba(74,222,128,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 3, height: 3, background: '#4ade80', borderRadius: '50%' }} />
              </div>
              <div style={{ height: 2, width: '55%', background: 'rgba(74,222,128,.15)', borderRadius: 1 }} />
            </div>
          </div>
          {/* appearing card (task just completed) */}
          <div style={{
            background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.12)',
            borderRadius: 5, padding: '6px 7px',
            animation: 'sl-appear 6s ease-in-out infinite',
          }}>
            <div style={{ height: 2.5, width: '60%', background: 'rgba(74,222,128,.3)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 2, width: '38%', background: 'rgba(74,222,128,.12)', borderRadius: 1 }} />
          </div>
        </div>

      </div>

      {/* ── Bottom stats ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,.05)',
        padding: '7px 13px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 8.5, fontWeight: 600, color: 'rgba(255,255,255,.22)', letterSpacing: '.4px' }}>7 tasks</span>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: '#d97706', letterSpacing: '.4px', animation: 'sl-count-pulse 3s ease-in-out infinite' }}>2 active</span>
        </div>
        <div style={{ width: 52, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#d97706,#f59e0b)', borderRadius: 2, animation: 'sl-progress 8s ease-in-out infinite' }} />
        </div>
      </div>
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
  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', borderTopColor: 'white', animation: 'sl-spin .65s linear infinite', flexShrink: 0 }} />
);

/* ─── Main component ────────────────────────────────────── */
export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP verify
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Per-field validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Session expired banner
  const sessionExpired = new URLSearchParams(location.search).get('session') === 'expired';

  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const switchForm = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError(null);
    setFieldErrors({});
    setFormKey(k => k + 1);
  };

  const validateField = (key: string, value: string) => {
    let msg = '';
    try {
      if (key === 'loginEmail' || key === 'signupEmail') emailSchema.parse(value);
      else if (key === 'loginPassword' || key === 'signupPassword') passwordSchema.parse(value);
      else if (key === 'signupName') nameSchema.parse(value);
    } catch (e: any) { msg = e.errors?.[0]?.message || ''; }
    setFieldErrors(prev => ({ ...prev, [key]: msg }));
  };

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validate all login fields
    let hasErr = false;
    const errors: Record<string, string> = {};
    try { emailSchema.parse(loginEmail); } catch (e: any) { errors.loginEmail = e.errors[0].message; hasErr = true; }
    try { passwordSchema.parse(loginPassword); } catch (e: any) { errors.loginPassword = e.errors[0].message; hasErr = true; }
    if (hasErr) { setFieldErrors(errors); return; }
    setIsSubmitting(true);
    const result = await signIn(loginEmail, loginPassword, rememberMe);
    setIsSubmitting(false);
    if (result.needsVerification) {
      // Account exists but email not verified — send them to OTP screen
      setVerifyEmail(result.email || loginEmail);
      setShowVerify(true);
      setError(null);
      return;
    }
    if (result.error) setError(typeof result.error === 'string' ? result.error : 'Invalid credentials. Please try again.');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    let hasErr = false;
    try { nameSchema.parse(signupName); } catch (e: any) { errors.signupName = e.errors[0].message; hasErr = true; }
    try { emailSchema.parse(signupEmail); } catch (e: any) { errors.signupEmail = e.errors[0].message; hasErr = true; }
    try { passwordSchema.parse(signupPassword); } catch (e: any) { errors.signupPassword = e.errors[0].message; hasErr = true; }
    if (!signupDepartment) { errors.signupDepartment = 'Please select your department'; hasErr = true; }
    if (!agreedToTerms) { setError('Please agree to the Terms of Service to continue'); return; }
    if (hasErr) { setFieldErrors(errors); return; }
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
    const cleaned = verifyOtp.replace(/\s/g, '');
    if (cleaned.length !== 6) { setError('Please enter all 6 digits'); return; }
    setIsSubmitting(true);
    try {
      await authService.verifyEmail(verifyEmail, cleaned);
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#edecea' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid #111', borderTopColor: 'transparent', animation: 'sl-spin .75s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="sl-root" style={{ minHeight: '100vh', display: 'flex' }}>

        {/* ── LEFT PANEL ───────────────────────────────────── */}
        <div className="sl-left-panel" style={{
          width: 340, flexShrink: 0, background: '#0b0b0b',
          display: 'flex', flexDirection: 'column', padding: '44px 32px',
        }}>
          <div style={{ marginBottom: 52 }}>
            {/* Logo lockup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="1" width="8.5" height="8.5" rx="2" fill="rgba(255,255,255,0.75)"/>
                  <rect x="12.5" y="1" width="8.5" height="8.5" rx="2" fill="#d97706"/>
                  <rect x="1" y="12.5" width="8.5" height="8.5" rx="2" fill="rgba(255,255,255,0.75)"/>
                  <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="2" fill="rgba(255,255,255,0.3)"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.3px', lineHeight: 1.1 }}>Slate</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginTop: 3 }}>Project Management</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.28)', lineHeight: 1.65, maxWidth: 230 }}>
              The Digital Monolith. High-efficiency workspace for editorial software.
            </p>
          </div>

          <nav style={{ flex: 1 }}>
            <button className={`sl-nav-btn ${isLogin && !showVerify ? 'sl-nav-on' : 'sl-nav-off'}`} onClick={() => { if (!showVerify) switchForm(true); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign in
            </button>
            <button className={`sl-nav-btn ${(!isLogin || showVerify) ? 'sl-nav-on' : 'sl-nav-off'}`} onClick={() => { if (!showVerify) switchForm(false); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Create account
            </button>
          </nav>

          <MachineArt />
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────── */}
        <div className="sl-right-panel" style={{
          flex: 1, background: '#edecea',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 80px',
        }}>
          <div className="sl-right-inner" style={{ width: '100%', maxWidth: 460 }}>

            {/* Mobile logo — only visible on small screens */}
            <div className="sl-mobile-logo">
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: '#111', border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="1" width="8.5" height="8.5" rx="2" fill="rgba(255,255,255,0.85)"/>
                  <rect x="12.5" y="1" width="8.5" height="8.5" rx="2" fill="#d97706"/>
                  <rect x="1" y="12.5" width="8.5" height="8.5" rx="2" fill="rgba(255,255,255,0.85)"/>
                  <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="2" fill="rgba(255,255,255,0.4)"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 19, fontWeight: 800, color: '#111', letterSpacing: '-.3px', lineHeight: 1.1 }}>Slate</div>
                <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(0,0,0,.35)', marginTop: 2 }}>Project Management</div>
              </div>
            </div>

            {/* ── Session expired banner ──────────────────── */}
            {sessionExpired && !showVerify && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fef3c7', border: '1px solid #fbbf24',
                borderRadius: 8, padding: '11px 14px', marginBottom: 24,
                animation: 'sl-fade-up .3s ease both',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                  Your session expired after 1 hour of inactivity. Please sign in again.
                </span>
              </div>
            )}

            {/* ── OTP VERIFY ─────────────────────────────── */}
            {showVerify ? (
              <div className="sl-slide">
                <div style={{ marginBottom: 36 }}>
                  <div style={{ width: 52, height: 52, background: '#111', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 14, border: '1.5px solid rgba(0,0,0,.15)', animation: 'sl-pulse-ring 2s ease-out infinite' }} />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h1 className="sl-heading" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 48, fontWeight: 800, color: '#111', lineHeight: 1.1, letterSpacing: '-.5px', marginBottom: 12 }}>
                    Check your<br />inbox.
                  </h1>
                  <p style={{ fontSize: 14.5, color: '#8a8784', lineHeight: 1.55 }}>
                    We sent a 6-digit code to <span style={{ color: '#111', fontWeight: 600 }}>{verifyEmail}</span>
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
                    <label className="sl-field-label" style={{ marginBottom: 14 }}>Verification code</label>
                    <OtpBoxes value={verifyOtp} onChange={setVerifyOtp} disabled={isSubmitting} />
                  </div>
                  <button className="sl-btn-primary" type="submit" disabled={isSubmitting} style={{ marginBottom: 18 }}>
                    {isSubmitting ? <><Spinner /> Verifying…</> : <>Verify &amp; continue →</>}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 13.5, color: '#8a8784' }}>
                    Didn't receive it?{' '}
                    <button type="button" onClick={handleResendOtp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontWeight: 600, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', padding: 0 }}>
                      Resend code
                    </button>
                  </p>
                </form>
              </div>

            ) : (
              /* ── AUTH FORMS ────────────────────────────── */
              <div key={formKey} className="sl-slide">
                <div style={{ marginBottom: 36 }}>
                  <h1 className="sl-heading" style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 54, fontWeight: 800, color: '#111', lineHeight: 1.08, letterSpacing: '-.6px', marginBottom: 14 }}>
                    {isLogin ? <>Welcome<br />back.</> : <>Create an<br />account</>}
                  </h1>
                  <p style={{ fontSize: 15, color: '#8a8784' }}>
                    {isLogin ? 'Sign in to your Slate workspace.' : 'Join modern teams building the future.'}
                  </p>
                </div>

                {error && <div className="sl-err">{error}</div>}

                {/* ── LOGIN ─────────────────────────────── */}
                {isLogin ? (
                  <form onSubmit={handleLogin} noValidate>
                    <div style={{ marginBottom: 18 }} className="sl-fade-1">
                      <label className="sl-field-label">Email address</label>
                      <input
                        className={`sl-input-box${fieldErrors.loginEmail ? ' sl-input-err' : ''}`}
                        type="email" placeholder="elias@slate.io" autoFocus
                        value={loginEmail}
                        onChange={e => { setLoginEmail(e.target.value); clearFieldError('loginEmail'); }}
                        onBlur={() => validateField('loginEmail', loginEmail)}
                        disabled={isSubmitting}
                      />
                      {fieldErrors.loginEmail && <span className="sl-field-err">{fieldErrors.loginEmail}</span>}
                    </div>

                    <div style={{ marginBottom: 6 }} className="sl-fade-2">
                      <label className="sl-field-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className={`sl-input-box${fieldErrors.loginPassword ? ' sl-input-err' : ''}`}
                          type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => { setLoginPassword(e.target.value); clearFieldError('loginPassword'); }}
                          onBlur={() => validateField('loginPassword', loginPassword)}
                          disabled={isSubmitting}
                          style={{ paddingRight: 48 }}
                        />
                        <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', padding: 0 }}>
                          <EyeIcon open={showPassword} />
                        </button>
                      </div>
                      {fieldErrors.loginPassword && <span className="sl-field-err">{fieldErrors.loginPassword}</span>}
                    </div>

                    <div className="sl-fade-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                      <Checkbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
                      <Link to="/forgot-password" style={{ fontSize: 13, color: '#8a8784', textDecoration: 'none', fontWeight: 500 }}>
                        Forgot password?
                      </Link>
                    </div>

                    <div className="sl-fade-4">
                      <button className="sl-btn-primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Spinner /> Signing in…</> : <>Sign in →</>}
                      </button>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: '#8a8784' }}>
                      Don't have an account?{' '}
                      <button type="button" onClick={() => switchForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontWeight: 600, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', padding: 0 }}>
                        Sign up
                      </button>
                    </p>
                  </form>

                ) : (
                  /* ── SIGNUP ───────────────────────────── */
                  <form onSubmit={handleSignup} noValidate>
                    <div style={{ marginBottom: 18 }} className="sl-fade-1">
                      <label className="sl-field-label">Full name</label>
                      <input
                        className={`sl-input-box${fieldErrors.signupName ? ' sl-input-err' : ''}`}
                        type="text" placeholder="Elias Thorne" autoFocus
                        value={signupName}
                        onChange={e => { setSignupName(e.target.value); clearFieldError('signupName'); }}
                        onBlur={() => validateField('signupName', signupName)}
                        disabled={isSubmitting}
                      />
                      {fieldErrors.signupName && <span className="sl-field-err">{fieldErrors.signupName}</span>}
                    </div>

                    <div style={{ marginBottom: 18 }} className="sl-fade-2">
                      <label className="sl-field-label">Email address</label>
                      <input
                        className={`sl-input-box${fieldErrors.signupEmail ? ' sl-input-err' : ''}`}
                        type="email" placeholder="elias@slate.io"
                        value={signupEmail}
                        onChange={e => { setSignupEmail(e.target.value); clearFieldError('signupEmail'); }}
                        onBlur={() => validateField('signupEmail', signupEmail)}
                        disabled={isSubmitting}
                      />
                      {fieldErrors.signupEmail && <span className="sl-field-err">{fieldErrors.signupEmail}</span>}
                    </div>

                    <div style={{ marginBottom: 18, position: 'relative' }} className="sl-fade-3">
                      <label className="sl-field-label">Department</label>
                      <select
                        className="sl-select-box"
                        value={signupDepartment}
                        onChange={e => { setSignupDepartment(e.target.value); clearFieldError('signupDepartment'); }}
                        disabled={isSubmitting}
                        style={{ color: !signupDepartment ? '#aaa8a4' : '#111' }}
                      >
                        <option value="" disabled>Select department</option>
                        <option value="Marketing Team">Marketing Team</option>
                        <option value="Developer">Developer</option>
                        <option value="Department Head">Department Head</option>
                        <option value="Other">Other</option>
                      </select>
                      <div style={{ position: 'absolute', right: 14, bottom: fieldErrors.signupDepartment ? 28 : 15, pointerEvents: 'none', color: '#999' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                      </div>
                      {fieldErrors.signupDepartment && <span className="sl-field-err">{fieldErrors.signupDepartment}</span>}
                    </div>

                    <div style={{ marginBottom: 20 }} className="sl-fade-4">
                      <label className="sl-field-label">Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className={`sl-input-box${fieldErrors.signupPassword ? ' sl-input-err' : ''}`}
                          type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
                          value={signupPassword}
                          onChange={e => { setSignupPassword(e.target.value); clearFieldError('signupPassword'); }}
                          onBlur={() => validateField('signupPassword', signupPassword)}
                          disabled={isSubmitting}
                          style={{ paddingRight: 48 }}
                        />
                        <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', padding: 0 }}>
                          <EyeIcon open={showPassword} />
                        </button>
                      </div>
                      {fieldErrors.signupPassword && <span className="sl-field-err">{fieldErrors.signupPassword}</span>}
                      <PasswordStrength password={signupPassword} />
                    </div>

                    <div style={{ marginBottom: 24 }} className="sl-fade-5">
                      <Checkbox
                        checked={agreedToTerms}
                        onChange={setAgreedToTerms}
                        label={<>By creating an account you agree to our{' '}<a href="#" onClick={e => e.stopPropagation()} style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>Terms</a>{' '}and{' '}<a href="#" onClick={e => e.stopPropagation()} style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a></>}
                      />
                    </div>

                    <button className="sl-btn-primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <><Spinner /> Creating account…</> : <>Sign up →</>}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: '#8a8784' }}>
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchForm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', fontWeight: 600, fontSize: 13.5, fontFamily: 'Outfit, sans-serif', padding: 0 }}>
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
