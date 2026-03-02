import { useState, useEffect, useRef, useCallback } from "react";
import {
  apiRegister, apiLogin, apiGetMe, apiUpdateMe, apiUploadPhoto,
  apiGetDiscover, apiChoose, apiGetNotifications, apiRespond, apiGetMatches,
} from "./api.js";
import { requestPushPermission } from "./push.js";

// ── Styles ────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');

  :root {
    --white: #ffffff;
    --cream: #fffdf7;
    --ink: #1a1612;
    --ink-light: #5a5048;
    --ink-faint: #b0a898;
    --border: #e2ddd6;
    --border-dark: #c8c0b4;
    --holo: linear-gradient(135deg, #ffb3d9, #c9b3ff, #b3d9ff, #b3ffda, #fffbb3, #ffb3d9);
    --holo-text: linear-gradient(90deg, #e060a0, #9060e0, #60a0e0, #60e0a0, #e0c060, #e060a0);
    --pink: #e060a0;
    --periwinkle: #7b8fd4;
    --orange: #e85d26;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--cream);
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
    background: var(--white);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    position: relative;
  }

  /* no bg-grain needed but keep the div harmless */
  .bg-grain { display: none; }

  @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeInUp 0.4s ease forwards; }

  /* ── Holographic shimmer utility ── */
  @keyframes holo-shift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
  .holo-text {
    background: var(--holo-text);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: holo-shift 4s linear infinite;
  }
  .holo-border {
    border-image: var(--holo) 1;
    border-image-slice: 1;
  }

  /* ── ONBOARDING ── */
  .onboarding {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 28px 48px;
    position: relative;
    z-index: 1;
  }

  .ob-logo-wrap { padding: 48px 0 32px; text-align: center; }
  .ob-logo {
    font-family: 'EB Garamond', serif;
    font-size: 2.6rem;
    font-weight: 400;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  .ob-logo span {
    background: var(--holo-text);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: holo-shift 4s linear infinite;
    font-style: italic;
  }
  .ob-tagline {
    font-size: 0.78rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-top: 6px;
    font-family: 'EB Garamond', serif;
  }

  .ob-progress { display: flex; gap: 5px; margin-bottom: 32px; }
  .ob-pip { height: 2px; flex: 1; background: var(--border); transition: background 0.3s; }
  .ob-pip.done { background: var(--pink); }
  .ob-pip.active {
    background: linear-gradient(90deg, #e060a0, #9060e0);
  }

  .ob-step { flex: 1; display: flex; flex-direction: column; animation: fadeInUp 0.35s ease forwards; }
  .ob-step-num { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; }
  .ob-step-title { font-family: 'EB Garamond', serif; font-size: 2rem; font-weight: 400; line-height: 1.2; margin-bottom: 8px; color: var(--ink); }
  .ob-step-title em { font-style: italic; color: var(--pink); }
  .ob-step-sub { font-size: 0.95rem; color: var(--ink-light); margin-bottom: 28px; line-height: 1.7; font-style: italic; }

  .avatar-upload-area { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 24px; }
  .avatar-upload-circle {
    width: 120px; height: 120px; border-radius: 50%;
    background: var(--cream);
    border: 2px dashed var(--border-dark);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; overflow: hidden; transition: border-color 0.2s; position: relative;
  }
  .avatar-upload-circle:hover { border-color: var(--pink); }
  .avatar-upload-circle img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .avatar-upload-inner { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--ink-faint); }
  .avatar-upload-inner .upload-icon { font-size: 1.6rem; }
  .avatar-upload-inner span { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'EB Garamond', serif; }
  .avatar-overlay { position: absolute; inset: 0; background: #ffffff80; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; border-radius: 50%; font-size: 1.4rem; }
  .avatar-upload-circle:hover .avatar-overlay { opacity: 1; }
  .avatar-hint { font-size: 0.78rem; color: var(--ink-faint); text-align: center; font-style: italic; }

  .ob-label { display: block; font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 8px; font-family: 'EB Garamond', serif; }

  .ob-input, .ob-textarea {
    width: 100%;
    background: var(--white);
    border: 1px solid var(--border-dark);
    border-radius: 0;
    padding: 12px 14px;
    color: var(--ink);
    font-family: 'EB Garamond', serif;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
    resize: none;
    margin-bottom: 20px;
  }
  .ob-input:focus, .ob-textarea:focus { border-color: var(--pink); }
  .char-count { text-align: right; font-size: 0.75rem; color: var(--ink-faint); margin-top: -16px; margin-bottom: 20px; font-style: italic; }

  .city-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .city-opt {
    background: var(--white);
    border: 1px solid var(--border-dark);
    padding: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .city-opt:hover { border-color: var(--periwinkle); background: #f5f6ff; }
  .city-opt.selected { border-color: var(--pink); background: #fff0f8; }
  .city-name { font-size: 0.95rem; font-weight: 500; margin-bottom: 1px; }
  .city-vibe { font-size: 0.75rem; color: var(--ink-faint); font-style: italic; }

  .gender-row { display: flex; gap: 8px; margin-bottom: 20px; }
  .gender-opt {
    flex: 1;
    background: var(--white);
    border: 1px solid var(--border-dark);
    padding: 16px 12px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .gender-opt:hover { border-color: var(--periwinkle); background: #f5f6ff; }
  .gender-opt.selected { border-color: var(--pink); background: #fff0f8; }
  .gender-opt .g-icon { font-size: 1.5rem; display: block; margin-bottom: 6px; }
  .gender-opt .g-label { font-size: 0.9rem; font-weight: 500; display: block; }
  .gender-opt .g-sub { font-size: 0.72rem; color: var(--ink-faint); font-style: italic; }

  .range-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .range-row .ob-input { margin-bottom: 0; flex: 1; }
  .range-sep { color: var(--ink-faint); font-size: 0.9rem; flex-shrink: 0; font-style: italic; }

  .contact-type-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 20px; }
  .contact-type-opt {
    background: var(--white);
    border: 1px solid var(--border-dark);
    padding: 10px 6px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .contact-type-opt:hover { border-color: var(--periwinkle); background: #f5f6ff; }
  .contact-type-opt.selected { border-color: var(--pink); background: #fff0f8; }
  .contact-type-icon { font-size: 1.2rem; display: block; margin-bottom: 3px; }
  .contact-type-label { font-size: 0.68rem; color: var(--ink-light); font-style: italic; }

  .ob-nav { display: flex; gap: 10px; margin-top: auto; padding-top: 28px; }

  .ob-btn-primary {
    flex: 1;
    padding: 14px 20px;
    background: var(--ink);
    color: var(--white);
    border: 2px solid var(--ink);
    font-family: 'EB Garamond', serif;
    font-size: 1rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s;
    font-style: italic;
  }
  .ob-btn-primary:hover:not(:disabled) { background: var(--pink); border-color: var(--pink); }
  .ob-btn-primary:disabled { background: var(--border); border-color: var(--border); color: var(--ink-faint); cursor: not-allowed; }

  .ob-btn-back {
    padding: 14px 18px;
    background: none;
    color: var(--ink-light);
    border: 2px solid var(--border-dark);
    font-family: 'EB Garamond', serif;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ob-btn-back:hover { border-color: var(--ink); color: var(--ink); }

  .review-card {
    background: var(--cream);
    border: 1px solid var(--border-dark);
    padding: 28px 24px;
    text-align: center;
    margin-bottom: 20px;
    position: relative;
  }
  .review-card::before {
    content: '✦ ✦ ✦';
    display: block;
    font-size: 0.7rem;
    color: var(--ink-faint);
    margin-bottom: 16px;
    letter-spacing: 0.3em;
  }
  .review-avatar { width: 90px; height: 90px; border-radius: 50%; margin: 0 auto 14px; overflow: hidden; border: 2px solid var(--border-dark); }
  .review-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .review-avatar-placeholder { width: 90px; height: 90px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 14px; }
  .review-name { font-family: 'EB Garamond', serif; font-size: 1.5rem; font-weight: 400; margin-bottom: 2px; }
  .review-meta { font-size: 0.82rem; color: var(--ink-faint); margin-bottom: 12px; font-style: italic; }
  .review-desc { font-size: 0.95rem; color: var(--ink-light); line-height: 1.7; margin-bottom: 14px; font-style: italic; }
  .review-contact { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border-dark); padding: 4px 12px; font-size: 0.78rem; color: var(--ink-light); font-style: italic; }

  /* ── MAIN APP ── */
  .header {
    padding: 0;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid var(--border);
  }

  /* Orange Penguin-style band at top */
  .header-band {
    background: var(--orange);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-top { display: flex; align-items: center; justify-content: space-between; }
  .logo { font-family: 'EB Garamond', serif; font-size: 1.7rem; font-weight: 400; color: var(--white); letter-spacing: -0.01em; }
  .logo span { font-style: italic; }
  .subheading { font-size: 0.7rem; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase; color: #ffffff99; margin-top: 1px; font-family: 'EB Garamond', serif; }

  .my-avatar-btn {
    width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
    border: 2px solid #ffffff60;
    cursor: pointer; background: #ffffff30;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; transition: border-color 0.2s; flex-shrink: 0;
  }
  .my-avatar-btn:hover { border-color: #ffffff; }
  .my-avatar-btn img { width: 100%; height: 100%; object-fit: cover; }

  .nav { display: flex; border-bottom: 1px solid var(--border); padding: 0 8px; background: var(--white); }
  .nav-btn {
    background: none; border: none; color: var(--ink-faint);
    font-family: 'EB Garamond', serif; font-size: 0.9rem;
    letter-spacing: 0.05em;
    padding: 12px 16px; cursor: pointer; position: relative; transition: color 0.2s;
    font-style: italic;
  }
  .nav-btn.active { color: var(--ink); }
  .nav-btn.active::after {
    content: '';
    position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
    background: var(--orange);
  }
  .badge {
    background: var(--pink);
    color: white;
    border-radius: 999px; font-size: 0.6rem; font-weight: 700;
    padding: 1px 5px; margin-left: 4px; vertical-align: middle;
    font-style: normal;
  }

  .content { flex: 1; padding: 28px 24px; position: relative; z-index: 1; }
  .section-title { font-family: 'EB Garamond', serif; font-size: 1.6rem; font-weight: 400; margin-bottom: 2px; }
  .section-sub { font-size: 0.9rem; color: var(--ink-faint); margin-bottom: 20px; font-style: italic; }

  .countdown {
    display: inline-block;
    border: 1px solid var(--border-dark);
    padding: 3px 10px;
    font-size: 0.78rem;
    color: var(--ink-light);
    letter-spacing: 0.08em;
    margin-bottom: 20px;
    font-variant-numeric: tabular-nums;
    font-style: italic;
  }

  .profiles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .profile-card {
    background: var(--white);
    border: 1px solid var(--border-dark);
    padding: 18px 12px 14px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  .profile-card:hover { border-color: var(--periwinkle); background: #f8f9ff; transform: translateY(-1px); }
  .profile-card.selected {
    border-color: var(--pink);
    background: #fff8fc;
  }
  .profile-card.selected::after {
    content: '♡';
    position: absolute;
    top: 8px; right: 10px;
    font-size: 0.8rem;
    color: var(--pink);
  }

  .avatar-wrap { width: 68px; height: 68px; border-radius: 50%; margin: 0 auto 10px; position: relative; }
  .avatar-placeholder { width: 68px; height: 68px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: var(--cream); border: 1px solid var(--border-dark); }
  .avatar-img { width: 68px; height: 68px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-dark); }

  .profile-name { font-family: 'EB Garamond', serif; font-size: 1.05rem; font-weight: 500; margin-bottom: 2px; }
  .profile-age { font-size: 0.75rem; color: var(--ink-faint); margin-bottom: 6px; font-style: italic; }
  .profile-desc { font-size: 0.8rem; color: var(--ink-light); line-height: 1.55; font-style: italic; }

  .choose-btn {
    width: 100%; margin-top: 24px; padding: 14px;
    background: var(--ink); color: var(--white);
    border: 2px solid var(--ink);
    font-family: 'EB Garamond', serif; font-size: 1rem;
    letter-spacing: 0.06em; font-style: italic;
    cursor: pointer; transition: all 0.15s;
  }
  .choose-btn:hover:not(:disabled) { background: var(--pink); border-color: var(--pink); }
  .choose-btn:disabled { background: var(--border); border-color: var(--border); color: var(--ink-faint); cursor: not-allowed; }

  .already-chosen { text-align: center; padding: 48px 20px; }
  .already-chosen .big-icon { font-size: 2.8rem; margin-bottom: 14px; }
  .already-chosen p { color: var(--ink-light); font-size: 1rem; line-height: 1.7; font-style: italic; }
  .already-chosen strong { color: var(--pink); font-style: normal; }

  .notif-list { display: flex; flex-direction: column; gap: 10px; }
  .notif-card {
    background: var(--white);
    border: 1px solid var(--border-dark);
    padding: 16px;
    display: flex; align-items: flex-start; gap: 14px;
  }
  .notif-card.new { border-left: 3px solid var(--pink); }
  .notif-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; background: var(--cream); border: 1px solid var(--border-dark); flex-shrink: 0; overflow: hidden; }
  .notif-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .notif-body { flex: 1; }
  .notif-text { font-size: 0.95rem; line-height: 1.5; color: var(--ink); margin-bottom: 10px; }
  .notif-text strong { font-weight: 600; }
  .notif-actions { display: flex; gap: 8px; }
  .btn-match { background: var(--ink); color: var(--white); border: 2px solid var(--ink); padding: 6px 16px; font-family: 'EB Garamond', serif; font-size: 0.9rem; font-style: italic; cursor: pointer; transition: all 0.15s; }
  .btn-match:hover { background: var(--pink); border-color: var(--pink); }
  .btn-pass { background: none; color: var(--ink-light); border: 2px solid var(--border-dark); padding: 6px 14px; font-family: 'EB Garamond', serif; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; }
  .btn-pass:hover { border-color: var(--ink); color: var(--ink); }
  .notif-time { font-size: 0.72rem; color: var(--ink-faint); margin-top: 8px; font-style: italic; }

  .match-card {
    background: var(--white);
    border: 1px solid var(--border-dark);
    padding: 20px;
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
  }
  .match-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--holo);
    background-size: 200% auto;
    animation: holo-shift 3s linear infinite;
  }
  .match-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .match-avatar { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; background: var(--cream); border: 1px solid var(--border-dark); flex-shrink: 0; overflow: hidden; }
  .match-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .match-info h3 { font-family: 'EB Garamond', serif; font-size: 1.15rem; font-weight: 400; margin-bottom: 2px; }
  .match-info p { font-size: 0.78rem; color: var(--ink-faint); font-style: italic; }
  .match-label { font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faint); font-family: 'EB Garamond', serif; margin-bottom: 8px; }
  .contact-box { background: var(--cream); border: 1px solid var(--border); padding: 12px 14px; }
  .contact-row { display: flex; align-items: center; gap: 10px; }
  .contact-icon { width: 28px; height: 28px; background: var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }
  .contact-label { font-size: 0.68rem; color: var(--ink-faint); display: block; font-style: italic; }
  .contact-value { font-size: 0.9rem; color: var(--ink); font-weight: 500; }

  .empty-state { text-align: center; padding: 60px 20px; color: var(--ink-faint); }
  .empty-state .icon { font-size: 2.2rem; margin-bottom: 12px; }
  .empty-state p { font-size: 0.95rem; line-height: 1.7; font-style: italic; }

  .matched-banner {
    background: var(--cream);
    border: 1px solid var(--border-dark);
    padding: 16px;
    text-align: center;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
  }
  .matched-banner::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--holo);
    background-size: 200% auto;
    animation: holo-shift 3s linear infinite;
  }
  .matched-banner .heart { font-size: 1.6rem; }
  .matched-banner h3 { font-family: 'EB Garamond', serif; font-size: 1.15rem; font-weight: 400; margin: 6px 0 2px; }
  .matched-banner p { font-size: 0.85rem; color: var(--ink-faint); font-style: italic; }

  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .profile-panel {
    position: fixed; inset: 0; z-index: 100;
    display: flex; flex-direction: column;
    background: var(--white);
    max-width: 480px; margin: 0 auto;
    animation: slideUp 0.3s ease forwards;
    overflow-y: auto;
  }
  .profile-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; background: var(--white); z-index: 1;
  }
  .panel-title { font-family: 'EB Garamond', serif; font-size: 1.2rem; font-weight: 400; font-style: italic; }
  .panel-close {
    background: none; border: 2px solid var(--border-dark); color: var(--ink);
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 0.9rem; transition: border-color 0.15s;
  }
  .panel-close:hover { border-color: var(--ink); }
  .profile-panel-content { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .panel-save-btn {
    width: 100%; padding: 14px;
    background: var(--ink); color: var(--white);
    border: 2px solid var(--ink);
    font-family: 'EB Garamond', serif; font-size: 1rem;
    font-style: italic; letter-spacing: 0.06em;
    cursor: pointer; transition: all 0.15s; margin-top: 4px;
  }
  .panel-save-btn:hover { background: var(--pink); border-color: var(--pink); }

  .error-msg { background: #fff0f0; border: 1px solid #f0b0b0; padding: 10px 14px; font-size: 0.88rem; color: #c03030; margin-bottom: 16px; font-style: italic; }

  .loading-screen {
    display: flex; align-items: center; justify-content: center;
    height: 100vh; font-family: 'EB Garamond', serif;
    font-size: 1.4rem; color: var(--ink-faint);
    flex-direction: column; gap: 14px;
    background: var(--cream);
  }
  .loading-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--pink); animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }

  .login-toggle { text-align: center; font-size: 0.9rem; color: var(--ink-faint); margin-top: 16px; font-style: italic; }
  .login-toggle button { background: none; border: none; color: var(--periwinkle); cursor: pointer; font-size: 0.9rem; text-decoration: underline; padding: 0; font-family: 'EB Garamond', serif; font-style: italic; }
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
          <div className="ob-logo">jam<span>.</span></div>
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
          <div className="header-band">
            <div>
              <div className="logo">jam<span>.</span></div>
              <div className="subheading">daily matchmaking · {user.city}</div>
            </div>
            <button className="my-avatar-btn" onClick={() => setEditOpen(true)}>
              {user.photoUrl ? <img src={photoUrl(user.photoUrl)} alt="me" /> : '♡'}
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
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.4rem' }}>jam<span style={{ background: 'linear-gradient(90deg,#e060a0,#9060e0,#60a0e0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic' }}>.</span></div>
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
