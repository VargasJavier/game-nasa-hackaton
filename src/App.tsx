import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Game from "./routes/Game";

const Home = () => {
  const nav = useNavigate();
  return (
    <div className="start-wrap">
      <div className="sky">
        <div className="cloud" />
        <div className="sun" />
      </div>

      <div className="title-board">
        <h1>FARM4FUTURE</h1>
        <span className="subtitle">clima • agua • cultivos</span>
      </div>

      <div className="hero">
        <div className="barn" />
        <div className="farmer" />
        <div className="thermo">
          <div className="thermo-mercury" />
        </div>
      </div>

      <div className="weather-grid">
        <button className="wx-btn"><span>☀️</span><small>Sol</small></button>
        <button className="wx-btn"><span>🌧️</span><small>Lluvia</small></button>
        <button className="wx-btn"><span>🌦️</span><small>Mixto</small></button>
        <button className="wx-btn"><span>❄️</span><small>Frío</small></button>
      </div>

      <div className="map-selector">
        <label>
          <input type="radio" name="map" value="map1" defaultChecked />
          <span>La libertad</span>
        </label>
        <label>
          <input type="radio" name="map" value="map2" />
          <span>Ica</span>
        </label>
      </div>

      <button className="start-btn" onClick={() => nav("/game")}>START</button>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
