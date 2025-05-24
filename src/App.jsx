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
    cost: 500,
    clickBoost: 5,
  },
]

function App() {
  const [money, setMoney] = useState(0)
  const [level, setLevel] = useState(1)
  const [clickValue, setClickValue] = useState(1)
  const [autoClick, setAutoClick] = useState(0)
  const [upgrades, setUpgrades] = useState([])
  const [showUpgrades, setShowUpgrades] = useState(false)

  // Level up at every 100 * level money (just increase level, no upgrade popup)
  React.useEffect(() => {
    if (money >= level * 100) {
      setLevel((lvl) => lvl + 1)
    }
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
