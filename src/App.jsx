import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";

// ── 初期データ ──
const INITIAL_HOMES = [
  { id: "nishikujo",    name: "西九条ホーム",   area: "此花区",   password: "6797" },
  { id: "kujo",         name: "九条ホーム",     area: "西区",     password: "kujo2" },
  { id: "torishima",   name: "酉島ホーム",     area: "此花区",   password: "tori3" },
  { id: "shinkoriyama",name: "新郡山ホーム",   area: "茨木市",   password: "shin4" },
  { id: "kasugade",    name: "春日出ホーム",   area: "此花区",   password: "kasu5" },
  { id: "dekijima",    name: "出来島ホーム",   area: "西淀川区", password: "deki6" },
  { id: "honsha",      name: "本社",           area: "西淀川区", password: "olive0" },
];

const ADMIN_PASSWORD = "123456";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzAFYeylltCfitJvvpS8LrWtK5ZR0oErdZg_iiBODObUFuocxi_XpxgOzE7GNEPgbGz/exec";

const INITIAL_STAFF = [
  { id: 1, name: "畠　博思", homeIds: ["honsha"], role: "会長・管理者・サービス管理責任者", color: "#a8c4e0" },
  { id: 2, name: "高崎　忍", homeIds: ["honsha"], role: "代表取締役", color: "#f4b8c1" },
  { id: 3, name: "竹政　高", homeIds: ["kujo"], role: "世話人", color: "#b8d4a8" },
  { id: 4, name: "黒田　栄光", homeIds: ["nishikujo","kujo"], role: "世話人", color: "#f4d4a0" },
  { id: 5, name: "向原　忍", homeIds: ["nishikujo"], role: "日中支援員", color: "#c4b8e8" },
  { id: 6, name: "浅野　和子", homeIds: ["kujo"], role: "日中支援員", color: "#f0c8a0" },
  { id: 7, name: "吉山　綾", homeIds: ["kasugade"], role: "事務員（経理）世話人", color: "#a8d4d4" },
  { id: 8, name: "棟長　秀行", homeIds: ["nishikujo"], role: "世話人", color: "#a8c4e0" },
  { id: 9, name: "川浪　明香", homeIds: ["torishima"], role: "世話人", color: "#f4b8c1" },
  { id: 10, name: "吉永　みゆき", homeIds: ["torishima"], role: "世話人", color: "#b8d4a8" },
  { id: 11, name: "岩久保　博一", homeIds: ["honsha"], role: "事務員（総務）", color: "#f4d4a0" },
  { id: 12, name: "小林　浩", homeIds: ["kujo"], role: "世話人", color: "#c4b8e8" },
  { id: 13, name: "小池　真美", homeIds: ["honsha"], role: "事務員", color: "#f0c8a0" },
  { id: 14, name: "金野　孝生", homeIds: ["kujo"], role: "世話人", color: "#a8d4d4" },
  { id: 15, name: "梶原　穂乃香", homeIds: ["honsha"], role: "障がい者サテライト事業部・指導員", color: "#a8c4e0" },
  { id: 16, name: "和田　憲明", homeIds: ["nishikujo","shinkoriyama","kasugade"], role: "世話人", color: "#f4b8c1" },
  { id: 17, name: "神田　暁史", homeIds: ["nishikujo","kujo","torishima","shinkoriyama","kasugade","dekijima"], role: "世話人・障がい者サテライト事業部管理者", color: "#b8d4a8" },
  { id: 18, name: "池本　ひとみ", homeIds: ["shinkoriyama"], role: "日中支援員", color: "#f4d4a0" },
  { id: 19, name: "梶原　瑛洋", homeIds: ["honsha"], role: "障がい者サテライト事業部・指導員", color: "#c4b8e8" },
  { id: 20, name: "長井　準", homeIds: ["nishikujo"], role: "世話人", color: "#f0c8a0" },
  { id: 21, name: "堀口　美香", homeIds: ["nishikujo","torishima","shinkoriyama"], role: "世話人", color: "#a8d4d4" },
  { id: 22, name: "広田　侑紀", homeIds: ["dekijima"], role: "世話人", color: "#a8c4e0" },
  { id: 23, name: "丸川　星奈", homeIds: ["torishima","dekijima"], role: "世話人", color: "#f4b8c1" },
  { id: 24, name: "福田　久男", homeIds: ["shinkoriyama"], role: "世話人", color: "#b8d4a8" },
  { id: 25, name: "中嶋　健二", homeIds: ["kujo"], role: "準夜勤", color: "#f4d4a0" },
  { id: 26, name: "檜原　あゆみ", homeIds: ["kasugade"], role: "準夜勤→夜勤", color: "#c4b8e8" },
  { id: 27, name: "鈴木　基宏", homeIds: ["shinkoriyama"], role: "準夜勤", color: "#f0c8a0" },
  { id: 28, name: "上垣　卓也", homeIds: ["kasugade"], role: "準夜勤", color: "#a8d4d4" },
  { id: 29, name: "中岡　優紀", homeIds: ["honsha"], role: "看護師", color: "#a8c4e0" },
  { id: 30, name: "西尾　満美子", homeIds: ["nishikujo","kujo","torishima","kasugade","dekijima"], role: "世話人", color: "#f4b8c1" },
  { id: 31, name: "李　俊輝", homeIds: ["nishikujo","kujo"], role: "世話人", color: "#b8d4a8" },
  { id: 32, name: "今井　亮平", homeIds: ["kujo"], role: "準夜勤", color: "#f4d4a0" },
  { id: 33, name: "蛭子　美穂", homeIds: ["kujo"], role: "世話人", color: "#c4b8e8" },
  { id: 34, name: "大谷　恭祐", homeIds: ["nishikujo","kujo"], role: "準夜勤", color: "#f0c8a0" },
  { id: 35, name: "増川　美由紀", homeIds: ["dekijima"], role: "準夜勤", color: "#a8d4d4" },
  { id: 36, name: "金井　信夫", homeIds: ["nishikujo"], role: "準夜勤", color: "#a8c4e0" },
  { id: 37, name: "坂梨　幸恵子", homeIds: ["kujo","dekijima"], role: "世話人", color: "#f4b8c1" },
  { id: 38, name: "廣田　誠", homeIds: ["kujo"], role: "世話人", color: "#b8d4a8" },
  { id: 39, name: "吉山スカイラ", homeIds: ["kasugade"], role: "世話人", color: "#f4d4a0" },
  { id: 40, name: "野田　由美子", homeIds: ["torishima"], role: "世話人", color: "#c4b8e8" },
  { id: 41, name: "松下　久子", homeIds: ["torishima"], role: "準夜勤", color: "#f0c8a0" },
  { id: 42, name: "中川　良広", homeIds: ["nishikujo"], role: "夜勤", color: "#a8d4d4" },
  { id: 44, name: "竹原　龍二", homeIds: ["shinkoriyama"], role: "世話人", color: "#a8c4e0" },
  { id: 45, name: "富山　史子", homeIds: ["nishikujo"], role: "世話人", color: "#f4b8c1" },
  { id: 46, name: "鳥居　万祐子", homeIds: ["kasugade","shinkoriyama"], role: "世話人", color: "#b8d4a8" },
  { id: 47, name: "平良　和子", homeIds: ["dekijima"], role: "世話人", color: "#f4d4a0" },
  { id: 48, name: "中島　真弓", homeIds: ["kujo"], role: "世話人", color: "#c4b8e8" },
  { id: 49, name: "中尾　良仁", homeIds: ["nishikujo"], role: "夜勤", color: "#f0c8a0" },
  { id: 50, name: "川浪　彩乃", homeIds: ["torishima"], role: "準夜勤", color: "#a8d4d4" },
  { id: 51, name: "岩本　星江", homeIds: ["torishima"], role: "準夜勤", color: "#a8c4e0" },
  { id: 52, name: "上念　直実", homeIds: ["kasugade","dekijima"], role: "世話人", color: "#f4b8c1" },
  { id: 53, name: "岸田　大輔", homeIds: ["nishikujo"], role: "準夜勤", color: "#b8d4a8" },
  { id: 54, name: "吉岡　志保美", homeIds: ["kasugade","dekijima"], role: "世話人", color: "#f4d4a0" },
];

const ROLES = ["世話人","日中支援員","準夜勤","夜勤","看護師","事務員","事務員（総務）","事務員（経理）世話人","障がい者サテライト事業部・指導員","世話人・障がい者サテライト事業部管理者","会長・管理者・サービス管理責任者","代表取締役","準夜勤→夜勤"];

// ── ユーティリティ ──
const pad = n => String(n).padStart(2, "0");
const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtTimeShort = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const WEEKDAY = ["日","月","火","水","木","金","土"];
const TODAY = () => fmtDate(new Date());
const daysInMonth = ym => { const [y, m] = ym.split("-").map(Number); return new Date(y, m, 0).getDate(); };

function initials(name) {
  const parts = name.replace(/\s+/g,"");
  return parts.length >= 2 ? parts[0] + parts[parts.length-1] : parts[0];
}

function calcWorkMin(records) {
  const sorted = [...records].sort((a,b) => a.ts - b.ts);
  let total = 0, inTs = null, breakTs = null;
  for (const r of sorted) {
    if (r.type === "出勤" && !inTs) inTs = r.ts;
    else if (r.type === "休憩開始" && inTs && !breakTs) { total += r.ts - inTs; breakTs = r.ts; inTs = null; }
    else if (r.type === "休憩終了" && breakTs) { inTs = r.ts; breakTs = null; }
    else if (r.type === "退勤" && inTs) { total += r.ts - inTs; inTs = null; }
  }
  const min = Math.floor(total / 60000);
  return min;
}

function fmtWorkTime(min) {
  if (min <= 0) return "-";
  return `${Math.floor(min/60)}時間${min%60}分`;
}

// ── カラーパレット ──
const C = {
  bg: "#f2f0eb",
  card: "#ffffff",
  olive: "#3d6b35",
  oliveLight: "#5a8f50",
  olivePale: "#e8f0e5",
  olivePale2: "#d4e6cf",
  text: "#1a1a1a",
  muted: "#6b7060",
  border: "#ddd9d0",
  danger: "#b03030",
  dangerPale: "#fce8e8",
  warn: "#c07020",
  warnPale: "#fff3e0",
  blue: "#2563a8",
  bluePale: "#e8f0fa",
  break: "#9a6f3a",
  breakPale: "#fdf0e0",
};

// ── 共通スタイル ──
const S = {
  page: { background: C.bg, minHeight: "100vh", fontFamily: "'Hiragino Kaku Gothic ProN','Helvetica Neue',sans-serif", color: C.text },
  card: { background: C.card, borderRadius: 16, padding: "18px 16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,.07)" },
  btn: (bg, color, border) => ({
    width: "100%", padding: "15px", borderRadius: 12, border: border || "none",
    background: bg, color, fontWeight: 700, fontSize: "1rem", cursor: "pointer",
    letterSpacing: ".04em", marginBottom: 10,
  }),
  input: { width: "100%", border: `2px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", fontSize: "1rem", outline: "none", background: "#faf9f7", boxSizing: "border-box", marginBottom: 12 },
  tag: (bg, color) => ({ display:"inline-block", padding:"3px 11px", borderRadius:20, fontSize:".75rem", fontWeight:700, background:bg, color }),
  row: { display:"flex", justifyContent:"space-between", alignItems:"center" },
};

export default function App() {
  const [homes, setHomes]   = useState(INITIAL_HOMES);
  const [staff, setStaff]   = useState(INITIAL_STAFF);
  const [punches, setPunches] = useState([]); // {id, staffId, date, type, ts, time}
  const [leaves, setLeaves]   = useState([]); // {id, staffId, staffName, start, end, days, reason, type, status, appliedAt}

  const [screen, setScreen] = useState("top"); // top | qrScan | homeSelect | homePick | staffSelect | staffHome | adminPw | adminHome
  const [mode, setMode]     = useState(null);  // "staff" | "admin"
  const [selectedHome, setSelectedHome] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffTab, setStaffTab] = useState("punch"); // punch | leave
  const [adminTab, setAdminTab] = useState("status"); // status | leave | staffMgr | report | settings
  const [reportHome, setReportHome] = useState(INITIAL_HOMES[0]?.id || "");
  const [reportMonth, setReportMonth] = useState(TODAY().slice(0, 7));
  const [reportPunches, setReportPunches] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [pwInput, setPwInput]   = useState("");
  const [pwError, setPwError]   = useState("");
  const [clock, setClock]       = useState("");
  const [dateStr, setDateStr]   = useState("");
  const [feedback, setFeedback] = useState(null);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);
  const [qrStaffId, setQrStaffId] = useState(null);
  const [qrHomeId, setQrHomeId] = useState(null);
  const [scanError, setScanError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanStreamRef = useRef(null);
  const scanFrameRef = useRef(null);

  // スタッフ管理フォーム
  const [newStaffName, setNewStaffName]   = useState("");
  const [newStaffHomes, setNewStaffHomes] = useState([]);
  const [newStaffRole, setNewStaffRole]   = useState("世話人");
  const [editStaffId, setEditStaffId]     = useState(null);

  // 有給申請フォーム
  const [leaveType, setLeaveType]   = useState("全休");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd]     = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // パスワード変更
  const [pwChangeHome, setPwChangeHome]   = useState("");
  const [newPw, setNewPw]                 = useState("");
  const [newAdminPw, setNewAdminPw]       = useState("");
  const [adminPwLocal, setAdminPwLocal]   = useState(ADMIN_PASSWORD);

  function openFromSearch(search) {
    const params = new URLSearchParams(search);
    const staffId = Number(params.get("staff"));
    const homeId = params.get("home");
    if (staffId) {
      const match = staff.find(s => s.id === staffId);
      if (match) {
        setSelectedStaff(match); setStaffTab("punch"); setMode("staff");
        requestNotificationPermission();
        if (match.homeIds.length <= 1) {
          setSelectedHome(homes.find(h => h.id === match.homeIds[0]) || null);
          setScreen("staffHome");
        } else {
          setSelectedHome(null);
          setScreen("homePick");
        }
        return true;
      }
    }
    if (homeId) {
      const match = homes.find(h => h.id === homeId);
      if (match) {
        setSelectedHome(match); setMode("staff"); setScreen("staffSelect");
        requestNotificationPermission();
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    openFromSearch(window.location.search);
  }, []);

  useEffect(() => {
    if (screen !== "qrScan") return;
    setScanError("");
    let cancelled = false;

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        scanStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const tick = () => {
          const video = videoRef.current;
          if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            scanFrameRef.current = requestAnimationFrame(tick);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            let search = "";
            try { search = new URL(code.data).search; }
            catch { search = code.data.includes("?") ? code.data.slice(code.data.indexOf("?")) : ""; }
            if (openFromSearch(search)) return;
            setScanError("認識できるQRコードではありません");
          }
          scanFrameRef.current = requestAnimationFrame(tick);
        };
        scanFrameRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setScanError("カメラを起動できませんでした。ブラウザのカメラ許可を確認してください"));

    return () => {
      cancelled = true;
      if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
      scanStreamRef.current?.getTracks().forEach(t => t.stop());
      scanStreamRef.current = null;
    };
  }, [screen]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      setDateStr(`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（${WEEKDAY[now.getDay()]}）`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(id);
  }, [feedback]);

  useEffect(() => {
    if ((adminTab === "report" || adminTab === "manage") && reportPunches === null) loadReportPunches();
  }, [adminTab]);

  // 今日のスタッフの打刻
  const todayPunches = (staffId) => punches.filter(p => p.staffId === staffId && p.date === TODAY());

  // 現在の状態を判定
  function currentStatus(staffId) {
    const recs = todayPunches(staffId).sort((a,b) => a.ts - b.ts);
    if (!recs.length) return "未出勤";
    const last = recs[recs.length-1];
    if (last.type === "出勤") return "出勤中";
    if (last.type === "休憩開始") return "休憩中";
    if (last.type === "休憩終了") return "出勤中";
    if (last.type === "退勤") return "退勤済";
    return "未出勤";
  }

  function punch(type) {
    if (!selectedStaff) return;
    const now = new Date();
    const rec = { id: Date.now(), staffId: selectedStaff.id, date: TODAY(), type, ts: now.getTime(), time: fmtTimeShort(now), home: selectedHome?.name || "" };
    setPunches(prev => [...prev, rec]);
    setFeedback({ msg: `${type}しました　${fmtTimeShort(now)}`, ok: true });
    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "addPunch", ...rec, staffName: selectedStaff.name }),
    }).catch(() => {});
  }

  function loadReportPunches() {
    setReportLoading(true); setReportError("");
    fetch(GAS_URL)
      .then(r => r.json())
      .then(data => { setReportPunches(data); setReportLoading(false); })
      .catch(() => { setReportError("読み込みに失敗しました。時間をおいて再度お試しください"); setReportLoading(false); });
  }

  function deletePunch(id) {
    if (!window.confirm("この打刻記録を削除しますか？")) return;
    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "deletePunch", id }),
    }).then(() => {
      setReportPunches(prev => prev ? prev.filter(p => String(p.id) !== String(id)) : prev);
      setFeedback({ msg: "削除しました", ok: true });
    }).catch(() => setFeedback({ msg: "削除に失敗しました", ok: false }));
  }

  function downloadReportCSV() {
    if (!reportPunches) return;
    const reportStaff = staff.filter(s => !reportHome || s.homeIds.includes(reportHome));
    const reportHomeName = homes.find(h => h.id === reportHome)?.name;
    const nDays = daysInMonth(reportMonth);
    const [ry, rm] = reportMonth.split("-").map(Number);
    const monthPunches = reportPunches.filter(p => String(p.date).slice(0, 7) === reportMonth);
    const cellFor = (staffId, day) => {
      const dateStr2 = `${reportMonth}-${pad(day)}`;
      const recs = monthPunches.filter(p => String(p.staffId) === String(staffId) && p.date === dateStr2 && (!reportHomeName || p.home === reportHomeName));
      const inRec = recs.find(p => p.type === "出勤");
      const outRec = [...recs].reverse().find(p => p.type === "退勤");
      if (!inRec && !outRec) return "";
      return `${inRec?.time || ""}〜${outRec?.time || ""}`;
    };
    const rows = [["日付", ...reportStaff.map(s => s.name)]];
    for (let d = 1; d <= nDays; d++) {
      const wd = WEEKDAY[new Date(ry, rm - 1, d).getDay()];
      rows.push([`${d}(${wd})`, ...reportStaff.map(s => cellFor(s.id, d))]);
    }
    const csv = "﻿" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `勤怠_${reportHomeName || "全ホーム"}_${reportMonth}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function submitLeave() {
    if (!leaveStart) { setFeedback({ msg: "開始日を入力してください", ok: false }); return; }
    const end = leaveEnd || leaveStart;
    const s = new Date(leaveStart), e = new Date(end);
    const days = leaveType === "半休" ? 0.5 : Math.round((e - s) / 86400000) + 1;
    const rec = {
      id: Date.now(), staffId: selectedStaff.id, staffName: selectedStaff.name,
      homeIds: selectedStaff.homeIds,
      start: leaveStart, end, days, reason: leaveReason || "理由なし",
      type: leaveType, status: "申請中", appliedAt: TODAY(),
    };
    setLeaves(prev => [...prev, rec]);
    setLeaveStart(""); setLeaveEnd(""); setLeaveReason(""); setLeaveType("全休");
    setFeedback({ msg: "有給申請を送信しました", ok: true });
    sendPushNotification("新しい有給申請", `${selectedStaff.name}さんから申請（${leaveStart}〜${end}）が届きました`);
  }

  // ── プッシュ通知 ──
  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  function sendPushNotification(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }

  function approveLeave(id, approved) {
    const target = leaves.find(l => l.id === id);
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: approved ? "承認済" : "却下" } : l));
    if (target) {
      const status = approved ? "承認されました" : "却下されました";
      const title = `有給申請が${status}`;
      const body = `${target.staffName}さんの申請（${target.start}〜${target.end}）が${status}`;
      sendPushNotification(title, body);
    }
  }

  function addStaff() {
    if (!newStaffName.trim() || newStaffHomes.length === 0) { setFeedback({ msg: "氏名と所属ホームを入力してください", ok: false }); return; }
    const colors = ["#a8c4e0","#f4b8c1","#b8d4a8","#f4d4a0","#c4b8e8","#f0c8a0","#a8d4d4"];
    const color = colors[staff.length % colors.length];
    if (editStaffId) {
      setStaff(prev => prev.map(s => s.id === editStaffId ? { ...s, name: newStaffName.trim(), homeIds: newStaffHomes, role: newStaffRole } : s));
      setEditStaffId(null);
    } else {
      setStaff(prev => [...prev, { id: Date.now(), name: newStaffName.trim(), homeIds: newStaffHomes, role: newStaffRole, color }]);
    }
    setNewStaffName(""); setNewStaffHomes([]); setNewStaffRole("世話人");
    setFeedback({ msg: editStaffId ? "スタッフ情報を更新しました" : "スタッフを追加しました", ok: true });
  }

  function toggleNewStaffHome(id) {
    setNewStaffHomes(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  }

  function deleteStaff(id) {
    if (!confirm("このスタッフを削除しますか？")) return;
    setStaff(prev => prev.filter(s => s.id !== id));
  }

  function changeHomePw() {
    if (!pwChangeHome || !newPw.trim()) { setFeedback({ msg: "ホームとパスワードを入力してください", ok: false }); return; }
    setHomes(prev => prev.map(h => h.id === pwChangeHome ? { ...h, password: newPw.trim() } : h));
    setPwChangeHome(""); setNewPw("");
    setFeedback({ msg: "パスワードを変更しました", ok: true });
  }

  function changeAdminPw() {
    if (!newAdminPw.trim()) { setFeedback({ msg: "パスワードを入力してください", ok: false }); return; }
    setAdminPwLocal(newAdminPw.trim()); setNewAdminPw("");
    setFeedback({ msg: "管理者パスワードを変更しました", ok: true });
  }

  // ── レンダリング ──

  // フィードバックバー
  const FeedbackBar = () => feedback ? (
    <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:999, padding:"14px 18px", fontWeight:700, fontSize:".92rem", textAlign:"center",
      background: feedback.ok ? C.olive : C.danger, color:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}>
      {feedback.msg}
    </div>
  ) : null;

  // ── TOP画面 ──
  if (screen === "top") return (
    <div style={{ ...S.page, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:24, background:"#1a2744" }}>
      <FeedbackBar />
      <div style={{ marginBottom:20, textAlign:"center" }}>
        <div style={{ display:"inline-flex", background:"#ffffff", borderRadius:24, padding:"18px 32px", boxShadow:"0 4px 20px rgba(0,0,0,.25)" }}>
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Olive庵" style={{ height:72, width:"auto", display:"block" }} />
        </div>
      </div>
      <div style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:4, color:"#ffffff" }}>勤怠管理</div>
      <div style={{ fontSize:".85rem", color:"rgba(255,255,255,.6)", marginBottom:36 }}>おりーぶ庵株式会社</div>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ background:C.card, borderRadius:16, padding:"20px 18px", boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
          <div style={{ fontWeight:800, marginBottom:12, textAlign:"center" }}>お名前をフルネームで入力してください</div>
          <input type="text" value={pwInput} onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && checkTopName()}
            placeholder="例：山田 花子" style={{ ...S.input, textAlign:"center", fontSize:"1.15rem" }} />
          {pwError && <div style={{ color:C.danger, fontSize:".82rem", marginBottom:10, textAlign:"center" }}>{pwError}</div>}
          <button onClick={checkTopName} style={{ ...S.btn(C.olive, "#fff"), marginBottom:0 }}>開く</button>
        </div>
        <button onClick={() => { setMode("staff"); setPwInput(""); setPwError(""); setScreen("qrScan"); }}
          style={{ background:"none", border:"none", color:"rgba(255,255,255,.7)", fontSize:".85rem", cursor:"pointer", padding:"16px 0 0", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          📷 QRコードで読み取る
        </button>
      </div>
      {/* 管理者ボタン：右上に小さく */}
      <button onClick={() => { setMode("admin"); setScreen("adminPw"); }}
        style={{ position:"fixed", top:14, right:14, background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.25)", borderRadius:8, padding:"6px 12px", color:"rgba(255,255,255,.6)", fontSize:".72rem", fontWeight:600, cursor:"pointer", backdropFilter:"blur(4px)", zIndex:100 }}>
        🔐 管理者
      </button>
    </div>
  );

  // ── QRコード読み取り ──
  if (screen === "qrScan") return (
    <div style={{ ...S.page, background:"#000", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <FeedbackBar />
      <div style={{ padding:"16px 16px 8px" }}>
        <button onClick={() => setScreen("top")} style={{ background:"none", border:"none", color:"#fff", fontSize:".85rem", cursor:"pointer", padding:0 }}>← 戻る</button>
      </div>
      <div style={{ flex:1, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <video ref={videoRef} playsInline muted style={{ width:"100%", maxWidth:420, borderRadius:16, background:"#111" }} />
        <div style={{ position:"absolute", width:"min(70%, 260px)", aspectRatio:"1", border:"3px solid rgba(255,255,255,.7)", borderRadius:16, boxShadow:"0 0 0 999px rgba(0,0,0,.35)" }} />
      </div>
      <canvas ref={canvasRef} style={{ display:"none" }} />
      <div style={{ padding:"12px 24px 32px", textAlign:"center" }}>
        <div style={{ color:"rgba(255,255,255,.75)", fontSize:".85rem", marginBottom:8 }}>ホームまたは個人のQRコードを枠内に映してください</div>
        {scanError && <div style={{ color:"#ff8a8a", fontSize:".85rem" }}>{scanError}</div>}
      </div>
    </div>
  );

  // ── 勤務ホーム選択（複数ホーム兼務者） ──
  if (screen === "homePick" && selectedStaff) {
    const myHomes = homes.filter(h => selectedStaff.homeIds.includes(h.id));
    return (
      <div style={S.page}>
        <FeedbackBar />
        <div style={{ padding:"16px 16px 8px" }}>
          <button onClick={() => setScreen("top")} style={{ background:"none", border:"none", color:C.muted, fontSize:".85rem", cursor:"pointer", padding:0 }}>← 戻る</button>
        </div>
        <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
          <div style={{ fontSize:".8rem", color:C.muted }}>{selectedStaff.name}</div>
          <div style={{ fontWeight:800, fontSize:"1.1rem" }}>今日はどのホームで勤務しますか？</div>
        </div>
        <div style={{ padding:"0 16px 32px" }}>
          {myHomes.map(h => (
            <button key={h.id} onClick={() => { setSelectedHome(h); setScreen("staffHome"); }}
              style={{ ...S.card, width:"100%", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px", marginBottom:10, textAlign:"left" }}>
              <div>
                <div style={{ fontSize:".72rem", color:C.muted, letterSpacing:".1em", marginBottom:2 }}>{h.area}</div>
                <div style={{ fontWeight:800, fontSize:"1.05rem", color:C.olive }}>{h.name}</div>
              </div>
              <span style={{ color:C.border, fontSize:"1.2rem" }}>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ホーム選択 ──
  if (screen === "homeSelect") return (
    <div style={S.page}>
      <FeedbackBar />
      <div style={{ padding:"16px 16px 8px" }}>
        <button onClick={() => setScreen("top")} style={{ background:"none", border:"none", color:C.muted, fontSize:".85rem", cursor:"pointer", padding:0 }}>← 戻る</button>
      </div>
      <div style={{ textAlign:"center", padding:"8px 0 20px", fontWeight:800, fontSize:"1.1rem" }}>ホームを選んでください</div>
      <div style={{ padding:"0 16px 32px" }}>
        {homes.map(h => (
          <button key={h.id} onClick={() => { setSelectedHome(h); setPwInput(""); setPwError(""); setScreen("staffSelect"); }}
            style={{ ...S.card, width:"100%", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px", marginBottom:10, textAlign:"left" }}>
            <div>
              <div style={{ fontSize:".72rem", color:C.muted, letterSpacing:".1em", marginBottom:2 }}>{h.area}</div>
              <div style={{ fontWeight:800, fontSize:"1.05rem", color:C.olive }}>{h.name}</div>
            </div>
            <span style={{ color:C.border, fontSize:"1.2rem" }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  function checkTopName() {
    const norm = str => str.replace(/\s+/g, "");
    const match = staff.find(s => norm(s.name) === norm(pwInput));
    if (!match) { setPwError("該当する名前が見つかりません。登録されているフルネームを入力してください"); return; }
    setPwInput(""); setPwError(""); setSelectedStaff(match); setStaffTab("punch"); setMode("staff");
    requestNotificationPermission();
    if (match.homeIds.length <= 1) {
      setSelectedHome(homes.find(h => h.id === match.homeIds[0]) || null);
      setScreen("staffHome");
    } else {
      setSelectedHome(null);
      setScreen("homePick");
    }
  }

  function checkStaffName() {
    const norm = str => str.replace(/\s+/g, "");
    const match = staff.find(s => norm(s.name) === norm(pwInput));
    if (match) {
      setPwInput(""); setPwError(""); setSelectedStaff(match); setStaffTab("punch"); setScreen("staffHome");
    } else {
      setPwError("該当する名前が見つかりません。登録されているフルネームを入力してください");
    }
  }

  // ── スタッフ選択（氏名入力） ──
  if (screen === "staffSelect") {
    return (
      <div style={S.page}>
        <FeedbackBar />
        <div style={{ padding:"16px 16px 8px" }}>
          <button onClick={() => setScreen("homeSelect")} style={{ background:"none", border:"none", color:C.muted, fontSize:".85rem", cursor:"pointer", padding:0 }}>← 戻る</button>
        </div>
        <div style={{ padding:"8px 24px 0", textAlign:"center" }}>
          <div style={{ fontSize:".8rem", color:C.muted, marginBottom:4 }}>{selectedHome?.name}</div>
          <div style={{ fontWeight:800, fontSize:"1.15rem", marginBottom:28 }}>お名前をフルネームで入力してください</div>
          <input type="text" value={pwInput} onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && checkStaffName()}
            placeholder="例：山田 花子" style={{ ...S.input, textAlign:"center", fontSize:"1.2rem" }} />
          {pwError && <div style={{ color:C.danger, fontSize:".85rem", marginBottom:10 }}>{pwError}</div>}
          <button onClick={checkStaffName} style={S.btn(C.olive, "#fff")}>開く</button>
        </div>
      </div>
    );
  }

  // ── スタッフ打刻・有給画面 ──
  if (screen === "staffHome" && selectedStaff) {
    const recs = todayPunches(selectedStaff.id).sort((a,b) => b.ts - a.ts);
    const status = currentStatus(selectedStaff.id);
    const inRec = recs.find(r => r.type === "出勤");
    const outRec = recs.find(r => r.type === "退勤");
    const myLeaves = leaves.filter(l => l.staffId === selectedStaff.id);
    const remainLeave = 10 - myLeaves.filter(l => l.status === "承認済").reduce((s,l) => s + l.days, 0);

    const canIn    = status === "未出勤";
    const canOut   = status === "出勤中";

    const StatusTag = ({ s }) => {
      const m = { "未出勤":[C.border,"#555"], "出勤中":[C.olivePale2,C.olive], "休憩中":[C.breakPale,C.break], "退勤済":["#e8e8e8","#555"] };
      return <span style={S.tag(m[s]?.[0]||C.border, m[s]?.[1]||"#555")}>{s}</span>;
    };

    return (
      <div style={S.page}>
        <FeedbackBar />
        {/* ヘッダー */}
        <div style={{ padding:"16px 16px 12px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:"50%", background:selectedStaff.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".85rem", color:"#444" }}>
            {initials(selectedStaff.name)}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:"1rem" }}>{selectedStaff.name}</div>
            <div style={{ fontSize:".75rem", color:C.muted }}>{dateStr}</div>
          </div>
        </div>

        {/* タブ */}
        <div style={{ display:"flex", background:C.card, borderBottom:`2px solid ${C.border}`, marginBottom:0 }}>
          {[["punch","打刻"],["leave","有給申請"]].map(([t,l]) => (
            <button key={t} onClick={() => setStaffTab(t)}
              style={{ flex:1, padding:"12px", border:"none", background:"none", fontWeight:700, fontSize:".9rem", cursor:"pointer",
                color: staffTab===t ? C.olive : C.muted,
                borderBottom: staffTab===t ? `3px solid ${C.olive}` : "3px solid transparent", marginBottom:-2 }}>
              {l}
            </button>
          ))}
        </div>

        {/* 打刻タブ */}
        {staffTab === "punch" && (
          <div style={{ padding:"12px 16px 32px" }}>
            {/* 時計 */}
            <div style={{ borderRadius:16, padding:"22px 16px", marginBottom:12, textAlign:"center",
              background:"linear-gradient(135deg, #1f5c66, #2f90a8)", color:"#fff", boxShadow:"0 4px 16px rgba(31,92,102,.3)" }}>
              <div style={{ fontSize:".85rem", opacity:.85, marginBottom:6 }}>{dateStr}</div>
              <div style={{ fontSize:"2.3rem", fontWeight:700, letterSpacing:".04em", fontVariantNumeric:"tabular-nums" }}>{clock}</div>
            </div>

            {/* 状態カード */}
            <div style={S.card}>
              <div style={{ ...S.row, marginBottom:10 }}>
                <span style={{ fontSize:".82rem", color:C.muted }}>現在の状態</span>
                <StatusTag s={status} />
              </div>
              <div style={{ ...S.row, marginBottom:6 }}>
                <span style={{ fontSize:".82rem", color:C.muted }}>出勤時刻</span>
                <span style={{ fontWeight:700 }}>{inRec?.time || "-"}</span>
              </div>
              <div style={S.row}>
                <span style={{ fontSize:".82rem", color:C.muted }}>退勤時刻</span>
                <span style={{ fontWeight:700 }}>{outRec?.time || "-"}</span>
              </div>
            </div>

            {/* 打刻ボタン */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
              {[
                ["出勤", "🕐", canIn,  C.olive],
                ["退勤", "🚶", canOut, C.danger],
              ].map(([label, icon, enabled, color]) => (
                <button key={label} onClick={() => enabled && punch(label)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"20px 10px", borderRadius:14,
                    border:`1px solid ${enabled ? color+"33" : C.border}`, background:C.card,
                    color: enabled ? color : "#bbb", cursor: enabled ? "pointer":"not-allowed",
                    opacity: enabled ? 1 : 0.5, boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                  <span style={{ fontSize:"1.7rem", lineHeight:1 }}>{icon}</span>
                  <span style={{ fontWeight:800, fontSize:".95rem" }}>{label}</span>
                </button>
              ))}
            </div>

            {/* 本日の記録 */}
            <div style={{ ...S.card, marginTop:4 }}>
              <div style={{ fontWeight:700, fontSize:".85rem", color:C.muted, marginBottom:10 }}>本日の記録</div>
              {recs.length === 0
                ? <div style={{ color:C.muted, fontSize:".85rem" }}>まだ打刻がありません</div>
                : recs.map(r => (
                  <div key={r.id} style={{ ...S.row, marginBottom:8 }}>
                    <span style={S.tag(
                      r.type==="出勤"?C.olivePale2:r.type==="退勤"?"#e8e8e8":r.type==="休憩開始"?C.breakPale:C.warnPale,
                      r.type==="出勤"?C.olive:r.type==="退勤"?"#555":r.type==="休憩開始"?C.break:C.warn
                    )}>{r.type}</span>
                    <span style={{ fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{r.time}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* 有給申請タブ */}
        {staffTab === "leave" && (
          <div style={{ padding:"12px 16px 32px" }}>
            {/* 残日数 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
              <div style={S.card}>
                <div style={{ fontSize:".78rem", color:C.muted, marginBottom:4 }}>有給残日数</div>
                <div style={{ fontWeight:800, fontSize:"1.6rem" }}>{remainLeave}<span style={{ fontSize:".85rem", fontWeight:400 }}>日</span></div>
              </div>
              <div style={S.card}>
                <div style={{ fontSize:".78rem", color:C.muted, marginBottom:4 }}>申請中</div>
                <div style={{ fontWeight:800, fontSize:"1.6rem" }}>{myLeaves.filter(l=>l.status==="申請中").length}</div>
              </div>
            </div>

            {/* 新規申請 */}
            <div style={S.card}>
              <div style={{ fontWeight:700, marginBottom:14 }}>新規申請</div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>種別</div>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {["全休","半休"].map(t => (
                  <button key={t} onClick={() => setLeaveType(t)}
                    style={{ flex:1, padding:"11px", borderRadius:10, border:`2px solid ${leaveType===t?C.olive:C.border}`,
                      background: leaveType===t?"#fff":"#faf9f7", color: leaveType===t?C.olive:C.muted, fontWeight:700, cursor:"pointer" }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>開始日</div>
              <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} style={S.input} />
              {leaveType === "全休" && <>
                <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>終了日</div>
                <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} style={S.input} />
              </>}
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>理由（任意）</div>
              <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)}
                placeholder="例：私用のため" rows={3}
                style={{ ...S.input, resize:"none", fontFamily:"inherit", marginBottom:14 }} />
              <button onClick={() => { requestNotificationPermission(); submitLeave(); }} style={S.btn(C.olive, "#fff")}>申請する</button>
            </div>

            {/* 申請履歴 */}
            <div style={{ fontWeight:700, fontSize:".9rem", marginBottom:8 }}>申請履歴</div>
            {myLeaves.length === 0
              ? <div style={{ color:C.muted, fontSize:".85rem" }}>申請履歴はありません</div>
              : [...myLeaves].reverse().map(l => (
                <div key={l.id} style={S.card}>
                  <div style={S.row}>
                    <div>
                      <div style={{ fontWeight:700 }}>{l.start}　{l.start !== l.end ? `〜 ${l.end}` : ""}</div>
                      <div style={{ fontSize:".78rem", color:C.muted, marginTop:3 }}>{l.reason}・{l.days}日分</div>
                    </div>
                    <span style={S.tag(
                      l.status==="承認済"?C.olivePale2:l.status==="却下"?C.dangerPale:C.warnPale,
                      l.status==="承認済"?C.olive:l.status==="却下"?C.danger:C.warn
                    )}>{l.status}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    );
  }

  // ── 管理者パスワード ──
  if (screen === "adminPw") return (
    <div style={S.page}>
      <FeedbackBar />
      <div style={{ padding:"16px 16px 8px" }}>
        <button onClick={() => setScreen("top")} style={{ background:"none", border:"none", color:C.muted, fontSize:".85rem", cursor:"pointer", padding:0 }}>← 戻る</button>
      </div>
      <div style={{ padding:"16px 24px 0", textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:"1.15rem", marginBottom:4 }}>管理者ログイン</div>
        <div style={{ color:C.muted, fontSize:".85rem", marginBottom:28 }}>管理者パスワードを入力してください</div>
        <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && checkAdminPw()}
          placeholder="パスワード" style={{ ...S.input, textAlign:"center", fontSize:"1.2rem", letterSpacing:".2em" }} />
        {pwError && <div style={{ color:C.danger, fontSize:".85rem", marginBottom:10 }}>{pwError}</div>}
        <button onClick={checkAdminPw} style={S.btn("#5560a0","#fff")}>ログイン</button>
      </div>
    </div>
  );

  function checkAdminPw() {
    if (pwInput === adminPwLocal) {
      setPwInput(""); setPwError(""); setAdminTab("status"); setScreen("adminHome");
      requestNotificationPermission();
    } else setPwError("パスワードが違います");
  }

  // ── 管理者ホーム ──
  if (screen === "adminHome") {
    const todayStaff = staff.map(s => ({ ...s, status: currentStatus(s.id), home: s.homeIds.map(id => homes.find(h => h.id === id)?.name).filter(Boolean).join("・") }));
    const pendingLeaves = leaves.filter(l => l.status === "申請中");
    const doneLeaves    = leaves.filter(l => l.status !== "申請中");
    const newLeaveNotifs = pendingLeaves.filter(l => !dismissedNotifIds.includes(l.id));

    return (
      <div style={S.page}>
        <FeedbackBar />

        {/* 有給申請 チャット風通知 */}
        {newLeaveNotifs.length > 0 && (
          <div style={{ position:"fixed", bottom:16, right:16, zIndex:998, display:"flex", flexDirection:"column", gap:10, width:"min(320px, calc(100vw - 32px))" }}>
            {newLeaveNotifs.map(l => (
              <div key={l.id} style={{ background:C.card, borderRadius:"16px 16px 4px 16px", boxShadow:"0 6px 20px rgba(0,0,0,.18)", padding:"14px 14px 12px", border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:staff.find(s=>s.id===l.staffId)?.color || C.olivePale2, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".72rem", color:"#444", flexShrink:0 }}>
                    {initials(l.staffName)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:".85rem" }}>{l.staffName}</div>
                    <div style={{ fontSize:".68rem", color:C.muted }}>有給申請</div>
                  </div>
                  <button onClick={() => setDismissedNotifIds(prev => [...prev, l.id])}
                    style={{ background:"none", border:"none", color:C.muted, fontSize:"1rem", cursor:"pointer", padding:2, lineHeight:1 }}>×</button>
                </div>
                <div style={{ fontSize:".85rem", fontWeight:600, marginBottom:2 }}>{l.start}{l.start!==l.end?`〜 ${l.end}`:""}（{l.type}・{l.days}日分）</div>
                <div style={{ fontSize:".78rem", color:C.muted, marginBottom:12 }}>{l.reason}</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { approveLeave(l.id, true); setDismissedNotifIds(prev => [...prev, l.id]); }}
                    style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:C.olivePale2, color:C.olive, fontWeight:700, fontSize:".82rem", cursor:"pointer" }}>承認</button>
                  <button onClick={() => { approveLeave(l.id, false); setDismissedNotifIds(prev => [...prev, l.id]); }}
                    style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:C.dangerPale, color:C.danger, fontWeight:700, fontSize:".82rem", cursor:"pointer" }}>却下</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ヘッダー */}
        <div style={{ padding:"14px 16px 10px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:"1.05rem" }}>管理者画面</div>
            <div style={{ fontSize:".75rem", color:C.muted }}>おりーぶ庵株式会社</div>
          </div>
          <button onClick={() => { setScreen("top"); setPwInput(""); }}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:".8rem", color:C.muted, cursor:"pointer" }}>
            ログアウト
          </button>
        </div>

        {/* タブ */}
        <div style={{ display:"flex", background:C.card, borderBottom:`2px solid ${C.border}`, overflowX:"auto" }}>
          {[["status","勤怠状況"],["leave","有給承認"],["staffMgr","スタッフ管理"],["report","月次集計"],["manage","データ管理"],["settings","設定"]].map(([t,l]) => (
            <button key={t} onClick={() => setAdminTab(t)}
              style={{ flex:1, padding:"12px 8px", border:"none", background:"none", fontWeight:700, fontSize:".82rem", cursor:"pointer", whiteSpace:"nowrap",
                color: adminTab===t ? "#5560a0" : C.muted,
                borderBottom: adminTab===t ? `3px solid #5560a0` : "3px solid transparent", marginBottom:-2 }}>
              {l}{t==="leave" && pendingLeaves.length > 0 ? ` (${pendingLeaves.length})` : ""}
            </button>
          ))}
        </div>

        {/* 勤怠状況タブ */}
        {adminTab === "status" && (
          <div style={{ padding:"12px 16px 32px" }}>
            {/* カウント */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:4 }}>
              {[["出勤中",C.olive],["休憩中",C.break],["退勤済","#666"]].map(([s,col]) => (
                <div key={s} style={{ ...S.card, textAlign:"center", padding:"14px 8px" }}>
                  <div style={{ fontSize:".72rem", color:C.muted, marginBottom:4 }}>{s}</div>
                  <div style={{ fontWeight:800, fontSize:"1.6rem", color:col }}>{todayStaff.filter(st=>st.status===s).length}</div>
                </div>
              ))}
            </div>

            <div style={{ fontWeight:700, fontSize:".9rem", marginBottom:8 }}>本日の従業員状況</div>
            {todayStaff.map(s => {
              const recs = todayPunches(s.id);
              const inR = [...recs].sort((a,b)=>a.ts-b.ts).find(r=>r.type==="出勤");
              const workMin = calcWorkMin(recs);
              const statusColor = { "出勤中":C.olive,"休憩中":C.break,"退勤済":"#666","未出勤":C.muted };
              return (
                <div key={s.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:12, padding:"14px 14px" }}>
                  <div style={{ width:42, height:42, borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".85rem", color:"#444", flexShrink:0 }}>
                    {initials(s.name)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700 }}>{s.name}</div>
                    <div style={{ fontSize:".75rem", color:C.muted }}>{s.home}　出勤 {inR?.time || "-"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={S.tag(s.status==="出勤中"?C.olivePale2:s.status==="休憩中"?C.breakPale:"#eee", statusColor[s.status]||C.muted)}>{s.status}</span>
                    <div style={{ fontSize:".75rem", color:C.muted, marginTop:4 }}>{workMin>0?fmtWorkTime(workMin):"-"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 有給承認タブ */}
        {adminTab === "leave" && (
          <div style={{ padding:"12px 16px 32px" }}>
            <div style={{ fontWeight:700, marginBottom:10 }}>承認待ち</div>
            {pendingLeaves.length === 0
              ? <div style={{ ...S.card, textAlign:"center", color:C.muted, padding:24 }}>承認待ちの申請はありません</div>
              : pendingLeaves.map(l => (
                <div key={l.id} style={S.card}>
                  <div style={{ fontWeight:700, marginBottom:4 }}>{l.staffName}</div>
                  <div style={{ fontSize:".88rem", fontWeight:600, marginBottom:2 }}>{l.start}　{l.start!==l.end?`〜 ${l.end}`:""}</div>
                  <div style={{ fontSize:".78rem", color:C.muted, marginBottom:12 }}>{l.reason}・{l.days}日分</div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={() => approveLeave(l.id, true)}
                      style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:C.olivePale2, color:C.olive, fontWeight:700, cursor:"pointer" }}>
                      承認
                    </button>
                    <button onClick={() => approveLeave(l.id, false)}
                      style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:C.dangerPale, color:C.danger, fontWeight:700, cursor:"pointer" }}>
                      却下
                    </button>
                  </div>
                </div>
              ))
            }
            {doneLeaves.length > 0 && <>
              <div style={{ fontWeight:700, marginBottom:10, marginTop:8 }}>処理済み（{doneLeaves.length}件）</div>
              {doneLeaves.map(l => (
                <div key={l.id} style={S.card}>
                  <div style={S.row}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:".9rem" }}>{l.staffName}</div>
                      <div style={{ fontWeight:600, fontSize:".85rem" }}>{l.start}　{l.start!==l.end?`〜 ${l.end}`:""}</div>
                      <div style={{ fontSize:".75rem", color:C.muted }}>{l.reason}・{l.days}日分</div>
                    </div>
                    <span style={S.tag(l.status==="承認済"?C.olivePale2:C.dangerPale, l.status==="承認済"?C.olive:C.danger)}>{l.status}</span>
                  </div>
                </div>
              ))}
            </>}
          </div>
        )}

        {/* スタッフ管理タブ */}
        {adminTab === "staffMgr" && (
          <div style={{ padding:"12px 16px 32px" }}>
            <div style={S.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>{editStaffId ? "スタッフ編集" : "スタッフ追加"}</div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>氏名</div>
              <input value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} placeholder="例：山田 花子" style={S.input} />
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>所属ホーム（複数選択可）</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {homes.map(h => (
                  <button key={h.id} type="button" onClick={()=>toggleNewStaffHome(h.id)}
                    style={{ padding:"8px 14px", borderRadius:20, border:`2px solid ${newStaffHomes.includes(h.id)?C.olive:C.border}`,
                      background: newStaffHomes.includes(h.id)?C.olivePale:"#faf9f7", color: newStaffHomes.includes(h.id)?C.olive:C.muted,
                      fontWeight:700, fontSize:".82rem", cursor:"pointer" }}>
                    {h.name}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>役職</div>
              <select value={newStaffRole} onChange={e=>setNewStaffRole(e.target.value)} style={{ ...S.input, marginBottom:14 }}>
                {ROLES.map(r=><option key={r}>{r}</option>)}
              </select>
              <button onClick={addStaff} style={S.btn(C.olive,"#fff")}>{editStaffId?"更新する":"追加する"}</button>
              {editStaffId && <button onClick={()=>{setEditStaffId(null);setNewStaffName("");setNewStaffHomes([]);setNewStaffRole("世話人");}}
                style={S.btn("#fff",C.muted,`2px solid ${C.border}`)}>キャンセル</button>}
            </div>
            <div style={{ fontWeight:700, fontSize:".9rem", marginBottom:8 }}>登録スタッフ一覧</div>
            {staff.map(s => {
              const qrUrl = `${window.location.origin}${window.location.pathname}?staff=${s.id}`;
              return (
              <div key={s.id} style={S.card}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".82rem", color:"#444", flexShrink:0 }}>
                    {initials(s.name)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:".92rem" }}>{s.name}</div>
                    <div style={{ fontSize:".73rem", color:C.muted }}>{s.homeIds.map(id=>homes.find(h=>h.id===id)?.name).filter(Boolean).join("・")}　{s.role}</div>
                  </div>
                  <button onClick={()=>setQrStaffId(qrStaffId===s.id?null:s.id)}
                    style={{ background:C.olivePale, border:"none", borderRadius:8, padding:"6px 12px", color:C.olive, fontWeight:700, fontSize:".78rem", cursor:"pointer", marginRight:6 }}>QR</button>
                  <button onClick={()=>{setEditStaffId(s.id);setNewStaffName(s.name);setNewStaffHomes(s.homeIds);setNewStaffRole(s.role);setAdminTab("staffMgr");window.scrollTo(0,0);}}
                    style={{ background:C.bluePale, border:"none", borderRadius:8, padding:"6px 12px", color:C.blue, fontWeight:700, fontSize:".78rem", cursor:"pointer", marginRight:6 }}>編集</button>
                  <button onClick={()=>deleteStaff(s.id)}
                    style={{ background:C.dangerPale, border:"none", borderRadius:8, padding:"6px 12px", color:C.danger, fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>削除</button>
                </div>
                {qrStaffId === s.id && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}`, textAlign:"center" }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                      alt={`${s.name}の打刻QRコード`} style={{ width:180, height:180, borderRadius:8 }} />
                    <div style={{ fontSize:".72rem", color:C.muted, marginTop:8, wordBreak:"break-all" }}>{qrUrl}</div>
                    <button onClick={()=>{ navigator.clipboard?.writeText(qrUrl); setFeedback({ msg:"リンクをコピーしました", ok:true }); }}
                      style={{ marginTop:10, background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", color:C.muted, fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>リンクをコピー</button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* 月次集計タブ */}
        {adminTab === "report" && (
          <div style={{ padding:"12px 16px 32px" }}>
            <div style={S.card}>
              <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                <select value={reportHome} onChange={e=>setReportHome(e.target.value)} style={{ ...S.input, marginBottom:0, flex:1, minWidth:130 }}>
                  <option value="">全ホーム</option>
                  {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <input type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} style={{ ...S.input, marginBottom:0, flex:1, minWidth:130 }} />
                <button onClick={loadReportPunches} disabled={reportLoading}
                  style={{ ...S.btn(C.olive, "#fff"), marginBottom:0, width:"auto", padding:"0 20px", opacity:reportLoading?.6:1 }}>
                  {reportLoading ? "読み込み中..." : "更新"}
                </button>
                <button onClick={downloadReportCSV} disabled={!reportPunches}
                  style={{ ...S.btn("#fff", C.olive, `2px solid ${C.olive}`), marginBottom:0, width:"auto", padding:"0 20px", opacity:reportPunches?1:.5 }}>
                  CSVダウンロード
                </button>
              </div>

              {reportError && <div style={{ color:C.danger, fontSize:".85rem", textAlign:"center", padding:"12px 0" }}>{reportError}</div>}

              {!reportError && reportPunches && (() => {
                const reportStaff = staff.filter(s => !reportHome || s.homeIds.includes(reportHome));
                const reportHomeName = homes.find(h => h.id === reportHome)?.name;
                const nDays = daysInMonth(reportMonth);
                const days = Array.from({ length: nDays }, (_, i) => i + 1);
                const [ry, rm] = reportMonth.split("-").map(Number);
                const monthPunches = reportPunches.filter(p => String(p.date).slice(0, 7) === reportMonth);
                const cellFor = (staffId, day) => {
                  const dateStr2 = `${reportMonth}-${pad(day)}`;
                  const recs = monthPunches.filter(p => String(p.staffId) === String(staffId) && p.date === dateStr2 && (!reportHomeName || p.home === reportHomeName));
                  const inRec = recs.find(p => p.type === "出勤");
                  const outRec = [...recs].reverse().find(p => p.type === "退勤");
                  if (!inRec && !outRec) return "-";
                  return `${inRec?.time || "-"}〜${outRec?.time || "-"}`;
                };
                return (
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ borderCollapse:"collapse", fontSize:".72rem", whiteSpace:"nowrap" }}>
                      <thead>
                        <tr>
                          <th style={{ position:"sticky", left:0, background:C.card, padding:"6px 10px", textAlign:"left", borderBottom:`2px solid ${C.border}` }}>日付</th>
                          {reportStaff.map(s => (
                            <th key={s.id} style={{ padding:"6px 8px", borderBottom:`2px solid ${C.border}`, fontWeight:700, color:C.muted }}>{s.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {days.map(d => {
                          const wd = WEEKDAY[new Date(ry, rm - 1, d).getDay()];
                          return (
                            <tr key={d}>
                              <td style={{ position:"sticky", left:0, background:C.card, padding:"6px 10px", fontWeight:700, borderBottom:`1px solid ${C.border}`,
                                color: wd==="日"?C.danger:wd==="土"?C.blue:C.text }}>{d}　{wd}</td>
                              {reportStaff.map(s => (
                                <td key={s.id} style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}`, textAlign:"center", color:C.muted }}>{cellFor(s.id, d)}</td>
                              ))}
                            </tr>
                          );
                        })}
                        {reportStaff.length === 0 && (
                          <tr><td colSpan={1} style={{ padding:20, textAlign:"center", color:C.muted }}>該当するスタッフがいません</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* データ管理タブ */}
        {adminTab === "manage" && (
          <div style={{ padding:"12px 16px 32px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:".9rem" }}>打刻記録一覧{reportPunches ? `（${reportPunches.length}件）` : ""}</div>
              <button onClick={loadReportPunches} disabled={reportLoading}
                style={{ ...S.btn(C.olive, "#fff"), marginBottom:0, width:"auto", padding:"6px 16px", fontSize:".8rem", opacity:reportLoading?.6:1 }}>
                {reportLoading ? "読み込み中..." : "更新"}
              </button>
            </div>

            {reportError && <div style={{ color:C.danger, fontSize:".85rem", textAlign:"center", padding:"12px 0" }}>{reportError}</div>}

            {!reportError && reportPunches && (
              [...reportPunches].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map(p => (
                <div key={p.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <span style={S.tag(p.type==="出勤"?C.olivePale2:"#e8e8e8", p.type==="出勤"?C.olive:"#555")}>{p.type}</span>
                      <span style={{ fontWeight:700 }}>{p.staffName}</span>
                    </div>
                    <div style={{ fontSize:".78rem", color:C.muted }}>{p.date}　{p.time}　{p.home || "（ホーム未記録）"}</div>
                  </div>
                  <button onClick={() => deletePunch(p.id)}
                    style={{ background:C.dangerPale, border:"none", borderRadius:8, padding:"6px 12px", color:C.danger, fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>削除</button>
                </div>
              ))
            )}
            {!reportError && reportPunches && reportPunches.length === 0 && (
              <div style={{ textAlign:"center", color:C.muted, padding:24 }}>打刻記録はありません</div>
            )}
          </div>
        )}

        {/* 設定タブ */}
        {adminTab === "settings" && (
          <div style={{ padding:"12px 16px 32px" }}>
            <div style={S.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>ホームQRコード</div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:14 }}>各ホームの入口に掲示すると、スタッフはスマホでQRコードを読み取るだけでそのホームの名前選択画面を直接開けます。</div>
              {homes.map(h => {
                const qrUrl = `${window.location.origin}${window.location.pathname}?home=${h.id}`;
                return (
                  <div key={h.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontWeight:700, fontSize:".92rem" }}>{h.name}</span>
                      <button onClick={()=>setQrHomeId(qrHomeId===h.id?null:h.id)}
                        style={{ background:C.olivePale, border:"none", borderRadius:8, padding:"6px 12px", color:C.olive, fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>QR</button>
                    </div>
                    {qrHomeId === h.id && (
                      <div style={{ marginTop:12, textAlign:"center" }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                          alt={`${h.name}のQRコード`} style={{ width:180, height:180, borderRadius:8 }} />
                        <div style={{ fontSize:".72rem", color:C.muted, marginTop:8, wordBreak:"break-all" }}>{qrUrl}</div>
                        <button onClick={()=>{ navigator.clipboard?.writeText(qrUrl); setFeedback({ msg:"リンクをコピーしました", ok:true }); }}
                          style={{ marginTop:10, background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", color:C.muted, fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>リンクをコピー</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>ホームパスワード変更</div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>ホームを選択</div>
              <select value={pwChangeHome} onChange={e=>setPwChangeHome(e.target.value)} style={{ ...S.input, marginBottom:12 }}>
                <option value="">選択してください</option>
                {homes.map(h => <option key={h.id} value={h.id}>{h.name}（現在: {h.password}）</option>)}
              </select>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>新しいパスワード</div>
              <input value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="新しいパスワード" style={S.input} />
              <button onClick={changeHomePw} style={S.btn(C.olive,"#fff")}>変更する</button>
            </div>
            <div style={S.card}>
              <div style={{ fontWeight:700, marginBottom:12 }}>管理者パスワード変更</div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>新しい管理者パスワード</div>
              <input value={newAdminPw} onChange={e=>setNewAdminPw(e.target.value)} placeholder="新しい管理者パスワード" style={S.input} />
              <button onClick={changeAdminPw} style={S.btn("#5560a0","#fff")}>変更する</button>
            </div>
            <div style={S.card}>
              <div style={{ fontWeight:700, marginBottom:8 }}>現在のホームパスワード一覧</div>
              {homes.map(h => (
                <div key={h.id} style={{ ...S.row, marginBottom:8, fontSize:".88rem" }}>
                  <span style={{ color:C.muted }}>{h.name}</span>
                  <span style={{ fontWeight:700, fontFamily:"monospace" }}>{h.password}</span>
                </div>
              ))}
              <div style={{ ...S.row, marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}`, fontSize:".88rem" }}>
                <span style={{ color:C.muted }}>管理者パスワード</span>
                <span style={{ fontWeight:700, fontFamily:"monospace" }}>{adminPwLocal}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
