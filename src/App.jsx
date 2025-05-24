import React, { useState } from 'react'
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
    cost: 400, // changed from 500 to 400
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
    cost: 2500,
    clickBoost: 25,
  },
  {
    name: "Banana Factory",
    desc: "+25 auto-click per second",
    cost: 8000,
    autoClick: 25,
  },
  {
    name: "Super Golden Banana",
    desc: "+100 money per click, +100 auto-click per second",
    cost: 25000,
    clickBoost: 100,
    autoClick: 100,
  },
]

function Confetti({ show }) {
  if (!show) return null
  // 20 pieces of confetti with random styles
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
  const [money, setMoney] = useState(0)
  const [level, setLevel] = useState(1)
  const [clickValue, setClickValue] = useState(1)
  const [autoClick, setAutoClick] = useState(0)
  const [upgrades, setUpgrades] = useState([])
  const [showUpgrades, setShowUpgrades] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Level up at every 100 * level money (just increase level, show confetti)
  React.useEffect(() => {
    if (money >= level * 100) {
      setLevel((lvl) => lvl + 1)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1700)
    }
    // eslint-disable-next-line
  }, [money, level])

  // Auto-click effect
  React.useEffect(() => {
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

  return (
    <div className="app">
      <Confetti show={showConfetti} />
      <h1>🐒 Monkey Clicker</h1>
      <div className="stats">
        <span>Money: <b>{money}</b></span>
        <span>Level: <b>{level}</b></span>
      </div>
      <button className="monkey-btn" onClick={() => setMoney(money + clickValue)}>
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
        <div className="upgrade-popup">
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
      <footer>
        <small>
          Made by <a href="https://github.com/mathpunch" target="_blank" rel="noopener noreferrer">mathpunch</a> – Ready for Vercel 🚀
        </small>
      </footer>
    </div>
  )
}

export default App
