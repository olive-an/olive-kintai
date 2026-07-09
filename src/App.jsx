import { useState, useEffect, useRef } from "react";

// ── 初期データ ──
const INITIAL_HOMES = [
  { id: "nishikujo",    name: "西九条ホーム",   area: "此花区",   password: "nishi1" },
  { id: "kujo",         name: "九条ホーム",     area: "西区",     password: "kujo2" },
  { id: "torishima",   name: "酉島ホーム",     area: "此花区",   password: "tori3" },
  { id: "shinkoriyama",name: "新郡山ホーム",   area: "茨木市",   password: "shin4" },
  { id: "kasugade",    name: "春日出ホーム",   area: "此花区",   password: "kasu5" },
  { id: "dekijima",    name: "出来島ホーム",   area: "西淀川区", password: "deki6" },
  { id: "honsha",      name: "本社",           area: "西淀川区", password: "olive0" },
];

const ADMIN_PASSWORD = "admin2026";

const INITIAL_STAFF = [
  { id: 1, name: "田中 健一",  homeId: "nishikujo",    role: "世話人",       color: "#a8c4e0" },
  { id: 2, name: "鈴木 花子",  homeId: "kujo",         role: "生活支援員",   color: "#f4b8c1" },
  { id: 3, name: "佐藤 隆",    homeId: "torishima",   role: "世話人",       color: "#b8d4a8" },
  { id: 4, name: "中村 美咲",  homeId: "kasugade",    role: "生活支援員",   color: "#f4d4a0" },
  { id: 5, name: "高橋 浩二",  homeId: "dekijima",    role: "管理者",       color: "#c4b8e8" },
];

// ── ユーティリティ ──
const pad = n => String(n).padStart(2, "0");
const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtTimeShort = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const WEEKDAY = ["日","月","火","水","木","金","土"];
const TODAY = () => fmtDate(new Date());

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

  const [screen, setScreen] = useState("top"); // top | homeSelect | pwEntry | staffHome | adminPw | adminHome
  const [mode, setMode]     = useState(null);  // "staff" | "admin"
  const [selectedHome, setSelectedHome] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffTab, setStaffTab] = useState("punch"); // punch | leave
  const [adminTab, setAdminTab] = useState("status"); // status | leave | staffMgr | settings

  const [pwInput, setPwInput]   = useState("");
  const [pwError, setPwError]   = useState("");
  const [clock, setClock]       = useState("");
  const [dateStr, setDateStr]   = useState("");
  const [feedback, setFeedback] = useState(null);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);

  // スタッフ管理フォーム
  const [newStaffName, setNewStaffName]   = useState("");
  const [newStaffHome, setNewStaffHome]   = useState("");
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
    const rec = { id: Date.now(), staffId: selectedStaff.id, date: TODAY(), type, ts: now.getTime(), time: fmtTimeShort(now) };
    setPunches(prev => [...prev, rec]);
    setFeedback({ msg: `${type}しました　${fmtTimeShort(now)}`, ok: true });
  }

  function submitLeave() {
    if (!leaveStart) { setFeedback({ msg: "開始日を入力してください", ok: false }); return; }
    const end = leaveEnd || leaveStart;
    const s = new Date(leaveStart), e = new Date(end);
    const days = leaveType === "半休" ? 0.5 : Math.round((e - s) / 86400000) + 1;
    const rec = {
      id: Date.now(), staffId: selectedStaff.id, staffName: selectedStaff.name,
      homeId: selectedStaff.homeId,
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
    if (!newStaffName.trim() || !newStaffHome) { setFeedback({ msg: "氏名と所属ホームを入力してください", ok: false }); return; }
    const colors = ["#a8c4e0","#f4b8c1","#b8d4a8","#f4d4a0","#c4b8e8","#f0c8a0","#a8d4d4"];
    const color = colors[staff.length % colors.length];
    if (editStaffId) {
      setStaff(prev => prev.map(s => s.id === editStaffId ? { ...s, name: newStaffName.trim(), homeId: newStaffHome, role: newStaffRole } : s));
      setEditStaffId(null);
    } else {
      setStaff(prev => [...prev, { id: Date.now(), name: newStaffName.trim(), homeId: newStaffHome, role: newStaffRole, color }]);
    }
    setNewStaffName(""); setNewStaffHome(""); setNewStaffRole("世話人");
    setFeedback({ msg: editStaffId ? "スタッフ情報を更新しました" : "スタッフを追加しました", ok: true });
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
        <div style={{ display:"inline-flex", alignItems:"baseline", gap:0, background:"#ffffff", borderRadius:24, padding:"12px 28px 12px 20px", boxShadow:"0 4px 20px rgba(0,0,0,.25)" }}>
          <span style={{ fontSize:"2.6rem", fontWeight:900, color:"#6abf3a", lineHeight:1 }}>O</span>
          <span style={{ fontSize:"2.6rem", fontWeight:900, color:"#3ab8c8", lineHeight:1 }}>l</span>
          <span style={{ fontSize:"2.6rem", fontWeight:900, color:"#e83a8c", lineHeight:1 }}>i</span>
          <span style={{ fontSize:"2.6rem", fontWeight:900, color:"#e87820", lineHeight:1 }}>v</span>
          <span style={{ fontSize:"2.6rem", fontWeight:900, color:"#b05a20", lineHeight:1 }}>e</span>
          <span style={{ fontSize:"1.2rem", fontWeight:900, color:"#b05a20", lineHeight:1, marginLeft:2 }}>庵</span>
        </div>
      </div>
      <div style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:4, color:"#ffffff" }}>勤怠管理</div>
      <div style={{ fontSize:".85rem", color:"rgba(255,255,255,.6)", marginBottom:36 }}>おりーぶ庵株式会社</div>
      <div style={{ width:"100%", maxWidth:380 }}>
        <button onClick={() => { setMode("staff"); setScreen("homeSelect"); requestNotificationPermission(); }}
          style={{ ...S.btn(C.card, C.olive, `2px solid ${C.olive}`), marginBottom:0, display:"flex", alignItems:"center", gap:12, padding:"18px 20px" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:C.olivePale, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>👤</div>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontWeight:800, color:C.olive }}>従業員モード</div>
            <div style={{ fontSize:".78rem", color:C.muted, fontWeight:400, marginTop:2 }}>打刻・有給申請はこちら</div>
          </div>
        </button>
      </div>
      {/* 管理者ボタン：右上に小さく */}
      <button onClick={() => { setMode("admin"); setScreen("adminPw"); }}
        style={{ position:"fixed", top:14, right:14, background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.25)", borderRadius:8, padding:"6px 12px", color:"rgba(255,255,255,.6)", fontSize:".72rem", fontWeight:600, cursor:"pointer", backdropFilter:"blur(4px)", zIndex:100 }}>
        🔐 管理者
      </button>
    </div>
  );

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
          <button key={h.id} onClick={() => { setSelectedHome(h); setPwInput(""); setPwError(""); setScreen("pwEntry"); }}
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

  // ── 名前入力 ──
  if (screen === "pwEntry") return (
    <div style={S.page}>
      <FeedbackBar />
      <div style={{ padding:"16px 16px 8px" }}>
        <button onClick={() => setScreen("homeSelect")} style={{ background:"none", border:"none", color:C.muted, fontSize:".85rem", cursor:"pointer", padding:0 }}>← 戻る</button>
      </div>
      <div style={{ padding:"8px 24px 0", textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:"1.15rem", marginBottom:4 }}>{selectedHome?.name}</div>
        <div style={{ color:C.muted, fontSize:".85rem", marginBottom:28 }}>お名前をフルネームで入力してください</div>
        <input type="text" value={pwInput} onChange={e => setPwInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && checkName()}
          placeholder="例：山田 花子" style={{ ...S.input, textAlign:"center", fontSize:"1.2rem" }} />
        {pwError && <div style={{ color:C.danger, fontSize:".85rem", marginBottom:10 }}>{pwError}</div>}
        <button onClick={checkName} style={S.btn(C.olive, "#fff")}>開く</button>
      </div>
    </div>
  );

  function checkName() {
    const homeStaff = staff.filter(s => s.homeId === selectedHome?.id);
    const norm = str => str.replace(/\s+/g, "");
    const match = homeStaff.find(s => norm(s.name) === norm(pwInput));
    if (match) {
      setPwInput(""); setPwError(""); setSelectedStaff(match); setStaffTab("punch"); setScreen("staffHome");
    } else {
      setPwError("該当する名前が見つかりません。登録されているフルネームを入力してください");
    }
  }

  // ── スタッフ打刻・有給画面 ──
  if (screen === "staffHome" && selectedStaff) {
    const recs = todayPunches(selectedStaff.id).sort((a,b) => b.ts - a.ts);
    const status = currentStatus(selectedStaff.id);
    const workMin = calcWorkMin(todayPunches(selectedStaff.id));
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
        <div style={{ padding:"16px 16px 12px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:selectedStaff.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".85rem", color:"#444" }}>
              {initials(selectedStaff.name)}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:"1rem" }}>{selectedStaff.name}</div>
              <div style={{ fontSize:".75rem", color:C.muted }}>{dateStr}</div>
            </div>
          </div>
          <button onClick={() => { setSelectedStaff(null); setPwInput(""); setPwError(""); setScreen("pwEntry"); }}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:".8rem", color:C.muted, cursor:"pointer" }}>
            ログアウト
          </button>
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
            <div style={{ ...S.card, textAlign:"center", padding:"20px 16px" }}>
              <div style={{ fontSize:"2.4rem", fontWeight:200, letterSpacing:".1em", fontVariantNumeric:"tabular-nums" }}>{clock}</div>
              <div style={{ fontSize:".82rem", color:C.muted, marginTop:4 }}>{dateStr}</div>
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
              <div style={{ ...S.row, marginBottom:6 }}>
                <span style={{ fontSize:".82rem", color:C.muted }}>退勤時刻</span>
                <span style={{ fontWeight:700 }}>{outRec?.time || "-"}</span>
              </div>
              <div style={S.row}>
                <span style={{ fontSize:".82rem", color:C.muted }}>実働時間</span>
                <span style={{ fontWeight:700 }}>{fmtWorkTime(workMin)}</span>
              </div>
            </div>

            {/* 打刻ボタン */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
              {[
                ["出勤", canIn,  C.olivePale2, C.olive],
                ["退勤", canOut, "#fde8e8",    C.danger],
              ].map(([label, enabled, bg, color]) => (
                <button key={label} onClick={() => enabled && punch(label)}
                  style={{ padding:"18px 10px", borderRadius:12, border:"none", background:bg,
                    color: enabled ? color : "#bbb", fontWeight:800, fontSize:"1rem", cursor: enabled ? "pointer":"not-allowed",
                    opacity: enabled ? 1 : 0.5 }}>
                  {label}
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
    const todayStaff = staff.map(s => ({ ...s, status: currentStatus(s.id), home: homes.find(h => h.id === s.homeId)?.name || "" }));
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
          {[["status","勤怠状況"],["leave","有給承認"],["staffMgr","スタッフ管理"],["settings","設定"]].map(([t,l]) => (
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
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>所属ホーム</div>
              <select value={newStaffHome} onChange={e=>setNewStaffHome(e.target.value)} style={{ ...S.input, marginBottom:12 }}>
                <option value="">選択してください</option>
                {homes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:6 }}>役職</div>
              <select value={newStaffRole} onChange={e=>setNewStaffRole(e.target.value)} style={{ ...S.input, marginBottom:14 }}>
                {["世話人","生活支援員","管理者","サービス管理責任者","夜勤専従"].map(r=><option key={r}>{r}</option>)}
              </select>
              <button onClick={addStaff} style={S.btn(C.olive,"#fff")}>{editStaffId?"更新する":"追加する"}</button>
              {editStaffId && <button onClick={()=>{setEditStaffId(null);setNewStaffName("");setNewStaffHome("");setNewStaffRole("世話人");}}
                style={S.btn("#fff",C.muted,`2px solid ${C.border}`)}>キャンセル</button>}
            </div>
            <div style={{ fontWeight:700, fontSize:".9rem", marginBottom:8 }}>登録スタッフ一覧</div>
            {staff.map(s => (
              <div key={s.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:s.color, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".82rem", color:"#444", flexShrink:0 }}>
                  {initials(s.name)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:".92rem" }}>{s.name}</div>
                  <div style={{ fontSize:".73rem", color:C.muted }}>{homes.find(h=>h.id===s.homeId)?.name}　{s.role}</div>
                </div>
                <button onClick={()=>{setEditStaffId(s.id);setNewStaffName(s.name);setNewStaffHome(s.homeId);setNewStaffRole(s.role);setAdminTab("staffMgr");window.scrollTo(0,0);}}
                  style={{ background:C.bluePale, border:"none", borderRadius:8, padding:"6px 12px", color:C.blue, fontWeight:700, fontSize:".78rem", cursor:"pointer", marginRight:6 }}>編集</button>
                <button onClick={()=>deleteStaff(s.id)}
                  style={{ background:C.dangerPale, border:"none", borderRadius:8, padding:"6px 12px", color:C.danger, fontWeight:700, fontSize:".78rem", cursor:"pointer" }}>削除</button>
              </div>
            ))}
          </div>
        )}

        {/* 設定タブ */}
        {adminTab === "settings" && (
          <div style={{ padding:"12px 16px 32px" }}>
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
