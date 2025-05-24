import React, { useState, useEffect, useRef } from 'react'
import './App.css'

const upgradesData = [
  {
    name: "Banana Gloves",
    desc: "+1 money per click",
    cost: 50,
    clickBoost: 1,
  },
  {
    name: "Monkey Friend",
    desc: "Auto-clicks every second",
    cost: 200,
    autoClick: 1,
  },
  {
    name: "Golden Banana",
    desc: "+5 money per click",
    cost: 400,
    clickBoost: 5,
  },
  {
    name: "Banana Farm",
    desc: "+5 auto-click per second",
    cost: 900,
    autoClick: 5,
  },
  {
    name: "Big Monkey Hands",
    desc: "+25 money per click",
    cost: 1500,
    clickBoost: 25,
  },
  {
    name: "Banana Factory",
    desc: "+25 auto-click per second",
    cost: 2500,
    autoClick: 25,
  },
  {
    name: "Super Golden Banana",
    desc: "+100 money per click, +100 auto-click per second",
    cost: 15000,
    clickBoost: 100,
    autoClick: 100,
  },
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
  // Load/save game state as before...
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
        return {
          money: 0,
          monkeyRank: 1,
          clickValue: 1,
          autoClick: 0,
          upgrades: [],
        }
      }
    } else {
      return {
        money: 0,
        monkeyRank: 1,
        clickValue: 1,
        autoClick: 0,
        upgrades: [],
      }
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

  // Save progress
  useEffect(() => {
    localStorage.setItem(
      'monkeyclicker-save',
      JSON.stringify({
        money,
        monkeyRank,
        clickValue,
        autoClick,
        upgrades,
      })
    )
  }, [money, monkeyRank, clickValue, autoClick, upgrades])

  // Monkey Rank up
  useEffect(() => {
    if (money >= monkeyRank * 100) {
      setMonkeyRank((rank) => rank + 1)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1300)
    }
    // eslint-disable-next-line
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
      localStorage.removeItem('monkeyclicker-save')
    }
  }

  // --- AUTOCLICKER DETECTION ---
  function handleMonkeyClick() {
    if (clickDisabled) return

    // Add timestamp for this click
    const now = Date.now()
    clickTimestamps.current.push(now)

    // Only keep last 20 clicks
    if (clickTimestamps.current.length > 20) {
      clickTimestamps.current = clickTimestamps.current.slice(-20)
    }

    // 1. CPS Check: 10+ clicks in the last second
    const oneSecAgo = now - 1000
    const recentClicks = clickTimestamps.current.filter(ts => ts > oneSecAgo)
    if (recentClicks.length > 10) {
      triggerAutoClickerWarning()
      return
    }

    // 2. Consistent Interval Check: 7+ consecutive clicks within ±15ms interval
    if (clickTimestamps.current.length >= 8) {
      const intervals = clickTimestamps.current
        .slice(-8)
        .map((t, i, arr) => i > 0 ? t - arr[i - 1] : null)
        .slice(1)
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const allClose = intervals.every(i => Math.abs(i - avg) < 15)
      if (allClose) {
        triggerAutoClickerWarning()
        return
      }
    }

    // If not suspicious, process click
    setMoney(m => m + clickValue)
  }

  function triggerAutoClickerWarning() {
    setAutoClickerWarning(true)
    setClickDisabled(true)
    setTimeout(() => {
      setAutoClickerWarning(false)
      setClickDisabled(false)
      clickTimestamps.current = []
    }, 5000) // 5 seconds lockout
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
          🚨 Autoclicker detected! Play fair!<br/>
          Clicking disabled for 5 seconds.
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
      )}
      <button className="reset-btn" onClick={resetProgress} style={{marginTop: "1rem"}}>
        Reset Progress
      </button>
      <footer>
        <small>
          Made by <a href="https://github.com/mathpunch" target="_blank" rel="noopener noreferrer">mathpunch</a> – Ready for Vercel 🚀
        </small>
      </footer>
    </div>
  )
}

export default App
