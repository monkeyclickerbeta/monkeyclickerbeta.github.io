import React, { useState } from 'react';

export default function AdminPanel({ money, setMoney, monkeyRank, setMonkeyRank, onClose, onLogout }) {
  const [moneyInput, setMoneyInput] = useState(money);
  const [rankInput, setRankInput] = useState(monkeyRank);

  function handleApply() {
    setMoney(Number(moneyInput));
    setMonkeyRank(Number(rankInput));
    onClose();
  }

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <h2>Admin Panel</h2>
        <div>
          <label>
            Set Money:<br/>
            <input
              type="number"
              value={moneyInput}
              onChange={e => setMoneyInput(e.target.value)}
              min={0}
            />
          </label>
        </div>
        <div style={{ marginTop: "1em" }}>
          <label>
            Set Monkey Rank:<br/>
            <input
              type="number"
              value={rankInput}
              onChange={e => setRankInput(e.target.value)}
              min={1}
            />
          </label>
        </div>
        <div style={{ marginTop: "1.5em" }}>
          <button className="admin-apply-btn" onClick={handleApply}>Apply</button>
          <button className="admin-close-btn" onClick={onClose} style={{marginLeft:"1em"}}>Close</button>
        </div>
        <button className="admin-close-btn" onClick={onLogout} style={{marginTop:"1em"}}>Log out of admin</button>
      </div>
    </div>
  );
}
