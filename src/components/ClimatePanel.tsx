import React, { useState, useEffect } from 'react';
import { useGame } from "../game/state/store";
import type { ClimateRecord } from './ClimateRecord/ClimateRecord';
import { getDataByIdDepartamento } from '../services/excelClient';
// import { forecastYearForDept } from '../hooks/UseClimateExample';

const ClimatePanel: React.FC<ClimatePanelProps> = ({ onExpand, isWeatherTutorialActive, selectedDistrict }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rows, setRows] = useState<ClimateRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  const fc = useGame(s => s.forecast);
  // const pronostro2025 = forecastYearForDept(historico, "D2", 2025);
  // Function to generate forecast (copied from Game.tsx)
  // const rollForecast = (month: number): Forecast => {
  //   const r = Math.random();
  //   let mm, label;
  //   if (r > 0.7) {
  //     mm = 8 + Math.random() * 8;
  //     label = "fuerte";
  //   } else if (r > 0.4) {
  //     mm = 3 + Math.random() * 3;
  //     label = "moderada";
  //   } else if (r > 0.2) {
  //     mm = 0.5 + Math.random() * 1.5;
  //     label = "ligera";
  //   } else {
  //     mm = 0;
  //     label = "seca";
  //   }
  //   // Temperature: 20-35°C, varying by month
  //   const baseTemp = 20 + ((month - 1) % 12) * 1.25;
  //   const temperature = baseTemp + Math.random() * 5 - 2.5;
  //   // Humidity: correlate with rain
  //   let humidityBase = 30; // default
  //   switch (label) {
  //     case 'seca': humidityBase = 30; break;
  //     case 'ligera': humidityBase = 50; break;
  //     case 'moderada': humidityBase = 70; break;
  //     case 'fuerte': humidityBase = 85; break;
  //   }
  //   const humidity = humidityBase + Math.random() * 20 - 10;
  //   return {
  //     mm,
  //     label: label as 'seca' | 'ligera' | 'moderada' | 'fuerte',
  //     temperature: Math.round(Math.max(20, Math.min(35, temperature))),
  //     humidity: Math.round(Math.max(30, Math.min(90, humidity)))
  //   };
  // };

  // useEffect(() => {
  //   // Generate 5 forecasts for months currentTurn+1 to currentTurn+5
  //   const newForecasts: Forecast[] = [];
  //   for (let i = 0; i < 5; i++) {
  //     newForecasts.push(rollForecast(currentTurn + i + 1));
  //   }
  //   setForecasts(newForecasts);
  // }, [currentTurn]); // Regenerate when turn changes

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let on = true;
    getDataByIdDepartamento(selectedDistrict ?? 'D1')
      .then(d => on && setRows(d))
      .catch(e => on && setError(e.message));
    return () => { on = false; };
  }, [selectedDistrict]);

  if (error) return <p>Error: {error}</p>;
  if (!rows.length) return <p>Cargando…</p>;

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && onExpand) {
      onExpand();
    }
  };

  // const getWeatherIcon = (label: string) => {
  //   switch (label) {
  //     case 'seca': return '☀️';
  //     case 'ligera': return '🌦️';
  //     case 'moderada': return '🌧️';
  //     case 'fuerte': return '⛈️';
  //     default: return '❓';
  //   }
  // };

  function classifyClimate(temp: number, hum: number, prec: number): {
    name: string,
    icon: string
  } {
  if (temp > 25 && hum < 40 && prec < 20) return { name: "Cálido seco", icon: '☁️'};
  if (temp > 25 && hum > 70 && prec > 100) return { name: "Tropical húmedo", icon: '🌦️'};
  if (temp > 10 && temp <= 25 && hum >= 40 && hum <= 70 && prec >= 20 && prec <= 100) return { name: "Templado moderado", icon: '⛅'};
  if (temp < 10 && hum > 70 && prec > 50) return { name: "Frío húmedo", icon: '🌧️'};
  if (temp < 10 && hum < 40 && prec < 20) return { name: "Árido frío", icon: '🌧️'};
  if (prec > 100 && hum > 60) return { name: "Lluvioso", icon: '🌧️'};
  if (prec < 20 && hum < 50) return { name: "Seco", icon: '☁️'};
  if (temp > 20 && hum < 60 && prec < 30) return { name: "Soleado", icon: '☀️'};
  return { name: "Moderado", icon: '🌥️'};
}

  // const getWeatherDescription = (label: string) => {
  //   switch (label) {
  //     case 'seca': return 'Dry';
  //     case 'ligera': return 'Light';
  //     case 'moderada': return 'Modest';
  //     case 'fuerte': return 'Heavy';
  //     default: return '';
  //   }
  // };

  return (
    <div
      className={`climate-panel ${isExpanded ? 'expanded' : 'collapsed'} ${isWeatherTutorialActive ? 'tutorial-active' : ''}`}
      onClick={toggleExpanded}
    >
      {isExpanded ? (
        // Expanded view: Phone simulation
        <div className="phone-simulation">
          <div className="phone-frame">
            <div className="phone-status-bar">
              <div className="status-time">{currentTime}</div>
              <div className="status-icons">🛜 📶 🔋</div>
            </div>
            <div className="phone-screen">
              {selectedDistrict && <div className="district-info">District: {selectedDistrict}</div>}
              <div className="forecast-list">
                {rows.map((r) => (
                  <div key={r.Id} className="forecast-item">
                    <div className="forecast-month">Month {r.Mes}</div>
                    <div className='forecast-rain'>
                      <div className="forecast-climate"><span>{classifyClimate(r.temperatura, r.humedad, r.precipitacion).icon}</span><span> {classifyClimate(r.temperatura, r.humedad, r.precipitacion).name}</span></div>
                      <div className="forecast-rainfall">{r.precipitacion.toFixed(1)} mm</div>
                    </div>
                    <div className="forecast-extra">{r.temperatura}°C | {r.humedad}% Humidity</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="phone-power-button" onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>⏻</div>
          </div>
        </div>
      ) : (
        // Collapsed view: Phone icon
        <div className="collapsed-content">
          {rows && rows.length && rows[0] && (
            <div className="current-climate" data-level={fc.label} >
              {classifyClimate(rows[0].temperatura, rows[0].humedad, rows[0].precipitacion).icon}<br></br> {classifyClimate(rows[0].temperatura, rows[0].humedad, rows[0].precipitacion).name}
            </div>
          )}
          <div className="phone-icon">📱</div>
        </div>
      )}
    </div>
  );
};

export default ClimatePanel
