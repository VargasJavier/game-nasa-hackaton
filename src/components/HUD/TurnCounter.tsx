import React from 'react';

export default function TurnCounter({ currentTurn, onNextTurn }: TurnCounterProps) {
  return (
    <div className="hud-section">
      <h4>Time</h4>
      <div>Month {currentTurn}</div>
      <button className="skip-time-btn" onClick={onNextTurn}>Skip Time</button>
    </div>
  );
}