import React from "react";
import { useGame } from "../../game/state/store";

export default function InventoryPanel(){
  const inv = useGame(s => s.inventory);
  const selected = useGame(s => s.selectedSeedId);
  const selectSeed = useGame(s => s.selectSeed);
  const currency = useGame(s => s.resources.currency);
  const water = useGame(s => s.resources.waterTanks.reduce((a,b)=>a+b,0));

  const seeds = inv.filter(i => i.type==="seed");
  const crops = inv.filter(i => i.type==="crop");

  return (
    <div className="hud-panel">
      <div className="hud-section">
        <h4>Seeds</h4>
        {seeds.map(item => (
          <div key={item.id}
            className={`inventory-item ${selected===item.id ? "selected-seed":""}`}
            onClick={()=>selectSeed(item.id)}
            role="button" tabIndex={0}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key===" ") selectSeed(item.id); }}>
            {item.icon.href} {item.name}: {item.quantity}
          </div>
        ))}
      </div>

      <div className="hud-section">
        <h4>Crops</h4>
        {crops.map(item => (
          <div key={item.id} className="inventory-item">
            {item.icon.href} {item.name}: {item.quantity}
          </div>
        ))}
      </div>

      <div className="hud-section">
        <div className="hud-row"><span className="ico">💧</span><span className="val">{water}</span></div>
        <div className="hud-row"><span className="ico">🪙</span><span className="val">{currency}</span></div>
      </div>
    </div>
  );
}
