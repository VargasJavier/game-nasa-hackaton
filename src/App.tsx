import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Game from "./routes/Game";
import F4FLogo from "./assets/icons/F4FLogo.png";
import MapSelector from "./components/MapSelector";

const Home = () => {
  const nav = useNavigate();
  const [playerName, setPlayerName] = React.useState('Farm4Future');

  React.useEffect(() => {
    const saved = localStorage.getItem('playerName');
    if (saved) setPlayerName(saved);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value.slice(0, 20); // max 20 chars
    setPlayerName(name);
    localStorage.setItem('playerName', name);
  };

  const handleStart = () => {
    nav('/map', { state: { playerName } });
  };

  return (
    <div className="start-wrap">
      <div className="sky">
        <div className="cloud" />
        <div className="sun" />
      </div>

      <div className="title-board">
        <img src={F4FLogo} alt="F4F: Farm4Future" className="logo"/>
      </div>

      {/* <div className="hero">
        <div className="barn" />
        <div className="farmer" />
        <div className="thermo">
          <div className="thermo-mercury" />
        </div>
      </div> */}

      <div className="weather-grid">
        <button className="wx-btn"><span>☀️</span><small>Dry</small></button>
        <button className="wx-btn"><span>🌧️</span><small>Rain</small></button>
        <button className="wx-btn"><span>🌦️</span><small>Light</small></button>
        <button className="wx-btn"><span>❄️</span><small>Humidity</small></button>
      </div>

      <div className="name-input">
        <label>Farm Name:</label>
        <input
          type="text"
          value={playerName}
          onChange={handleNameChange}
          maxLength={20}
          placeholder="Farm4Future"
        />
      </div>

      <button className="start-btn" onClick={handleStart}>START</button>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapSelector />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
