import { useState, useEffect, useRef, useCallback } from "react";
import {
  apiRegister, apiLogin, apiGetMe, apiUpdateMe, apiUploadPhoto,
  apiGetDiscover, apiChoose, apiGetNotifications, apiRespond, apiGetMatches,
} from "./api.js";
import { requestPushPermission } from "./push.js";

// ── Styles ────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0e0c0a; color: #f0ebe3; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  .app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden; }
  .bg-grain { position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; opacity: 0.6; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeInUp 0.4s ease forwards; }
  .onboarding { flex: 1; display: flex; flex-direction: column; padding: 0 24px 40px; position: relative; z-index: 1; }
  .ob-logo-wrap { padding: 40px 0 28px; text-align: center; }
  .ob-logo { font-family: 'Playfair Display', serif; font-size: 2.2rem; letter-spacing: -0.02em; }
  .ob-logo span { color: #c9a96e; font-style: italic; }
  .ob-tagline { font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: #4a4540; margin-top: 4px; }
  .ob-progress { display: flex; gap: 6px; margin-bottom: 28px; }
  .ob-pip { height: 3px; flex: 1; border-radius: 2px; background: #1e1b18; transition: background 0.3s; }
  .ob-pip.done { background: #c9a96e; }
  .ob-pip.active { background: #c9a96e80; }
  .ob-step { flex: 1; display: flex; flex-direction: column; animation: fadeInUp 0.35s ease forwards; }
  .ob-step-num { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: #4a4540; margin-bottom: 10px; }
  .ob-step-title { font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 400; line-height: 1.2; margin-bottom: 6px; }
  .ob-step-title em { color: #c9a96e; font-style: italic; }
  .ob-step-sub { font-size: 0.78rem; color: #6b6258; font-weight: 300; margin-bottom: 28px; line-height: 1.6; }
  .avatar-upload-area { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 20px; }
  .avatar-upload-circle { width: 120px; height: 120px; border-radius: 50%; background: #161311; border: 2px dashed #2a2520; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; transition: border-color 0.2s; position: relative; }
  .avatar-upload-circle:hover { border-color: #c9a96e60; }
  .avatar-upload-circle img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .avatar-upload-inner { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #4a4540; }
  .avatar-upload-inner .upload-icon { font-size: 1.6rem; }
  .avatar-upload-inner span { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .avatar-overlay { position: absolute; inset: 0; background: #0e0c0a80; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; border-radius: 50%; font-size: 1.4rem; }
  .avatar-upload-circle:hover .avatar-overlay { opacity: 1; }
  .avatar-hint { font-size: 0.72rem; color: #4a4540; text-align: center; }
  .ob-label { display: block; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6258; margin-bottom: 8px; font-weight: 500; }
  .ob-input, .ob-textarea { width: 100%; background: #161311; border: 1px solid #2a2520; border-radius: 10px; padding: 14px 16px; color: #f0ebe3; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 300; outline: none; transition: border-color 0.2s; resize: none; margin-bottom: 20px; }
  .ob-input:focus, .ob-textarea:focus { border-color: #c9a96e60; }
  .char-count { text-align: right; font-size: 0.68rem; color: #4a4540; margin-top: -16px; margin-bottom: 20px; }
  .city-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .city-opt { background: #161311; border: 1px solid #2a2520; border-radius: 10px; padding: 14px 12px; cursor: pointer; transition: all 0.2s; }
  .city-opt:hover { border-color: #3a3028; }
  .city-opt.selected { border-color: #c9a96e; background: #1a1610; }
  .city-name { font-size: 0.88rem; font-weight: 500; margin-bottom: 2px; }
  .city-vibe { font-size: 0.68rem; color: #6b6258; font-weight: 300; }
  .gender-row { display: flex; gap: 10px; margin-bottom: 20px; }
  .gender-opt { flex: 1; background: #161311; border: 1px solid #2a2520; border-radius: 10px; padding: 16px 12px; cursor: pointer; transition: all 0.2s; text-align: center; }
  .gender-opt:hover { border-color: #3a3028; }
  .gender-opt.selected { border-color: #c9a96e; background: #1a1610; }
  .gender-opt .g-icon { font-size: 1.5rem; display: block; margin-bottom: 6px; }
  .gender-opt .g-label { font-size: 0.82rem; font-weight: 500; display: block; margin-bottom: 2px; }
  .gender-opt .g-sub { font-size: 0.68rem; color: #6b6258; font-weight: 300; }
  .range-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .range-row .ob-input { margin-bottom: 0; flex: 1; }
  .range-sep { color: #4a4540; font-size: 0.8rem; flex-shrink: 0; }
  .contact-type-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .contact-type-opt { background: #161311; border: 1px solid #2a2520; border-radius: 10px; padding: 12px 8px; cursor: pointer; transition: all 0.2s; text-align: center; }
  .contact-type-opt:hover { border-color: #3a3028; }
  .contact-type-opt.selected { border-color: #c9a96e; background: #1a1610; }
  .contact-type-icon { font-size: 1.3rem; display: block; margin-bottom: 4px; }
  .contact-type-label { font-size: 0.68rem; color: #9a8f84; }
  .ob-nav { display: flex; gap: 10px; margin-top: auto; padding-top: 24px; }
  .ob-btn-primary { flex: 1; padding: 16px; background: #c9a96e; color: #0e0c0a; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
  .ob-btn-primary:hover:not(:disabled) { background: #d4b87a; }
  .ob-btn-primary:disabled { background: #2a2520; color: #4a4540; cursor: not-allowed; }
  .ob-btn-back { padding: 16px 20px; background: none; color: #6b6258; border: 1px solid #2a2520; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; }
  .ob-btn-back:hover { border-color: #3a3028; color: #9a8f84; }
  .review-card { background: #161311; border: 1px solid #211e1a; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 20px; }
  .review-avatar { width: 90px; height: 90px; border-radius: 50%; margin: 0 auto 14px; overflow: hidden; border: 2px solid #c9a96e50; }
  .review-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .review-avatar-placeholder { width: 90px; height: 90px; border-radius: 50%; background: #2a2520; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 14px; border: 2px solid #c9a96e50; }
  .review-name { font-family: 'Playfair Display', serif; font-size: 1.3rem; margin-bottom: 2px; }
  .review-meta { font-size: 0.72rem; color: #6b6258; margin-bottom: 12px; font-weight: 300; }
  .review-desc { font-size: 0.8rem; color: #9a8f84; line-height: 1.6; font-weight: 300; margin-bottom: 14px; }
  .review-contact { display: inline-flex; align-items: center; gap: 6px; background: #1a1714; border: 1px solid #2a2520; border-radius: 20px; padding: 5px 12px; font-size: 0.72rem; color: #c9a96e; }
  .header { padding: 28px 24px 0; position: relative; z-index: 1; }
  .header-top { display: flex; align-items: center; justify-content: space-between; }
  .logo { font-family: 'Playfair Display', serif; font-size: 1.6rem; letter-spacing: -0.02em; color: #f0ebe3; }
  .logo span { color: #c9a96e; font-style: italic; }
  .subheading { font-size: 0.72rem; font-weight: 300; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6258; margin-top: 2px; }
  .my-avatar-btn { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; border: 2px solid #2a2520; cursor: pointer; background: #2a2520; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: border-color 0.2s; flex-shrink: 0; }
  .my-avatar-btn:hover { border-color: #c9a96e60; }
  .my-avatar-btn img { width: 100%; height: 100%; object-fit: cover; }
  .nav { display: flex; gap: 8px; margin-top: 20px; border-bottom: 1px solid #1e1b18; }
  .nav-btn { background: none; border: none; color: #6b6258; font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; padding: 10px 16px; cursor: pointer; position: relative; transition: color 0.2s; }
  .nav-btn.active { color: #c9a96e; }
  .nav-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #c9a96e; }
  .badge { background: #c9a96e; color: #0e0c0a; border-radius: 999px; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; margin-left: 5px; vertical-align: middle; }
  .content { flex: 1; padding: 24px 20px; position: relative; z-index: 1; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 400; margin-bottom: 4px; }
  .section-sub { font-size: 0.75rem; color: #6b6258; margin-bottom: 24px; font-weight: 300; }
  .countdown { display: inline-block; background: #1a1714; border: 1px solid #2a2520; border-radius: 6px; padding: 3px 10px; font-size: 0.72rem; color: #c9a96e; letter-spacing: 0.05em; margin-bottom: 22px; font-variant-numeric: tabular-nums; }
  .profiles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .profile-card { background: #161311; border: 1px solid #211e1a; border-radius: 16px; padding: 20px 14px 16px; text-align: center; cursor: pointer; transition: all 0.25s; position: relative; overflow: hidden; }
  .profile-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at top, #c9a96e08 0%, transparent 60%); opacity: 0; transition: opacity 0.3s; }
  .profile-card:hover::before { opacity: 1; }
  .profile-card:hover { border-color: #3a3028; transform: translateY(-2px); }
  .profile-card.selected { border-color: #c9a96e; background: #1a1610; }
  .profile-card.selected::before { opacity: 1; }
  .avatar-wrap { width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 12px; position: relative; }
  .avatar-wrap::after { content: ''; position: absolute; inset: -3px; border-radius: 50%; border: 2px solid transparent; transition: border-color 0.2s; }
  .profile-card.selected .avatar-wrap::after { border-color: #c9a96e; }
  .avatar-placeholder { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; background: #2a2520; }
  .avatar-img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
  .profile-name { font-family: 'Playfair Display', serif; font-size: 1rem; margin-bottom: 4px; }
  .profile-age { font-size: 0.7rem; color: #6b6258; margin-bottom: 8px; font-weight: 300; }
  .profile-desc { font-size: 0.72rem; color: #9a8f84; line-height: 1.55; font-weight: 300; }
  .choose-btn { width: 100%; margin-top: 28px; padding: 16px; background: #c9a96e; color: #0e0c0a; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .choose-btn:hover:not(:disabled) { background: #d4b87a; }
  .choose-btn:disabled { background: #2a2520; color: #4a4540; cursor: not-allowed; }
  .already-chosen { text-align: center; padding: 40px 20px; }
  .already-chosen .big-icon { font-size: 3rem; margin-bottom: 12px; }
  .already-chosen p { color: #6b6258; font-size: 0.85rem; line-height: 1.6; }
  .already-chosen strong { color: #c9a96e; font-family: 'Playfair Display', serif; font-style: italic; }
  .notif-list { display: flex; flex-direction: column; gap: 12px; }
  .notif-card { background: #161311; border: 1px solid #211e1a; border-radius: 14px; padding: 18px 16px; display: flex; align-items: flex-start; gap: 14px; }
  .notif-card.new { border-color: #c9a96e40; }
  .notif-avatar { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; background: #2a2520; flex-shrink: 0; overflow: hidden; }
  .notif-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .notif-body { flex: 1; }
  .notif-text { font-size: 0.82rem; line-height: 1.5; color: #c8bfb5; margin-bottom: 10px; }
  .notif-text strong { color: #f0ebe3; }
  .notif-actions { display: flex; gap: 8px; }
  .btn-match { background: #c9a96e; color: #0e0c0a; border: none; border-radius: 7px; padding: 7px 16px; font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
  .btn-match:hover { background: #d4b87a; }
  .btn-pass { background: #1e1b18; color: #6b6258; border: 1px solid #2a2520; border-radius: 7px; padding: 7px 14px; font-family: 'DM Sans', sans-serif; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
  .btn-pass:hover { border-color: #3a3028; color: #9a8f84; }
  .notif-time { font-size: 0.68rem; color: #4a4540; margin-top: 8px; }
  .match-card { background: #161311; border: 1px solid #c9a96e30; border-radius: 16px; padding: 22px 18px; margin-bottom: 14px; position: relative; overflow: hidden; }
  .match-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c9a96e, transparent); }
  .match-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .match-avatar { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: #2a2520; border: 2px solid #c9a96e50; flex-shrink: 0; overflow: hidden; }
  .match-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .match-info h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; margin-bottom: 2px; }
  .match-info p { font-size: 0.72rem; color: #6b6258; font-weight: 300; }
  .match-label { font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a96e; font-weight: 500; margin-bottom: 10px; }
  .contact-box { background: #1a1714; border: 1px solid #2a2520; border-radius: 10px; padding: 14px 16px; }
  .contact-row { display: flex; align-items: center; gap: 10px; }
  .contact-icon { width: 30px; height: 30px; border-radius: 8px; background: #2a2520; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
  .contact-label { font-size: 0.68rem; color: #6b6258; display: block; }
  .contact-value { font-size: 0.82rem; color: #c9a96e; font-weight: 500; }
  .empty-state { text-align: center; padding: 60px 20px; color: #4a4540; }
  .empty-state .icon { font-size: 2.5rem; margin-bottom: 12px; }
  .empty-state p { font-size: 0.82rem; line-height: 1.7; }
  .matched-banner { background: linear-gradient(135deg, #1a1610 0%, #1e1a10 100%); border: 1px solid #c9a96e50; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 16px; }
  .matched-banner .heart { font-size: 1.8rem; }
  .matched-banner h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; margin: 6px 0 2px; }
  .matched-banner p { font-size: 0.75rem; color: #9a8f84; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .profile-panel { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; background: #0e0c0a; max-width: 480px; margin: 0 auto; animation: slideUp 0.3s ease forwards; overflow-y: auto; }
  .profile-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 28px 24px 20px; border-bottom: 1px solid #1e1b18; position: sticky; top: 0; background: #0e0c0a; z-index: 1; }
  .panel-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; }
  .panel-close { background: #161311; border: 1px solid #2a2520; color: #f0ebe3; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; transition: border-color 0.2s; }
  .panel-close:hover { border-color: #3a3028; }
  .profile-panel-content { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .panel-save-btn { width: 100%; padding: 16px; background: #c9a96e; color: #0e0c0a; border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; margin-top: 4px; }
  .panel-save-btn:hover { background: #d4b87a; }
  .error-msg { background: #2a1010; border: 1px solid #5a2020; border-radius: 8px; padding: 10px 14px; font-size: 0.8rem; color: #f08080; margin-bottom: 16px; }
  .loading-screen { display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #4a4540; flex-direction: column; gap: 12px; }
  .loading-dot { width: 6px; height: 6px; border-radius: 50%; background: #c9a96e; animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
  .login-toggle { text-align: center; font-size: 0.78rem; color: #6b6258; margin-top: 16px; }
  .login-toggle button { background: none; border: none; color: #c9a96e; cursor: pointer; font-size: 0.78rem; text-decoration: underline; padding: 0; }
`;

const CITIES = [
  { name: "New York", vibe: "The city that never sleeps" },
  { name: "Los Angeles", vibe: "Sun, smog & soul" },
  { name: "Chicago", vibe: "Windy city warmth" },
  { name: "London", vibe: "Fog & wonder" },
  { name: "Paris", vibe: "Romance in every alley" },
  { name: "Tokyo", vibe: "Neon & quiet beauty" },
  { name: "Berlin", vibe: "Art, bass & history" },
  { name: "Other", vibe: "Somewhere wonderful" },
];

const CONTACT_TYPES = [
  { type: "Instagram", icon: "📸" },
  { type: "Email", icon: "✉️" },
  { type: "Discord", icon: "🎮" },
  { type: "WhatsApp", icon: "💬" },
  { type: "Telegram", icon: "✈️" },
  { type: "Phone", icon: "📱" },
];

function getTimeUntilNext2PM() {
  const now = new Date(), next = new Date();
  next.setHours(14, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  const diff = next - now;
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const API_BASE = import.meta.env.VITE_API_URL || '';
function photoUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

// ── Shared UI ────────────────────────────────────────────────

function AvatarUpload({ photo, onChange }) {
  const fileRef = useRef();
  return (
    <div className="avatar-upload-area">
      <div className="avatar-upload-circle" onClick={() => fileRef.current.click()}>
        {photo
          ? <><img src={photo} alt="you" /><div className="avatar-overlay">✏️</div></>
          : <div className="avatar-upload-inner"><span className="upload-icon">📷</span><span>Upload</span></div>}
      </div>
      <div className="avatar-hint">{photo ? "Tap to change" : "JPG or PNG"}</div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
    </div>
  );
}

function GenderPicker({ label, value, onChange }) {
  return (
    <div>
      {label && <label className="ob-label">{label}</label>}
      <div className="gender-row">
        {[{ val: "m", icon: "♂", label: "Man" }, { val: "f", icon: "♀", label: "Woman" }].map(o => (
          <div key={o.val} className={`gender-opt ${value === o.val ? 'selected' : ''}`} onClick={() => onChange(o.val)}>
            <span className="g-icon">{o.icon}</span>
            <span className="g-label">{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CityPicker({ value, onChange }) {
  return (
    <div className="city-grid">
      {CITIES.map(c => (
        <div key={c.name} className={`city-opt ${value === c.name ? 'selected' : ''}`} onClick={() => onChange(c.name)}>
          <div className="city-name">{c.name}</div>
          <div className="city-vibe">{c.vibe}</div>
        </div>
      ))}
    </div>
  );
}

function ContactTypePicker({ value, onChange }) {
  return (
    <div className="contact-type-grid">
      {CONTACT_TYPES.map(ct => (
        <div key={ct.type} className={`contact-type-opt ${value === ct.type ? 'selected' : ''}`} onClick={() => onChange(ct.type)}>
          <span className="contact-type-icon">{ct.icon}</span>
          <span className="contact-type-label">{ct.type}</span>
        </div>
      ))}
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(''); setLoading(true);
    try {
      const { token, user } = await apiLogin(email, password);
      localStorage.setItem('tw_token', token);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="ob-logo-wrap">
        <div className="ob-logo">twi<span>light</span></div>
        <div className="ob-tagline">welcome back</div>
      </div>
      <div className="ob-step">
        <div className="ob-step-title">Sign <em>in</em></div>
        <div className="ob-step-sub">Good to have you back.</div>
        {error && <div className="error-msg">{error}</div>}
        <label className="ob-label">Email</label>
        <input className="ob-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="ob-label">Password</label>
        <input className="ob-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <div className="ob-nav">
          <button className="ob-btn-primary" disabled={!email || !password || loading} onClick={handleSubmit}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────

function Onboarding({ onComplete, onSwitchToLogin }) {
  const [step, setStep] = useState(0);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [seeking, setSeeking] = useState('');
  const [ageMin, setAgeMin] = useState('22');
  const [ageMax, setAgeMax] = useState('35');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [contactType, setContactType] = useState('Instagram');
  const [contactValue, setContactValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const TOTAL = 7;

  function handlePhotoChange(e) {
    const file = e.target.files[0]; if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function canAdvance() {
    if (step === 0) return true;
    if (step === 1) return email.includes('@') && password.length >= 8;
    if (step === 2) return name.trim().length >= 2 && parseInt(age) >= 18 && parseInt(age) <= 99;
    if (step === 3) return !!gender && !!seeking && parseInt(ageMin) >= 18 && parseInt(ageMax) <= 99 && parseInt(ageMin) <= parseInt(ageMax);
    if (step === 4) return bio.trim().length >= 20;
    if (step === 5) return !!city;
    if (step === 6) return contactValue.trim().length >= 2;
    return true;
  }

  async function finish() {
    setError(''); setLoading(true);
    try {
      const ci = CONTACT_TYPES.find(c => c.type === contactType);
      const { token, user } = await apiRegister({
        email, password, name: name.trim(), age: parseInt(age),
        gender, seeking, ageMin: parseInt(ageMin), ageMax: parseInt(ageMax),
        bio: bio.trim(), city,
        contactType, contactIcon: ci?.icon || '💬', contactValue: contactValue.trim(),
      });
      localStorage.setItem('tw_token', token);

      // Upload photo if provided
      if (photoFile) {
        try {
          const { photoUrl: url } = await apiUploadPhoto(photoFile);
          user.photoUrl = url;
        } catch { /* photo upload failure is non-blocking */ }
      }

      onComplete(user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const pips = Array.from({ length: TOTAL }, (_, i) => (
    <div key={i} className={`ob-pip ${i < step ? 'done' : i === step ? 'active' : ''}`} />
  ));

  return (
    <div className="app">
      <div className="bg-grain" />
      <div className="onboarding">
        <div className="ob-logo-wrap">
          <div className="ob-logo">twi<span>light</span></div>
          <div className="ob-tagline">daily matchmaking</div>
        </div>
        <div className="ob-progress">{pips}</div>

        {step === 0 && (
          <div className="ob-step" key="s0">
            <div className="ob-step-num">Step 1 of {TOTAL}</div>
            <div className="ob-step-title">Your <em>face</em> tells a story</div>
            <div className="ob-step-sub">Upload a photo that feels like you.</div>
            <AvatarUpload photo={photoPreview} onChange={handlePhotoChange} />
            <div className="ob-nav">
              <button className="ob-btn-primary" onClick={() => setStep(1)}>{photoPreview ? 'Looks great →' : 'Skip for now →'}</button>
            </div>
            <div className="login-toggle">Already have an account? <button onClick={onSwitchToLogin}>Sign in</button></div>
          </div>
        )}

        {step === 1 && (
          <div className="ob-step" key="s1">
            <div className="ob-step-num">Step 2 of {TOTAL}</div>
            <div className="ob-step-title">Create your <em>account</em></div>
            <div className="ob-step-sub">Your email is private and never shown to others.</div>
            {error && <div className="error-msg">{error}</div>}
            <label className="ob-label">Email</label>
            <input className="ob-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            <label className="ob-label">Password (min 8 characters)</label>
            <input className="ob-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            <div className="ob-nav">
              <button className="ob-btn-back" onClick={() => setStep(0)}>←</button>
              <button className="ob-btn-primary" disabled={!canAdvance()} onClick={() => setStep(2)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ob-step" key="s2">
            <div className="ob-step-num">Step 3 of {TOTAL}</div>
            <div className="ob-step-title">Nice to <em>meet</em> you</div>
            <div className="ob-step-sub">What should people call you?</div>
            <label className="ob-label">First name</label>
            <input className="ob-input" placeholder="e.g. Margot" value={name} onChange={e => setName(e.target.value)} maxLength={30} />
            <label className="ob-label">Age</label>
            <input className="ob-input" type="number" placeholder="e.g. 28" value={age} onChange={e => setAge(e.target.value)} min={18} max={99} />
            <div className="ob-nav">
              <button className="ob-btn-back" onClick={() => setStep(1)}>←</button>
              <button className="ob-btn-primary" disabled={!canAdvance()} onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ob-step" key="s3">
            <div className="ob-step-num">Step 4 of {TOTAL}</div>
            <div className="ob-step-title">Who are you, who are you <em>seeking?</em></div>
            <div className="ob-step-sub">This shapes the profiles you'll see each day.</div>
            <GenderPicker label="I am a" value={gender} onChange={setGender} />
            <GenderPicker label="Looking for" value={seeking} onChange={setSeeking} />
            <label className="ob-label">Age range I'm open to</label>
            <div className="range-row">
              <input className="ob-input" type="number" placeholder="Min" value={ageMin} onChange={e => setAgeMin(e.target.value)} min={18} max={99} />
              <span className="range-sep">to</span>
              <input className="ob-input" type="number" placeholder="Max" value={ageMax} onChange={e => setAgeMax(e.target.value)} min={18} max={99} />
            </div>
            <div className="ob-nav">
              <button className="ob-btn-back" onClick={() => setStep(2)}>←</button>
              <button className="ob-btn-primary" disabled={!canAdvance()} onClick={() => setStep(4)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="ob-step" key="s4">
            <div className="ob-step-num">Step 5 of {TOTAL}</div>
            <div className="ob-step-title">Your <em>story</em> in a paragraph</div>
            <div className="ob-step-sub">Not your dating resume. More like the opening of a good short story.</div>
            <label className="ob-label">About you</label>
            <textarea className="ob-textarea" rows={5} placeholder="e.g. I make ceramics by hand..." value={bio} onChange={e => setBio(e.target.value)} maxLength={280} />
            <div className="char-count">{bio.length}/280</div>
            <div className="ob-nav">
              <button className="ob-btn-back" onClick={() => setStep(3)}>←</button>
              <button className="ob-btn-primary" disabled={!canAdvance()} onClick={() => setStep(5)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="ob-step" key="s5">
            <div className="ob-step-num">Step 6 of {TOTAL}</div>
            <div className="ob-step-title">Where do you <em>roam?</em></div>
            <div className="ob-step-sub">You'll be matched with people in the same city.</div>
            <CityPicker value={city} onChange={setCity} />
            <div className="ob-nav">
              <button className="ob-btn-back" onClick={() => setStep(4)}>←</button>
              <button className="ob-btn-primary" disabled={!canAdvance()} onClick={() => setStep(6)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="ob-step" key="s6">
            <div className="ob-step-num">Step 7 of {TOTAL}</div>
            <div className="ob-step-title">How should <em>matches</em> reach you?</div>
            <div className="ob-step-sub">Revealed only when you both choose each other.</div>
            <label className="ob-label">Platform</label>
            <ContactTypePicker value={contactType} onChange={setContactType} />
            <label className="ob-label">Your handle or address</label>
            <input className="ob-input" placeholder={contactType === "Email" ? "you@example.com" : `@your${contactType.toLowerCase()}`} value={contactValue} onChange={e => setContactValue(e.target.value)} />
            <div className="ob-nav">
              <button className="ob-btn-back" onClick={() => setStep(5)}>←</button>
              <button className="ob-btn-primary" disabled={!canAdvance()} onClick={() => setStep(7)}>Review →</button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="ob-step" key="s7">
            <div className="ob-step-num">Almost there</div>
            <div className="ob-step-title">Looking <em>good,</em> {name}</div>
            <div className="ob-step-sub">Here's how others will see you. Editable any time.</div>
            {error && <div className="error-msg">{error}</div>}
            <div className="review-card">
              {photoPreview ? <div className="review-avatar"><img src={photoPreview} alt="you" /></div> : <div className="review-avatar-placeholder">🌟</div>}
              <div className="review-name">{name}</div>
              <div className="review-meta">{age} · {city} · {gender === 'm' ? 'Man' : 'Woman'} · Seeking {seeking === 'm' ? 'men' : 'women'} {ageMin}–{ageMax}</div>
              <div className="review-desc">{bio}</div>
              <div className="review-contact">{CONTACT_TYPES.find(c => c.type === contactType)?.icon} {contactType}: hidden until matched</div>
            </div>
            <div className="ob-nav">
              <button className="ob-btn-back" onClick={() => setStep(6)}>←</button>
              <button className="ob-btn-primary" disabled={loading} onClick={finish}>
                {loading ? 'Creating account…' : 'Enter twilight ✦'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Profile Panel ────────────────────────────────────────

function EditProfilePanel({ user, onSave, onClose }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(photoUrl(user.photoUrl));
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(String(user.age));
  const [gender, setGender] = useState(user.gender || '');
  const [seeking, setSeeking] = useState(user.seeking || '');
  const [ageMin, setAgeMin] = useState(String(user.ageMin || 22));
  const [ageMax, setAgeMax] = useState(String(user.ageMax || 35));
  const [bio, setBio] = useState(user.bio || '');
  const [city, setCity] = useState(user.city);
  const [contactType, setContactType] = useState(user.contact.type);
  const [contactValue, setContactValue] = useState(user.contact.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handlePhotoChange(e) {
    const file = e.target.files[0]; if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true); setError('');
    try {
      const ci = CONTACT_TYPES.find(c => c.type === contactType);
      let updated = await apiUpdateMe({
        name: name.trim(), age: parseInt(age), gender, seeking,
        ageMin: parseInt(ageMin), ageMax: parseInt(ageMax),
        bio: bio.trim(), city,
        contactType, contactIcon: ci?.icon || '💬', contactValue: contactValue.trim(),
      });

      if (photoFile) {
        const { photoUrl: url } = await apiUploadPhoto(photoFile);
        updated = { ...updated, photoUrl: url };
      }

      onSave(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-panel">
      <div className="bg-grain" />
      <div className="profile-panel-header">
        <div className="panel-title">Edit Profile</div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>
      <div className="profile-panel-content">
        {error && <div className="error-msg">{error}</div>}
        <div><label className="ob-label">Photo</label><AvatarUpload photo={photoPreview} onChange={handlePhotoChange} /></div>
        <div><label className="ob-label">Name</label><input className="ob-input" value={name} onChange={e => setName(e.target.value)} maxLength={30} /></div>
        <div><label className="ob-label">Age</label><input className="ob-input" type="number" value={age} onChange={e => setAge(e.target.value)} min={18} max={99} /></div>
        <GenderPicker label="I am a" value={gender} onChange={setGender} />
        <GenderPicker label="Looking for" value={seeking} onChange={setSeeking} />
        <div>
          <label className="ob-label">Age range</label>
          <div className="range-row">
            <input className="ob-input" type="number" value={ageMin} onChange={e => setAgeMin(e.target.value)} min={18} max={99} />
            <span className="range-sep">to</span>
            <input className="ob-input" type="number" value={ageMax} onChange={e => setAgeMax(e.target.value)} min={18} max={99} />
          </div>
        </div>
        <div>
          <label className="ob-label">Bio</label>
          <textarea className="ob-textarea" rows={5} value={bio} onChange={e => setBio(e.target.value)} maxLength={280} />
          <div className="char-count">{bio.length}/280</div>
        </div>
        <div><label className="ob-label">City</label><CityPicker value={city} onChange={setCity} /></div>
        <div>
          <label className="ob-label">Contact platform</label>
          <ContactTypePicker value={contactType} onChange={setContactType} />
          <label className="ob-label" style={{ marginTop: 4 }}>Handle or address</label>
          <input className="ob-input" value={contactValue} onChange={e => setContactValue(e.target.value)} />
        </div>
        <button className="panel-save-btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────

function MainApp({ user: initialUser, setUser }) {
  const [user, setLocalUser] = useState(initialUser);
  const [tab, setTab] = useState('discover');
  const [countdown, setCountdown] = useState(getTimeUntilNext2PM());
  const [profiles, setProfiles] = useState([]);
  const [chosenId, setChosenId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [choosing, setChoosing] = useState(false);

  function updateUser(u) { setLocalUser(u); setUser(u); }

  const loadDiscover = useCallback(async () => {
    setLoadingDiscover(true);
    try {
      const data = await apiGetDiscover();
      setProfiles(data.profiles || []);
      setChosenId(data.chosenId || null);
    } catch (err) { console.error(err); }
    finally { setLoadingDiscover(false); }
  }, []);

  const loadNotifications = useCallback(async () => {
    try { setNotifications(await apiGetNotifications()); } catch { }
  }, []);

  const loadMatches = useCallback(async () => {
    try { setMatches(await apiGetMatches()); } catch { }
  }, []);

  useEffect(() => {
    loadDiscover();
    loadNotifications();
    loadMatches();
    // Ask for push permission after a short delay
    setTimeout(() => requestPushPermission(), 3000);
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    const t = setInterval(loadNotifications, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(getTimeUntilNext2PM()), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleChoose() {
    if (!selected || choosing) return;
    setChoosing(true);
    try {
      const { matched } = await apiChoose(selected.id);
      setChosenId(selected.id);
      if (matched) await loadMatches();
    } catch (err) { alert(err.message); }
    finally { setChoosing(false); }
  }

  async function handleMatch(notifFromId) {
    try {
      await apiRespond(notifFromId, true);
      await loadNotifications();
      await loadMatches();
      setTab('matches');
    } catch (err) { alert(err.message); }
  }

  async function handlePass(notifFromId) {
    await apiRespond(notifFromId, false);
    setNotifications(prev => prev.map(n => n.from.id === notifFromId ? { ...n, pending: false, passed: true } : n));
  }

  const pendingCount = notifications.filter(n => n.pending).length;
  const chosenProfile = profiles.find(p => p.id === chosenId);

  return (
    <>
      <div className="app">
        <div className="bg-grain" />
        {editOpen && <EditProfilePanel user={user} onSave={u => { updateUser(u); setEditOpen(false); }} onClose={() => setEditOpen(false)} />}

        <div className="header">
          <div className="header-top">
            <div>
              <div className="logo">twi<span>light</span></div>
              <div className="subheading">daily matchmaking · {user.city}</div>
            </div>
            <button className="my-avatar-btn" onClick={() => setEditOpen(true)}>
              {user.photoUrl ? <img src={photoUrl(user.photoUrl)} alt="me" /> : '🌟'}
            </button>
          </div>
          <nav className="nav">
            <button className={`nav-btn ${tab === 'discover' ? 'active' : ''}`} onClick={() => setTab('discover')}>Discover</button>
            <button className={`nav-btn ${tab === 'notifications' ? 'active' : ''}`} onClick={() => { setTab('notifications'); loadNotifications(); }}>
              Chosen {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
            </button>
            <button className={`nav-btn ${tab === 'matches' ? 'active' : ''}`} onClick={() => { setTab('matches'); loadMatches(); }}>
              Matches {matches.length > 0 && <span className="badge">{matches.length}</span>}
            </button>
          </nav>
        </div>

        <div className="content">
          {tab === 'discover' && (
            <div className="fade-in">
              <div className="section-title">Today's Four</div>
              <div className="section-sub">Choose one. They'll be notified.</div>
              <div className="countdown">🕑 Refreshes in {countdown}</div>

              {loadingDiscover ? (
                <div className="empty-state"><div className="loading-dot" /></div>
              ) : chosenId ? (
                <div className="already-chosen fade-in">
                  <div className="big-icon">✨</div>
                  <p>You chose <strong>{chosenProfile?.name || 'someone'}</strong> today.<br />They've been notified. Check back tomorrow.</p>
                </div>
              ) : profiles.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🔭</div>
                  <p>No profiles match your preferences in {user.city} right now.<br />Try widening your age range in profile settings.</p>
                </div>
              ) : (
                <>
                  <div className="profiles-grid">
                    {profiles.map(p => (
                      <div key={p.id} className={`profile-card ${selected?.id === p.id ? 'selected' : ''}`} onClick={() => setSelected(p)}>
                        <div className="avatar-wrap">
                          {p.photoUrl
                            ? <img className="avatar-img" src={photoUrl(p.photoUrl)} alt={p.name} />
                            : <div className="avatar-placeholder">🌟</div>}
                        </div>
                        <div className="profile-name">{p.name}</div>
                        <div className="profile-age">{p.age} · {p.city}</div>
                        <div className="profile-desc">{p.bio}</div>
                      </div>
                    ))}
                  </div>
                  <button className="choose-btn" disabled={!selected || choosing} onClick={handleChoose}>
                    {choosing ? 'Choosing…' : selected ? `Choose ${selected.name}` : 'Select Someone'}
                  </button>
                </>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="fade-in">
              <div className="section-title">You Were Chosen</div>
              <div className="section-sub">Match to reveal their contact.</div>
              <div className="notif-list">
                {notifications.length === 0 && <div className="empty-state"><div className="icon">💌</div><p>No one has chosen you yet.</p></div>}
                {notifications.map(n => (
                  <div key={n.id} className={`notif-card ${n.pending ? 'new' : ''}`}>
                    <div className="notif-avatar">
                      {n.from.photoUrl ? <img src={photoUrl(n.from.photoUrl)} alt={n.from.name} /> : '🌟'}
                    </div>
                    <div className="notif-body">
                      <div className="notif-text">
                        <strong>{n.from.name}</strong> chose you today.
                        {n.matched && ' You matched! 🎉'}{n.passed && ' You passed.'}
                      </div>
                      {n.pending && (
                        <div className="notif-actions">
                          <button className="btn-match" onClick={() => handleMatch(n.from.id)}>Match</button>
                          <button className="btn-pass" onClick={() => handlePass(n.from.id)}>Pass</button>
                        </div>
                      )}
                      <div className="notif-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'matches' && (
            <div className="fade-in">
              <div className="section-title">Matches</div>
              <div className="section-sub">Their contact details are revealed below.</div>
              {matches.length === 0 && <div className="empty-state"><div className="icon">🕯️</div><p>No matches yet.</p></div>}
              {matches.map(m => (
                <div key={m.id} className="match-card fade-in">
                  <div className="matched-banner">
                    <div className="heart">💛</div>
                    <h3>You matched with {m.partner.name}</h3>
                    <p>You both chose each other. Say hello.</p>
                  </div>
                  <div className="match-header">
                    <div className="match-avatar">
                      {m.partner.photoUrl ? <img src={photoUrl(m.partner.photoUrl)} alt={m.partner.name} /> : '🌟'}
                    </div>
                    <div className="match-info">
                      <h3>{m.partner.name}</h3>
                      <p>{m.partner.age} · {m.partner.city}</p>
                      <p style={{ marginTop: 4, fontSize: '0.75rem', color: '#9a8f84' }}>{m.partner.bio?.slice(0, 60)}…</p>
                    </div>
                  </div>
                  <div className="match-label">Contact Info</div>
                  <div className="contact-box">
                    <div className="contact-row">
                      <div className="contact-icon">{m.partner.contact.icon}</div>
                      <div>
                        <span className="contact-label">{m.partner.contact.type}</span>
                        <span className="contact-value">{m.partner.contact.value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('loading'); // loading | onboarding | login | app

  useEffect(() => {
    const token = localStorage.getItem('tw_token');
    if (!token) { setScreen('onboarding'); return; }
    apiGetMe()
      .then(u => { setUser(u); setScreen('app'); })
      .catch(() => { localStorage.removeItem('tw_token'); setScreen('onboarding'); });
  }, []);

  if (screen === 'loading') {
    return (
      <>
        <style>{STYLE}</style>
        <div className="loading-screen">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem' }}>twi<span style={{ color: '#c9a96e', fontStyle: 'italic' }}>light</span></div>
          <div className="loading-dot" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLE}</style>
      {screen === 'onboarding' && (
        <Onboarding
          onComplete={u => { setUser(u); setScreen('app'); }}
          onSwitchToLogin={() => setScreen('login')}
        />
      )}
      {screen === 'login' && (
        <div className="app">
          <div className="bg-grain" />
          <LoginScreen onLogin={u => { setUser(u); setScreen('app'); }} />
          <div className="login-toggle" style={{ padding: '0 24px 32px', position: 'relative', zIndex: 1 }}>
            New here? <button onClick={() => setScreen('onboarding')}>Create account</button>
          </div>
        </div>
      )}
      {screen === 'app' && user && <MainApp user={user} setUser={u => { setUser(u); }} />}
    </>
  );
}
