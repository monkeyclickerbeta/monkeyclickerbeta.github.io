import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import AdminPanel from './AdminPanel'

const CPS_THRESHOLD = 40
const INTERVAL_COUNT = 30
const INTERVAL_TOLERANCE = 120
const MAX_STRIKES = 3
const STRIKE_WINDOW = 60000
const BAN_DURATION = 10000

const ADMIN_PASSWORD = "adminozzyonly1122";
const BANNED_KEY = "monkeyclicker-banned";
const ADMIN_AUTH_KEY = "monkeyclicker-admin-auth";

const upgradesData = [
  { name: "Banana Gloves", desc: "+1 money per click", cost: 50, clickBoost: 1 },
  { name: "Monkey Friend", desc: "Auto-clicks every second", cost: 200, autoClick: 1 },
  { name: "Golden Banana", desc: "+5 money per click", cost: 400, clickBoost: 5 },
  { name: "Banana Farm", desc: "+5 auto-click per second", cost: 900, autoClick: 5 },
  { name: "Big Monkey Hands", desc: "+25 money per click", cost: 1500, clickBoost: 25 },
  { name: "Banana Factory", desc: "+25 auto-click per second", cost: 2500, autoClick: 25 },
  { name: "Super Golden Banana", desc: "+100 money per click, +100 auto-click per second", cost: 15000, clickBoost: 100, autoClick: 100 },
]

function Confetti({ show }) {
  if (!show) return null
  const pieces = Array.from({ length: 20 })
  return (
    <div className="confetti-container">
      {pieces.map((_, i) => {
        const left = Math.random() * 90 + 5
        const animationDuration = Math.random() * 0.8 + 1.2
        const rotate = Math.random() * 360
        const colors = ['#FFD700', '#FF5E5B', '#66D7D1', '#FFED66', '#6A4C93']
        const color = colors[i % colors.length]
        return (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${left}%`,
              background: color,
              animationDuration: `${animationDuration}s`,
              transform: `rotate(${rotate}deg)`,
            }}
          />
        )
      })}
      <div className="confetti-text-upgrade">
        <span className="confetti-text-shadow">Level Up!</span>
      </div>
    </div>
  )
}

function App() {
  const [isBanned, setIsBanned] = useState(localStorage.getItem(BANNED_KEY) === "true");
  const [isAdminRemembered, setIsAdminRemembered] = useState(localStorage.getItem(ADMIN_AUTH_KEY) === "true");
  const [rememberMe, setRememberMe] = useState(false);

  // Save/load game progress
  const getInitialState = () => {
    const save = localStorage.getItem('monkeyclicker-save')
    if (save) {
      try {
        const obj = JSON.parse(save)
        return {
          money: obj.money ?? 0,
          monkeyRank: obj.monkeyRank ?? 1,
          clickValue: obj.clickValue ?? 1,
          autoClick: obj.autoClick ?? 0,
          upgrades: obj.upgrades ?? [],
        }
      } catch {
        return { money: 0, monkeyRank: 1, clickValue: 1, autoClick: 0, upgrades: [] }
      }
    } else {
      return { money: 0, monkeyRank: 1, clickValue: 1, autoClick: 0, upgrades: [] }
    }
  }

  const [money, setMoney] = useState(getInitialState().money)
  const [monkeyRank, setMonkeyRank] = useState(getInitialState().monkeyRank)
  const [clickValue, setClickValue] = useState(getInitialState().clickValue)
  const [autoClick, setAutoClick] = useState(getInitialState().autoClick)
  const [upgrades, setUpgrades] = useState(getInitialState().upgrades)
  const [showUpgrades, setShowUpgrades] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // --- AUTCLICKER DETECTION STATE ---
  const [autoClickerWarning, setAutoClickerWarning] = useState(false)
  const [clickDisabled, setClickDisabled] = useState(false)
  const clickTimestamps = useRef([])
  const [strikes, setStrikes] = useState([])
  const [strikeCount, setStrikeCount] = useState(0)
  const [detectionCount, setDetectionCount] = useState(0)
  const [warningMessage, setWarningMessage] = useState('')

  // Admin panel password state
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminTry, setAdminTry] = useState(false);
  const [adminInput, setAdminInput] = useState("");

  // Save progress to localStorage whenever relevant state changes
  useEffect(() => {
    localStorage.setItem(
      'monkeyclicker-save',
      JSON.stringify({ money, monkeyRank, clickValue, autoClick, upgrades })
    )
  }, [money, monkeyRank, clickValue, autoClick, upgrades])

  // Monkey Rank up at every 100 * monkeyRank money (just increase rank, show confetti)
  useEffect(() => {
    if (money >= monkeyRank * 100) {
      setMonkeyRank((rank) => rank + 1)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1300)
    }
  }, [money, monkeyRank])

  // Auto-click effect
  useEffect(() => {
    if (autoClick > 0) {
      const interval = setInterval(() => {
        setMoney((m) => m + autoClick)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [autoClick])

  // --- Strike expiry ---
  useEffect(() => {
    if (strikes.length === 0) return
    const interval = setInterval(() => {
      const now = Date.now()
      const filtered = strikes.filter(t => now - t < STRIKE_WINDOW)
      setStrikes(filtered)
      setStrikeCount(filtered.length)
    }, 1000)
    return () => clearInterval(interval)
  }, [strikes])

  // Upgrade purchase
  function buyUpgrade(upgrade, idx) {
    if (money < upgrade.cost) return
    setMoney((m) => m - upgrade.cost)
    if (upgrade.clickBoost) setClickValue((v) => v + upgrade.clickBoost)
    if (upgrade.autoClick) setAutoClick((a) => a + upgrade.autoClick)
    setUpgrades((u) => [...u, upgrade.name])
  }

  // Reset progress
  function resetProgress() {
    if (window.confirm("Are you sure you want to reset all progress?")) {
      setMoney(0)
      setMonkeyRank(1)
      setClickValue(1)
      setAutoClick(0)
      setUpgrades([])
      localStorage.removeItem('monkeyclicker-save');
    }
  }

  // --- AUTOCLICKER DETECTION ---
  function handleMonkeyClick() {
    if (clickDisabled) return

    const now = Date.now()
    clickTimestamps.current.push(now)

    if (clickTimestamps.current.length > 100) {
      clickTimestamps.current = clickTimestamps.current.slice(-100)
    }

    // 1. CPS Check: 40+ clicks in the last second
    const oneSecAgo = now - 1000
    const recentClicks = clickTimestamps.current.filter(ts => ts > oneSecAgo)
    let suspicious = false
    if (recentClicks.length > CPS_THRESHOLD) suspicious = true

    // 2. Consistent Interval Check: 30+ consecutive clicks within ±120ms interval
    if (clickTimestamps.current.length >= INTERVAL_COUNT + 1) {
      const intervals = clickTimestamps.current
        .slice(-INTERVAL_COUNT - 1)
        .map((t, i, arr) => i > 0 ? t - arr[i - 1] : null)
        .slice(1)
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const allClose = intervals.every(i => Math.abs(i - avg) < INTERVAL_TOLERANCE)
      if (allClose) suspicious = true
    }

    if (suspicious) {
      if (detectionCount === 0) {
        setAutoClickerWarning(true)
        setWarningMessage("⚠️ Suspicious clicking detected! This is just a warning. If this keeps happening, you will receive strikes and may be banned temporarily.")
        setDetectionCount(1)
        setTimeout(() => setAutoClickerWarning(false), 2500)
        return
      }
      const now = Date.now()
      const newStrikes = strikes.filter(t => now - t < STRIKE_WINDOW).concat(now)
      setStrikes(newStrikes)
      setStrikeCount(newStrikes.length)
      if (newStrikes.length < MAX_STRIKES) {
        setAutoClickerWarning(true)
        setWarningMessage(`🚨 Autoclicker suspicious clicking detected! (${newStrikes.length}/${MAX_STRIKES} strikes)`)
        setTimeout(() => setAutoClickerWarning(false), 2200)
      } else {
        setAutoClickerWarning(true)
        setWarningMessage(`⛔️ You have been banned for ${BAN_DURATION / 1000} seconds due to repeated suspicious clicking!`)
        setClickDisabled(true)
        setTimeout(() => {
          setClickDisabled(false)
          setStrikes([])
          setStrikeCount(0)
          setDetectionCount(0)
          setAutoClickerWarning(false)
        }, BAN_DURATION)
      }
      return
    }

    setMoney(m => m + clickValue)
  }

  // Admin Panel Password prompt
  function handleAdminAccess() {
    if (isBanned) return;
    if (isAdminRemembered) {
      setAdminAuth(true);
      setShowAdmin(true);
      setAdminTry(false);
      setAdminInput("");
      return;
    }
    setAdminTry(true);
    setAdminInput("");
  }
  function handleAdminSubmit(e) {
    e.preventDefault();
    if (adminInput === ADMIN_PASSWORD) {
      setAdminAuth(true);
      setShowAdmin(true);
      setAdminTry(false);
      setAdminInput("");
      if (rememberMe) {
        localStorage.setItem(ADMIN_AUTH_KEY, "true");
        setIsAdminRemembered(true);
      }
    } else {
      localStorage.setItem(BANNED_KEY, "true");
      setIsBanned(true);
      alert("You are banned forever from the admin panel due to incorrect password.");
      setAdminTry(false);
      setAdminInput("");
    }
  }
  function handleAdminPanelClose() {
    setShowAdmin(false);
    setAdminAuth(false);
  }
  function handleAdminLogout() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAdminRemembered(false);
    setAdminAuth(false);
    setShowAdmin(false);
  }

  if (isBanned) {
    return (
      <div className="app">
        <div
          style={{
            marginTop: "5rem",
            color: "#fff",
            background: "#b80000",
            padding: "3rem 2rem",
            borderRadius: "2rem",
            fontSize: "2.2rem",
            fontWeight: "bold",
            boxShadow: "0 0 50px #b8000090",
          }}
        >
          🚫 You are <span style={{color:"#ffd700"}}>BANNED</span> from this site.<br/>
          <span style={{fontSize:"1.1rem", color:"#fffbe9"}}>This ban is permanent due to an incorrect admin password attempt.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Confetti show={showConfetti} />
      <h1>🐒 Monkey Clicker</h1>
      <div className="stats">
        <span>Money: <b>{money}</b></span>
        <span>Monkey Rank: <b>{monkeyRank}</b></span>
      </div>
      {autoClickerWarning && (
        <div className="autoclicker-warning">
          {warningMessage}
        </div>
      )}
      <button
        className="monkey-btn"
        onClick={handleMonkeyClick}
        disabled={clickDisabled}
        style={clickDisabled ? { filter: "grayscale(0.8) blur(1px)" } : {}}
      >
        <span role="img" aria-label="monkey" style={{ fontSize: 60 }}>🐒</span>
        <div>Click me!</div>
        <div className="per-click">+{clickValue} per click</div>
      </button>
      <button className="upgrades-menu-btn" onClick={() => setShowUpgrades(true)}>
        🛒 Upgrades
      </button>
      <button
        className="upgrades-menu-btn"
        style={{marginLeft: 8, background:"#ffb300", borderColor:"#c79b00"}}
        onClick={handleAdminAccess}
      >
        🛠️ Admin Panel
      </button>
      <div className="upgrade-list">
        <h2>Owned Upgrades</h2>
        <ul>
          {upgrades.map((name, i) => (
            <li key={i}>✓ {name}</li>
          ))}
        </ul>
      </div>
      {showUpgrades && (
        <div className="upgrade-popup centered-popup">
          <div className="upgrade-popup-scroll">
            <h3>Buy Upgrades</h3>
            {upgradesData.map((upg, idx) => (
              !upgrades.includes(upg.name) &&
              <button key={upg.name} className="upgrade-option" onClick={() => buyUpgrade(upg, idx)} disabled={money < upg.cost}>
                <b>{upg.name}</b><br />
                <span>{upg.desc}</span><br />
                <span>Cost: {upg.cost} money</span>
              </button>
            ))}
            <button className="close-upgrades" onClick={() => setShowUpgrades(false)}>Close</button>
          </div>
        </div>
      )}
      <button className="reset-btn" onClick={resetProgress} style={{marginTop: "1rem"}}>
        Reset Progress
      </button>
      {adminTry && !adminAuth && (
        <div className="admin-panel-overlay">
          <form className="admin-panel" onSubmit={handleAdminSubmit}>
            <h2>Admin Panel Login</h2>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminInput}
              onChange={e => setAdminInput(e.target.value)}
              autoFocus
            />
            <div style={{marginTop:"1em"}}>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                /> Remember me
              </label>
            </div>
            <div style={{marginTop: "1em"}}>
              <button type="submit" className="admin-apply-btn">Enter</button>
              <button type="button" className="admin-close-btn" onClick={()=>setAdminTry(false)} style={{marginLeft:"1em"}}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {showAdmin && adminAuth && (
        <AdminPanel
          money={money}
          setMoney={setMoney}
          monkeyRank={monkeyRank}
          setMonkeyRank={setMonkeyRank}
          onClose={handleAdminPanelClose}
          onLogout={handleAdminLogout}
        />
      )}
      <footer>
        <small>
          Made by <a href="https://github.com/mathpunch" target="_blank" rel="noopener noreferrer">mathpunch</a> – Ready for Vercel 🚀
        </small>
      </footer>
    </div>
  )
}

export default App
