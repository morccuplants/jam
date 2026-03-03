import { useState, useEffect, useRef, useCallback } from "react";
import {
  apiRegister, apiLogin, apiGetMe, apiUpdateMe, apiUploadPhoto,
  apiGetDiscover, apiChoose, apiGetNotifications, apiRespond, apiGetMatches,
} from "./api.js";
import { requestPushPermission } from "./push.js";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Pixelify+Sans:wght@400;500;600;700&display=swap');

  :root {
    --white: #ffffff;
    --cream: #faf8f2;
    --page: #f3f0e8;
    --ink: #1c1c2e;
    --ink-light: #4a4a6a;
    --ink-faint: #9a9ab0;
    --border: #c8c4b8;
    --border-dk: #8a8680;
    --pink: #f0a0c0;
    --pink-dk: #c87090;
    --purple: #b8a0e0;
    --blue: #a0b8e8;
    --sage: #b0c8b0;
    --peach: #f0c8a8;
    --r: 3px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--page);
    color: var(--ink);
    font-family: 'EB Garamond', Georgia, serif;
    min-height: 100vh;
    font-size: 17px;
    line-height: 1.6;
  }

  .app {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--cream);
    border-left: 2px solid var(--border-dk);
    border-right: 2px solid var(--border-dk);
  }

  @keyframes fadeInUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp   { from { transform:translateY(100%); } to { transform:translateY(0); } }
  @keyframes blink     { 0%,100% { opacity:1; } 50% { opacity:0; } }

  .fade-in { animation: fadeInUp 0.3s ease forwards; }

  /* ── Onboarding ── */
  .ob-progress { display:flex; gap:3px; margin-bottom:28px; }
  .ob-pip { height:5px; flex:1; border-radius:0; background:var(--border); }
  .ob-pip.done { background:var(--pink-dk); }
  .ob-pip.active { background:var(--pink); }

  .onboarding { flex:1; display:flex; flex-direction:column; padding:0 24px 48px; background:var(--cream); }

  .ob-logo-wrap { padding:44px 0 24px; text-align:center; }
  .ob-logo { font-family:'EB Garamond',serif; font-size:2.6rem; font-weight:400; font-style:italic; color:var(--ink); }
  .ob-logo-sub { font-family:'Pixelify Sans',monospace; font-size:.7rem; color:var(--pink-dk); display:block; margin-top:4px; letter-spacing:.12em; }

  .ob-step { flex:1; display:flex; flex-direction:column; animation:fadeInUp .3s ease forwards; }
  .ob-step-num { font-family:'Pixelify Sans',monospace; font-size:.65rem; color:var(--ink-faint); margin-bottom:12px; }
  .ob-step-title { font-family:'EB Garamond',serif; font-size:2rem; font-weight:400; line-height:1.2; margin-bottom:8px; }
  .ob-step-title em { font-style:italic; color:var(--pink-dk); }
  .ob-step-sub { font-size:.95rem; color:var(--ink-light); margin-bottom:24px; line-height:1.7; font-style:italic; }

  .avatar-upload-area { display:flex; flex-direction:column; align-items:center; gap:10px; margin-bottom:24px; }
  .avatar-upload-circle { width:112px; height:112px; border-radius:50%; background:var(--page); border:2px dashed var(--border-dk); display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; transition:border-color .15s; position:relative; }
  .avatar-upload-circle:hover { border-color:var(--pink-dk); }
  .avatar-upload-circle img { width:100%; height:100%; object-fit:cover; }
  .avatar-upload-inner { display:flex; flex-direction:column; align-items:center; gap:6px; color:var(--ink-faint); }
  .avatar-upload-inner .upload-icon { font-size:1.5rem; }
  .avatar-upload-inner span { font-family:'Pixelify Sans',monospace; font-size:.6rem; }
  .avatar-overlay { position:absolute; inset:0; background:rgba(255,255,255,.65); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .15s; border-radius:50%; font-size:1.2rem; }
  .avatar-upload-circle:hover .avatar-overlay { opacity:1; }
  .avatar-hint { font-family:'Pixelify Sans',monospace; font-size:.58rem; color:var(--ink-faint); text-align:center; }

  .ob-label { display:block; font-family:'Pixelify Sans',monospace; font-size:.65rem; color:var(--ink-light); margin-bottom:8px; }
  .ob-input, .ob-textarea { width:100%; background:var(--white); border:2px solid var(--border-dk); border-radius:var(--r); padding:11px 13px; color:var(--ink); font-family:'EB Garamond',serif; font-size:1rem; outline:none; resize:none; margin-bottom:18px; transition:border-color .12s; }
  .ob-input:focus, .ob-textarea:focus { border-color:var(--pink-dk); }
  .char-count { text-align:right; font-family:'Pixelify Sans',monospace; font-size:.58rem; color:var(--ink-faint); margin-top:-14px; margin-bottom:18px; }

  .city-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:18px; }
  .city-opt { background:var(--white); border:2px solid var(--border); border-radius:var(--r); padding:11px 10px; cursor:pointer; transition:border-color .12s,background .12s; }
  .city-opt:hover { border-color:var(--blue); background:#f4f7ff; }
  .city-opt.selected { border-color:var(--pink-dk); background:#fdf0f6; }
  .city-name { font-size:.95rem; font-weight:500; margin-bottom:2px; }
  .city-vibe { font-size:.72rem; color:var(--ink-faint); font-style:italic; }

  .gender-row { display:flex; gap:6px; margin-bottom:18px; }
  .gender-opt { flex:1; background:var(--white); border:2px solid var(--border); border-radius:var(--r); padding:14px 10px; cursor:pointer; transition:border-color .12s,background .12s; text-align:center; }
  .gender-opt:hover { border-color:var(--blue); background:#f4f7ff; }
  .gender-opt.selected { border-color:var(--pink-dk); background:#fdf0f6; }
  .gender-opt .g-icon { font-size:1.5rem; display:block; margin-bottom:6px; }
  .gender-opt .g-label { font-family:'Pixelify Sans',monospace; font-size:.62rem; display:block; }

  .range-row { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
  .range-row .ob-input { margin-bottom:0; flex:1; }
  .range-sep { font-family:'Pixelify Sans',monospace; font-size:.62rem; color:var(--ink-faint); flex-shrink:0; }

  .contact-type-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; margin-bottom:18px; }
  .contact-type-opt { background:var(--white); border:2px solid var(--border); border-radius:var(--r); padding:9px 5px; cursor:pointer; transition:border-color .12s,background .12s; text-align:center; }
  .contact-type-opt:hover { border-color:var(--blue); background:#f4f7ff; }
  .contact-type-opt.selected { border-color:var(--pink-dk); background:#fdf0f6; }
  .contact-type-icon { font-size:1.1rem; display:block; margin-bottom:3px; }
  .contact-type-label { font-family:'Pixelify Sans',monospace; font-size:.55rem; color:var(--ink-light); }

  .ob-nav { display:flex; gap:8px; margin-top:auto; padding-top:24px; }
  .ob-btn-primary { flex:1; padding:13px 18px; background:var(--pink); color:var(--ink); border:2px solid var(--pink-dk); border-radius:var(--r); font-family:'Pixelify Sans',monospace; font-size:.68rem; cursor:pointer; transition:background .12s,border-color .12s; }
  .ob-btn-primary:hover:not(:disabled) { background:var(--pink-dk); color:var(--white); }
  .ob-btn-primary:disabled { background:var(--border); border-color:var(--border-dk); color:var(--ink-faint); cursor:not-allowed; }

  .ob-btn-back { padding:13px 15px; background:var(--page); color:var(--ink-light); border:2px solid var(--border-dk); border-radius:var(--r); font-family:'Pixelify Sans',monospace; font-size:.68rem; cursor:pointer; transition:background .12s; }
  .ob-btn-back:hover { background:var(--border); }

  .review-card { background:var(--white); border:2px solid var(--border-dk); border-radius:var(--r); padding:22px; text-align:center; margin-bottom:18px; border-top:4px solid var(--pink); }
  .review-avatar { width:80px; height:80px; border-radius:50%; margin:6px auto 12px; overflow:hidden; border:2px solid var(--border-dk); }
  .review-avatar img { width:100%; height:100%; object-fit:cover; }
  .review-avatar-placeholder { width:80px; height:80px; border-radius:50%; background:var(--page); display:flex; align-items:center; justify-content:center; font-size:2rem; margin:6px auto 12px; border:2px solid var(--border-dk); }
  .review-name { font-family:'EB Garamond',serif; font-size:1.45rem; font-weight:400; margin-bottom:4px; }
  .review-meta { font-family:'Pixelify Sans',monospace; font-size:.55rem; color:var(--ink-faint); margin-bottom:10px; }
  .review-desc { font-size:.92rem; color:var(--ink-light); line-height:1.7; margin-bottom:12px; font-style:italic; }
  .review-contact { display:inline-flex; align-items:center; gap:5px; border:2px solid var(--border); border-radius:var(--r); padding:3px 10px; font-family:'Pixelify Sans',monospace; font-size:.52rem; color:var(--ink-light); }

  /* ── Header ── */
  .header { border-bottom:2px solid var(--border-dk); }
  .header-band { background:var(--ink-light); padding:13px 18px 10px; display:flex; align-items:center; justify-content:space-between; }
  .logo { font-family:'EB Garamond',serif; font-size:1.6rem; font-weight:400; font-style:italic; color:var(--cream); }
  .logo-sub { font-family:'Pixelify Sans',monospace; font-size:.6rem; color:var(--pink); display:block; margin-top:1px; letter-spacing:.06em; }
  .my-avatar-btn { width:34px; height:34px; border-radius:50%; overflow:hidden; border:2px solid var(--border-dk); cursor:pointer; background:var(--page); display:flex; align-items:center; justify-content:center; font-size:.95rem; transition:border-color .12s; flex-shrink:0; }
  .my-avatar-btn:hover { border-color:var(--pink); }
  .my-avatar-btn img { width:100%; height:100%; object-fit:cover; }

  .nav { display:flex; background:var(--page); border-bottom:2px solid var(--border-dk); padding:0; }
  .nav-btn { background:none; border:none; border-right:1px solid var(--border); color:var(--ink-faint); font-family:'Pixelify Sans',monospace; font-size:.6rem; padding:9px 14px; cursor:pointer; position:relative; transition:color .12s,background .12s; }
  .nav-btn:last-child { border-right:none; }
  .nav-btn.active { color:var(--ink); background:var(--cream); border-bottom:2px solid var(--pink-dk); margin-bottom:-2px; }
  .badge { background:var(--pink-dk); color:var(--white); border-radius:2px; font-family:'Pixelify Sans',monospace; font-size:.45rem; padding:1px 5px; margin-left:4px; vertical-align:middle; }

  /* ── Content ── */
  .content { flex:1; padding:22px 18px; }
  .section-title { font-family:'EB Garamond',serif; font-size:1.5rem; font-weight:400; margin-bottom:2px; }
  .section-sub { font-size:.88rem; color:var(--ink-faint); margin-bottom:16px; font-style:italic; }
  .countdown { display:inline-flex; align-items:center; gap:6px; background:var(--page); border:2px solid var(--border-dk); border-radius:var(--r); padding:5px 11px; font-family:'Pixelify Sans',monospace; font-size:.62rem; color:var(--ink); margin-bottom:16px; }

  .profiles-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .profile-card { background:var(--white); border:2px solid var(--border); border-radius:var(--r); padding:14px 10px 12px; text-align:center; cursor:pointer; transition:border-color .12s,background .12s; position:relative; }
  .profile-card:hover { border-color:var(--blue); background:#f5f7ff; }
  .profile-card.selected { border-color:var(--pink-dk); background:#fdf0f6; border-top:3px solid var(--pink-dk); }
  .profile-card.selected::after { content:'♥'; position:absolute; top:6px; right:8px; font-size:.7rem; color:var(--pink-dk); }
  .avatar-wrap { width:62px; height:62px; border-radius:50%; margin:0 auto 8px; }
  .avatar-placeholder { width:62px; height:62px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; background:var(--page); border:2px solid var(--border); }
  .avatar-img { width:62px; height:62px; border-radius:50%; object-fit:cover; border:2px solid var(--border); }
  .profile-name { font-family:'EB Garamond',serif; font-size:1.05rem; font-weight:500; margin-bottom:2px; }
  .profile-age { font-family:'Pixelify Sans',monospace; font-size:.52rem; color:var(--ink-faint); margin-bottom:5px; }
  .profile-desc { font-size:.78rem; color:var(--ink-light); line-height:1.5; font-style:italic; }

  .choose-btn { width:100%; margin-top:18px; padding:13px; background:var(--pink); color:var(--ink); border:2px solid var(--pink-dk); border-radius:var(--r); font-family:'Pixelify Sans',monospace; font-size:.68rem; cursor:pointer; transition:background .12s; }
  .choose-btn:hover:not(:disabled) { background:var(--pink-dk); color:var(--white); }
  .choose-btn:disabled { background:var(--border); border-color:var(--border-dk); color:var(--ink-faint); cursor:not-allowed; }

  .already-chosen { text-align:center; padding:48px 18px; }
  .already-chosen .big-icon { font-size:2.6rem; margin-bottom:12px; }
  .already-chosen p { font-family:'EB Garamond',serif; color:var(--ink-light); font-size:1rem; line-height:1.7; font-style:italic; }
  .already-chosen strong { color:var(--pink-dk); font-style:normal; }

  .notif-list { display:flex; flex-direction:column; gap:8px; }
  .notif-card { background:var(--white); border:2px solid var(--border); border-radius:var(--r); padding:12px; display:flex; align-items:flex-start; gap:10px; position:relative; }
  .notif-card.new { border-color:var(--pink-dk); border-left:4px solid var(--pink-dk); background:#fdf6fa; }
  .notif-new-label { position:absolute; top:-9px; left:10px; font-family:'Pixelify Sans',monospace; font-size:.5rem; background:var(--pink-dk); color:var(--white); padding:2px 6px; border-radius:2px; }
  .notif-avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.1rem; background:var(--page); border:2px solid var(--border); flex-shrink:0; overflow:hidden; }
  .notif-avatar img { width:100%; height:100%; object-fit:cover; }
  .notif-body { flex:1; }
  .notif-text { font-family:'EB Garamond',serif; font-size:.93rem; line-height:1.5; color:var(--ink); margin-bottom:8px; }
  .notif-text strong { font-weight:600; }
  .notif-actions { display:flex; gap:6px; }
  .btn-match { background:var(--pink); color:var(--ink); border:2px solid var(--pink-dk); border-radius:var(--r); padding:5px 12px; font-family:'Pixelify Sans',monospace; font-size:.55rem; cursor:pointer; transition:background .12s; }
  .btn-match:hover { background:var(--pink-dk); color:var(--white); }
  .btn-pass { background:var(--page); color:var(--ink-light); border:2px solid var(--border-dk); border-radius:var(--r); padding:5px 10px; font-family:'Pixelify Sans',monospace; font-size:.55rem; cursor:pointer; transition:background .12s; }
  .btn-pass:hover { background:var(--border); }
  .notif-time { font-family:'Pixelify Sans',monospace; font-size:.48rem; color:var(--ink-faint); margin-top:7px; }

  .match-card { background:var(--white); border:2px solid var(--border); border-radius:var(--r); padding:16px; margin-bottom:10px; border-top:3px solid var(--sage); }
  .match-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .match-avatar { width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; background:var(--page); border:2px solid var(--border); flex-shrink:0; overflow:hidden; }
  .match-avatar img { width:100%; height:100%; object-fit:cover; }
  .match-info h3 { font-family:'EB Garamond',serif; font-size:1.1rem; font-weight:400; margin-bottom:1px; }
  .match-info p { font-family:'Pixelify Sans',monospace; font-size:.5rem; color:var(--ink-faint); }
  .match-label { font-family:'Pixelify Sans',monospace; font-size:.55rem; letter-spacing:.08em; color:var(--ink-faint); margin-bottom:7px; }
  .contact-box { background:var(--page); border:2px solid var(--border); border-radius:var(--r); padding:11px 13px; }
  .contact-row { display:flex; align-items:center; gap:9px; }
  .contact-icon { width:26px; height:26px; border-radius:2px; background:var(--border); display:flex; align-items:center; justify-content:center; font-size:.8rem; flex-shrink:0; }
  .contact-label { font-family:'Pixelify Sans',monospace; font-size:.48rem; color:var(--ink-faint); display:block; }
  .contact-value { font-family:'EB Garamond',serif; font-size:.95rem; color:var(--ink); font-weight:500; }

  .empty-state { text-align:center; padding:56px 18px; color:var(--ink-faint); }
  .empty-state .icon { font-size:2.2rem; margin-bottom:12px; }
  .empty-state p { font-family:'EB Garamond',serif; font-size:.95rem; line-height:1.7; font-style:italic; }

  .matched-banner { background:var(--page); border:2px solid var(--border); border-radius:var(--r); padding:14px; text-align:center; margin-bottom:12px; border-left:4px solid var(--pink-dk); }
  .matched-banner .heart { font-size:1.4rem; }
  .matched-banner h3 { font-family:'EB Garamond',serif; font-size:1.1rem; font-weight:400; margin:5px 0 2px; }
  .matched-banner p { font-family:'Pixelify Sans',monospace; font-size:.52rem; color:var(--ink-faint); }

  /* ── Profile Panel ── */
  .profile-panel { position:fixed; inset:0; z-index:100; display:flex; flex-direction:column; background:var(--cream); max-width:480px; margin:0 auto; animation:slideUp .25s ease forwards; overflow-y:auto; border-left:2px solid var(--border-dk); border-right:2px solid var(--border-dk); }
  .profile-panel-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:var(--ink); position:sticky; top:0; z-index:1; border-bottom:2px solid var(--border-dk); }
  .panel-title { font-family:'EB Garamond',serif; font-size:1.15rem; font-style:italic; color:var(--cream); }
  .panel-close { background:transparent; border:2px solid var(--border-dk); color:var(--cream); width:30px; height:30px; border-radius:var(--r); display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:'Pixelify Sans',monospace; font-size:.8rem; transition:border-color .12s; }
  .panel-close:hover { border-color:var(--pink); color:var(--pink); }
  .profile-panel-content { padding:22px; display:flex; flex-direction:column; gap:18px; }
  .panel-save-btn { width:100%; padding:13px; background:var(--pink); color:var(--ink); border:2px solid var(--pink-dk); border-radius:var(--r); font-family:'Pixelify Sans',monospace; font-size:.68rem; cursor:pointer; transition:background .12s; margin-top:2px; }
  .panel-save-btn:hover { background:var(--pink-dk); color:var(--white); }

  .error-msg { background:#fdf0f0; border:2px solid #e0b0b0; border-radius:var(--r); padding:9px 13px; font-family:'Pixelify Sans',monospace; font-size:.55rem; color:#c03030; margin-bottom:14px; }

  .loading-screen { display:flex; align-items:center; justify-content:center; height:100vh; flex-direction:column; gap:14px; background:var(--page); }
  .loading-cursor { font-family:'Pixelify Sans',monospace; font-size:1.1rem; color:var(--pink-dk); animation:blink 1s step-end infinite; }

  .login-toggle { text-align:center; font-family:'Pixelify Sans',monospace; font-size:.55rem; color:var(--ink-faint); margin-top:14px; }
  .login-toggle button { background:none; border:none; color:var(--pink-dk); cursor:pointer; font-size:.55rem; text-decoration:underline; padding:0; font-family:'Pixelify Sans',monospace; }
`;

const CITIES = [
  { name:"New York",    vibe:"The city that never sleeps" },
  { name:"Los Angeles", vibe:"Sun, smog & soul" },
  { name:"Chicago",     vibe:"Windy city warmth" },
  { name:"London",      vibe:"Fog & wonder" },
  { name:"Paris",       vibe:"Romance in every alley" },
  { name:"Tokyo",       vibe:"Neon & quiet beauty" },
  { name:"Berlin",      vibe:"Art, bass & history" },
  { name:"Other",       vibe:"Somewhere wonderful" },
];

const CONTACT_TYPES = [
  { type:"Instagram", icon:"📸" },
  { type:"Email",     icon:"✉️" },
  { type:"Discord",   icon:"🎮" },
  { type:"WhatsApp",  icon:"💬" },
  { type:"Telegram",  icon:"✈️" },
  { type:"Phone",     icon:"📱" },
];

function getTimeUntilNext2PM() {
  const now = new Date(), next = new Date();
  next.setHours(14,0,0,0);
  if (now >= next) next.setDate(next.getDate()+1);
  const diff = next-now;
  const h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const API_BASE = import.meta.env.VITE_API_URL || '';
function photoUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

function AvatarUpload({ photo, onChange }) {
  const fileRef = useRef();
  return (
    <div className="avatar-upload-area">
      <div className="avatar-upload-circle" onClick={() => fileRef.current.click()}>
        {photo ? <><img src={photo} alt="you" /><div className="avatar-overlay">✏️</div></> : <div className="avatar-upload-inner"><span className="upload-icon">📷</span><span>Upload</span></div>}
      </div>
      <div className="avatar-hint">{photo ? "tap to change" : "jpg or png"}</div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onChange} />
    </div>
  );
}

function GenderPicker({ label, value, onChange }) {
  return (
    <div>
      {label && <label className="ob-label">{label}</label>}
      <div className="gender-row">
        {[{val:"m",icon:"♂",label:"Man"},{val:"f",icon:"♀",label:"Woman"}].map(o => (
          <div key={o.val} className={`gender-opt ${value===o.val?'selected':''}`} onClick={() => onChange(o.val)}>
            <span className="g-icon">{o.icon}</span><span className="g-label">{o.label}</span>
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
        <div key={c.name} className={`city-opt ${value===c.name?'selected':''}`} onClick={() => onChange(c.name)}>
          <div className="city-name">{c.name}</div><div className="city-vibe">{c.vibe}</div>
        </div>
      ))}
    </div>
  );
}

function ContactTypePicker({ value, onChange }) {
  return (
    <div className="contact-type-grid">
      {CONTACT_TYPES.map(ct => (
        <div key={ct.type} className={`contact-type-opt ${value===ct.type?'selected':''}`} onClick={() => onChange(ct.type)}>
          <span className="contact-type-icon">{ct.icon}</span><span className="contact-type-label">{ct.type}</span>
        </div>
      ))}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  async function handleSubmit() {
    setError('');setLoading(true);
    try { const {token,user}=await apiLogin(email,password); localStorage.setItem('bmj_token',token); onLogin(user); }
    catch(err){setError(err.message);}finally{setLoading(false);}
  }
  return (
    <div className="onboarding">
      <div className="ob-logo-wrap"><div className="ob-logo">be my jam</div><span className="ob-logo-sub">★ daily matchmaking ★</span></div>
      <div className="ob-step">
        <div className="ob-step-title">Sign <em>in</em></div>
        <div className="ob-step-sub">Good to have you back.</div>
        {error && <div className="error-msg">{error}</div>}
        <label className="ob-label">Email</label>
        <input className="ob-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="ob-label">Password</label>
        <input className="ob-input" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
        <div className="ob-nav"><button className="ob-btn-primary" disabled={!email||!password||loading} onClick={handleSubmit}>{loading?'loading...':'sign in →'}</button></div>
      </div>
    </div>
  );
}

function Onboarding({ onComplete, onSwitchToLogin }) {
  const [step,setStep]=useState(0);const [photoFile,setPhotoFile]=useState(null);const [photoPreview,setPhotoPreview]=useState(null);
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [name,setName]=useState('');const [age,setAge]=useState('');
  const [gender,setGender]=useState('');const [seeking,setSeeking]=useState('');const [ageMin,setAgeMin]=useState('22');const [ageMax,setAgeMax]=useState('35');
  const [bio,setBio]=useState('');const [city,setCity]=useState('');const [contactType,setContactType]=useState('Instagram');const [contactValue,setContactValue]=useState('');
  const [error,setError]=useState('');const [loading,setLoading]=useState(false);const TOTAL=7;

  function handlePhotoChange(e){const file=e.target.files[0];if(!file)return;setPhotoFile(file);const r=new FileReader();r.onload=ev=>setPhotoPreview(ev.target.result);r.readAsDataURL(file);}

  function canAdvance(){
    if(step===0)return true;if(step===1)return email.includes('@')&&password.length>=8;
    if(step===2)return name.trim().length>=2&&parseInt(age)>=18&&parseInt(age)<=99;
    if(step===3)return!!gender&&!!seeking&&parseInt(ageMin)>=18&&parseInt(ageMax)<=99&&parseInt(ageMin)<=parseInt(ageMax);
    if(step===4)return bio.trim().length>=20;if(step===5)return!!city;if(step===6)return contactValue.trim().length>=2;return true;
  }

  async function finish(){
    setError('');setLoading(true);
    try{
      const ci=CONTACT_TYPES.find(c=>c.type===contactType);
      const{token,user}=await apiRegister({email,password,name:name.trim(),age:parseInt(age),gender,seeking,ageMin:parseInt(ageMin),ageMax:parseInt(ageMax),bio:bio.trim(),city,contactType,contactIcon:ci?.icon||'💬',contactValue:contactValue.trim()});
      localStorage.setItem('bmj_token',token);
      if(photoFile){try{const{photoUrl:url}=await apiUploadPhoto(photoFile);user.photoUrl=url;}catch{}}
      onComplete(user);
    }catch(err){setError(err.message);setLoading(false);}
  }

  const pips=Array.from({length:TOTAL},(_,i)=><div key={i} className={`ob-pip ${i<step?'done':i===step?'active':''}`} />);

  return (
    <div className="app">
      <div className="onboarding">
        <div className="ob-logo-wrap"><div className="ob-logo">be my jam</div><span className="ob-logo-sub">★ daily matchmaking ★</span></div>
        <div className="ob-progress">{pips}</div>
        {step===0&&<div className="ob-step" key="s0"><div className="ob-step-num">step 1 of {TOTAL}</div><div className="ob-step-title">Your <em>face</em> tells a story</div><div className="ob-step-sub">Upload a photo that feels like you.</div><AvatarUpload photo={photoPreview} onChange={handlePhotoChange} /><div className="ob-nav"><button className="ob-btn-primary" onClick={()=>setStep(1)}>{photoPreview?'looks great →':'skip for now →'}</button></div><div className="login-toggle">already have an account? <button onClick={onSwitchToLogin}>sign in</button></div></div>}
        {step===1&&<div className="ob-step" key="s1"><div className="ob-step-num">step 2 of {TOTAL}</div><div className="ob-step-title">Create your <em>account</em></div><div className="ob-step-sub">Your email is private and never shown to others.</div>{error&&<div className="error-msg">{error}</div>}<label className="ob-label">Email</label><input className="ob-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} /><label className="ob-label">Password (min 8 chars)</label><input className="ob-input" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} /><div className="ob-nav"><button className="ob-btn-back" onClick={()=>setStep(0)}>←</button><button className="ob-btn-primary" disabled={!canAdvance()} onClick={()=>setStep(2)}>continue →</button></div></div>}
        {step===2&&<div className="ob-step" key="s2"><div className="ob-step-num">step 3 of {TOTAL}</div><div className="ob-step-title">Nice to <em>meet</em> you</div><div className="ob-step-sub">What should people call you?</div><label className="ob-label">First name</label><input className="ob-input" placeholder="e.g. Margot" value={name} onChange={e=>setName(e.target.value)} maxLength={30} /><label className="ob-label">Age</label><input className="ob-input" type="number" placeholder="e.g. 28" value={age} onChange={e=>setAge(e.target.value)} min={18} max={99} /><div className="ob-nav"><button className="ob-btn-back" onClick={()=>setStep(1)}>←</button><button className="ob-btn-primary" disabled={!canAdvance()} onClick={()=>setStep(3)}>continue →</button></div></div>}
        {step===3&&<div className="ob-step" key="s3"><div className="ob-step-num">step 4 of {TOTAL}</div><div className="ob-step-title">Who are you <em>seeking?</em></div><div className="ob-step-sub">This shapes the profiles you'll see each day.</div><GenderPicker label="I am a" value={gender} onChange={setGender} /><GenderPicker label="Looking for" value={seeking} onChange={setSeeking} /><label className="ob-label">Age range I'm open to</label><div className="range-row"><input className="ob-input" type="number" placeholder="Min" value={ageMin} onChange={e=>setAgeMin(e.target.value)} min={18} max={99} /><span className="range-sep">to</span><input className="ob-input" type="number" placeholder="Max" value={ageMax} onChange={e=>setAgeMax(e.target.value)} min={18} max={99} /></div><div className="ob-nav"><button className="ob-btn-back" onClick={()=>setStep(2)}>←</button><button className="ob-btn-primary" disabled={!canAdvance()} onClick={()=>setStep(4)}>continue →</button></div></div>}
        {step===4&&<div className="ob-step" key="s4"><div className="ob-step-num">step 5 of {TOTAL}</div><div className="ob-step-title">Your <em>story</em> in a paragraph</div><div className="ob-step-sub">Not a dating resume. More like the opening of a good short story.</div><label className="ob-label">About you</label><textarea className="ob-textarea" rows={5} placeholder="e.g. I make ceramics by hand..." value={bio} onChange={e=>setBio(e.target.value)} maxLength={280} /><div className="char-count">{bio.length}/280</div><div className="ob-nav"><button className="ob-btn-back" onClick={()=>setStep(3)}>←</button><button className="ob-btn-primary" disabled={!canAdvance()} onClick={()=>setStep(5)}>continue →</button></div></div>}
        {step===5&&<div className="ob-step" key="s5"><div className="ob-step-num">step 6 of {TOTAL}</div><div className="ob-step-title">Where do you <em>roam?</em></div><div className="ob-step-sub">You'll be matched with people in the same city.</div><CityPicker value={city} onChange={setCity} /><div className="ob-nav"><button className="ob-btn-back" onClick={()=>setStep(4)}>←</button><button className="ob-btn-primary" disabled={!canAdvance()} onClick={()=>setStep(6)}>continue →</button></div></div>}
        {step===6&&<div className="ob-step" key="s6"><div className="ob-step-num">step 7 of {TOTAL}</div><div className="ob-step-title">How should <em>matches</em> reach you?</div><div className="ob-step-sub">Revealed only when you both choose each other.</div><label className="ob-label">Platform</label><ContactTypePicker value={contactType} onChange={setContactType} /><label className="ob-label">Your handle or address</label><input className="ob-input" placeholder={contactType==="Email"?"you@example.com":`@your${contactType.toLowerCase()}`} value={contactValue} onChange={e=>setContactValue(e.target.value)} /><div className="ob-nav"><button className="ob-btn-back" onClick={()=>setStep(5)}>←</button><button className="ob-btn-primary" disabled={!canAdvance()} onClick={()=>setStep(7)}>review →</button></div></div>}
        {step===7&&<div className="ob-step" key="s7"><div className="ob-step-num">almost there</div><div className="ob-step-title">Looking <em>good,</em> {name}</div><div className="ob-step-sub">Here's how others will see you. Editable any time.</div>{error&&<div className="error-msg">{error}</div>}<div className="review-card">{photoPreview?<div className="review-avatar"><img src={photoPreview} alt="you" /></div>:<div className="review-avatar-placeholder">🍓</div>}<div className="review-name">{name}</div><div className="review-meta">{age} · {city} · {gender==='m'?'man':'woman'} · seeking {seeking==='m'?'men':'women'} {ageMin}–{ageMax}</div><div className="review-desc">{bio}</div><div className="review-contact">{CONTACT_TYPES.find(c=>c.type===contactType)?.icon} {contactType}: hidden until matched</div></div><div className="ob-nav"><button className="ob-btn-back" onClick={()=>setStep(6)}>←</button><button className="ob-btn-primary" disabled={loading} onClick={finish}>{loading?'creating...':'enter ♥'}</button></div></div>}
      </div>
    </div>
  );
}

function EditProfilePanel({ user, onSave, onClose }) {
  const [photoFile,setPhotoFile]=useState(null);const [photoPreview,setPhotoPreview]=useState(photoUrl(user.photoUrl));
  const [name,setName]=useState(user.name);const [age,setAge]=useState(String(user.age));const [gender,setGender]=useState(user.gender||'');const [seeking,setSeeking]=useState(user.seeking||'');
  const [ageMin,setAgeMin]=useState(String(user.ageMin||22));const [ageMax,setAgeMax]=useState(String(user.ageMax||35));const [bio,setBio]=useState(user.bio||'');const [city,setCity]=useState(user.city);
  const [contactType,setContactType]=useState(user.contact.type);const [contactValue,setContactValue]=useState(user.contact.value);const [saving,setSaving]=useState(false);const [error,setError]=useState('');

  function handlePhotoChange(e){const file=e.target.files[0];if(!file)return;setPhotoFile(file);const r=new FileReader();r.onload=ev=>setPhotoPreview(ev.target.result);r.readAsDataURL(file);}

  async function save(){
    setSaving(true);setError('');
    try{
      const ci=CONTACT_TYPES.find(c=>c.type===contactType);
      let updated=await apiUpdateMe({name:name.trim(),age:parseInt(age),gender,seeking,ageMin:parseInt(ageMin),ageMax:parseInt(ageMax),bio:bio.trim(),city,contactType,contactIcon:ci?.icon||'💬',contactValue:contactValue.trim()});
      if(photoFile){const{photoUrl:url}=await apiUploadPhoto(photoFile);updated={...updated,photoUrl:url};}
      onSave(updated);
    }catch(err){setError(err.message);}finally{setSaving(false);}
  }

  return (
    <div className="profile-panel">
      <div className="profile-panel-header"><div className="panel-title">edit profile</div><button className="panel-close" onClick={onClose}>✕</button></div>
      <div className="profile-panel-content">
        {error&&<div className="error-msg">{error}</div>}
        <div><label className="ob-label">Photo</label><AvatarUpload photo={photoPreview} onChange={handlePhotoChange} /></div>
        <div><label className="ob-label">Name</label><input className="ob-input" value={name} onChange={e=>setName(e.target.value)} maxLength={30} /></div>
        <div><label className="ob-label">Age</label><input className="ob-input" type="number" value={age} onChange={e=>setAge(e.target.value)} min={18} max={99} /></div>
        <GenderPicker label="I am a" value={gender} onChange={setGender} />
        <GenderPicker label="Looking for" value={seeking} onChange={setSeeking} />
        <div><label className="ob-label">Age range</label><div className="range-row"><input className="ob-input" type="number" value={ageMin} onChange={e=>setAgeMin(e.target.value)} min={18} max={99} /><span className="range-sep">to</span><input className="ob-input" type="number" value={ageMax} onChange={e=>setAgeMax(e.target.value)} min={18} max={99} /></div></div>
        <div><label className="ob-label">Bio</label><textarea className="ob-textarea" rows={5} value={bio} onChange={e=>setBio(e.target.value)} maxLength={280} /><div className="char-count">{bio.length}/280</div></div>
        <div><label className="ob-label">City</label><CityPicker value={city} onChange={setCity} /></div>
        <div><label className="ob-label">Contact platform</label><ContactTypePicker value={contactType} onChange={setContactType} /><label className="ob-label" style={{marginTop:4}}>Handle or address</label><input className="ob-input" value={contactValue} onChange={e=>setContactValue(e.target.value)} /></div>
        <button className="panel-save-btn" onClick={save} disabled={saving}>{saving?'saving...':'save changes'}</button>
      </div>
    </div>
  );
}

function MainApp({ user: initialUser, setUser }) {
  const [user,setLocalUser]=useState(initialUser);const [tab,setTab]=useState('discover');const [countdown,setCountdown]=useState(getTimeUntilNext2PM());
  const [profiles,setProfiles]=useState([]);const [chosenId,setChosenId]=useState(null);const [selected,setSelected]=useState(null);
  const [notifications,setNotifications]=useState([]);const [matches,setMatches]=useState([]);const [editOpen,setEditOpen]=useState(false);
  const [loadingDiscover,setLoadingDiscover]=useState(true);const [choosing,setChoosing]=useState(false);

  function updateUser(u){setLocalUser(u);setUser(u);}

  const loadDiscover=useCallback(async()=>{setLoadingDiscover(true);try{const data=await apiGetDiscover();setProfiles(data.profiles||[]);setChosenId(data.chosenId||null);}catch(err){console.error(err);}finally{setLoadingDiscover(false);}}, []);
  const loadNotifications=useCallback(async()=>{try{setNotifications(await apiGetNotifications());}catch{}}, []);
  const loadMatches=useCallback(async()=>{try{setMatches(await apiGetMatches());}catch{}}, []);

  useEffect(()=>{loadDiscover();loadNotifications();loadMatches();setTimeout(()=>requestPushPermission(),3000);},[]);
  useEffect(()=>{const t=setInterval(loadNotifications,30000);return()=>clearInterval(t);},[]);
  useEffect(()=>{const t=setInterval(()=>setCountdown(getTimeUntilNext2PM()),1000);return()=>clearInterval(t);},[]);

  async function handleChoose(){if(!selected||choosing)return;setChoosing(true);try{const{matched}=await apiChoose(selected.id);setChosenId(selected.id);if(matched)await loadMatches();}catch(err){alert(err.message);}finally{setChoosing(false);}}
  async function handleMatch(id){try{await apiRespond(id,true);await loadNotifications();await loadMatches();setTab('matches');}catch(err){alert(err.message);}}
  async function handlePass(id){await apiRespond(id,false);setNotifications(prev=>prev.map(n=>n.from.id===id?{...n,pending:false,passed:true}:n));}

  const pendingCount=notifications.filter(n=>n.pending).length;
  const chosenProfile=profiles.find(p=>p.id===chosenId);

  return (
    <>
      <div className="app">
        {editOpen&&<EditProfilePanel user={user} onSave={u=>{updateUser(u);setEditOpen(false);}} onClose={()=>setEditOpen(false)} />}
        <div className="header">
          <div className="header-band">
            <div><div className="logo">be my jam</div><span className="logo-sub">♥ {user.city} ♥</span></div>
            <button className="my-avatar-btn" onClick={()=>setEditOpen(true)}>{user.photoUrl?<img src={photoUrl(user.photoUrl)} alt="me" />:'🍓'}</button>
          </div>
          <nav className="nav">
            <button className={`nav-btn ${tab==='discover'?'active':''}`} onClick={()=>setTab('discover')}>discover</button>
            <button className={`nav-btn ${tab==='notifications'?'active':''}`} onClick={()=>{setTab('notifications');loadNotifications();}}>chosen {pendingCount>0&&<span className="badge">{pendingCount}</span>}</button>
            <button className={`nav-btn ${tab==='matches'?'active':''}`} onClick={()=>{setTab('matches');loadMatches();}}>matches {matches.length>0&&<span className="badge">{matches.length}</span>}</button>
          </nav>
        </div>
        <div className="content">
          {tab==='discover'&&(
            <div className="fade-in">
              <div className="section-title">Today's Four</div>
              <div className="section-sub">Choose one. They'll be notified.</div>
              <div className="countdown">🕑 {countdown}</div>
              {loadingDiscover?<div className="empty-state"><div style={{fontFamily:"'Pixelify Sans',monospace",fontSize:'.7rem',color:'var(--ink-faint)'}}>loading...</div></div>
              :chosenId?<div className="already-chosen fade-in"><div className="big-icon">🍓</div><p>You chose <strong>{chosenProfile?.name||'someone'}</strong> today.<br/>They've been notified. Check back tomorrow.</p></div>
              :profiles.length===0?<div className="empty-state"><div className="icon">🔭</div><p>No profiles match your preferences in {user.city} right now. Try widening your age range.</p></div>
              :<><div className="profiles-grid">{profiles.map(p=><div key={p.id} className={`profile-card ${selected?.id===p.id?'selected':''}`} onClick={()=>setSelected(p)}><div className="avatar-wrap">{p.photoUrl?<img className="avatar-img" src={photoUrl(p.photoUrl)} alt={p.name} />:<div className="avatar-placeholder">🌟</div>}</div><div className="profile-name">{p.name}</div><div className="profile-age">{p.age} · {p.city}</div><div className="profile-desc">{p.bio}</div></div>)}</div><button className="choose-btn" disabled={!selected||choosing} onClick={handleChoose}>{choosing?'choosing...':selected?`choose ${selected.name} ♥`:'select someone'}</button></>}
            </div>
          )}
          {tab==='notifications'&&(
            <div className="fade-in">
              <div className="section-title">You Were Chosen</div>
              <div className="section-sub">Match to reveal their contact.</div>
              <div className="notif-list">
                {notifications.length===0&&<div className="empty-state"><div className="icon">💌</div><p>No one has chosen you yet.</p></div>}
                {notifications.map(n=>(
                  <div key={n.id} className={`notif-card ${n.pending?'new':''}`}>
                    {n.pending&&<div className="notif-new-label">new</div>}
                    <div className="notif-avatar">{n.from.photoUrl?<img src={photoUrl(n.from.photoUrl)} alt={n.from.name} />:'🌟'}</div>
                    <div className="notif-body">
                      <div className="notif-text"><strong>{n.from.name}</strong> chose you today.{n.matched&&' You matched! 🎉'}{n.passed&&' You passed.'}</div>
                      {n.pending&&<div className="notif-actions"><button className="btn-match" onClick={()=>handleMatch(n.from.id)}>match ♥</button><button className="btn-pass" onClick={()=>handlePass(n.from.id)}>pass</button></div>}
                      <div className="notif-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==='matches'&&(
            <div className="fade-in">
              <div className="section-title">Matches</div>
              <div className="section-sub">Their contact details are revealed below.</div>
              {matches.length===0&&<div className="empty-state"><div className="icon">🕯️</div><p>No matches yet.</p></div>}
              {matches.map(m=>(
                <div key={m.id} className="match-card fade-in">
                  <div className="matched-banner"><div className="heart">🍓</div><h3>You matched with {m.partner.name}</h3><p>you both chose each other — say hello!</p></div>
                  <div className="match-header">
                    <div className="match-avatar">{m.partner.photoUrl?<img src={photoUrl(m.partner.photoUrl)} alt={m.partner.name} />:'🌟'}</div>
                    <div className="match-info"><h3>{m.partner.name}</h3><p>{m.partner.age} · {m.partner.city}</p><p style={{marginTop:4,fontSize:'.78rem',color:'var(--ink-light)',fontFamily:"'EB Garamond',serif",fontStyle:'italic'}}>{m.partner.bio?.slice(0,60)}…</p></div>
                  </div>
                  <div className="match-label">contact info</div>
                  <div className="contact-box"><div className="contact-row"><div className="contact-icon">{m.partner.contact.icon}</div><div><span className="contact-label">{m.partner.contact.type}</span><span className="contact-value">{m.partner.contact.value}</span></div></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [user,setUser]=useState(null);const [screen,setScreen]=useState('loading');
  useEffect(()=>{
    const token=localStorage.getItem('bmj_token');
    if(!token){setScreen('onboarding');return;}
    apiGetMe().then(u=>{setUser(u);setScreen('app');}).catch(()=>{localStorage.removeItem('bmj_token');setScreen('onboarding');});
  },[]);
  if(screen==='loading')return(<><style>{STYLE}</style><div className="loading-screen"><div style={{fontFamily:"'EB Garamond',serif",fontSize:'2.1rem',fontStyle:'italic',color:'var(--ink)'}}>be my jam</div><div className="loading-cursor">_</div></div></>);
  return(
    <><style>{STYLE}</style>
    {screen==='onboarding'&&<Onboarding onComplete={u=>{setUser(u);setScreen('app');}} onSwitchToLogin={()=>setScreen('login')} />}
    {screen==='login'&&<div className="app"><LoginScreen onLogin={u=>{setUser(u);setScreen('app');}} /><div className="login-toggle" style={{padding:'0 24px 32px',position:'relative',zIndex:1}}>new here? <button onClick={()=>setScreen('onboarding')}>create account</button></div></div>}
    {screen==='app'&&user&&<MainApp user={user} setUser={u=>setUser(u)} />}
    </>
  );
}