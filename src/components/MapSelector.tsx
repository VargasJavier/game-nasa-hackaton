import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../game/state/store';
import ASSETS from '../assets/gameAssets';

const districts = [
  { name: 'Trujillo', x: 123, y: 190, width: 100, height: 80 },
  { name: 'Ascope', x: 70, y: 115, width: 100, height: 90 },
  { name: 'Pacasmayo', x: 25, y: 65, width: 75, height: 70 },
  { name: 'Chepen', x: 15, y: 5, width: 75, height: 70 },
  { name: 'Virú', x: 170, y: 275, width: 120, height: 110 },
  { name: 'Sánchez Carrión', x: 320, y: 120, width: 110, height: 100 },
  { name: 'Gran Chimú', x: 180, y: 85, width: 100, height: 90 },
  { name: 'Otuzco', x: 203, y: 160, width: 100, height: 60 },
  { name: 'Julcán', x: 230, y: 224, width: 71, height: 60 },
  { name: 'Santiago de Chuco', x: 290, y: 209, width: 110, height: 140 },
  { name: 'Bolívar', x: 372, y: -20, width: 130, height: 150 },
  { name: 'Pataz', x: 432, y: 150, width: 170, height: 170 },
];

export default function MapSelector() {
   const [selectedRegion, setSelectedRegion] = useState('La Libertad');
   const [showDistricts, setShowDistricts] = useState(true);
   const [hoveredDistrict, setHoveredDistrict] = useState('');
   const navigate = useNavigate();
   const setSelectedRegionStore = useGame(state => state.setSelectedRegion);
   const setSelectedDistrictStore = useGame(state => state.setSelectedDistrict);
   const setPlayerNameStore = useGame(state => state.setPlayerName);
   const location = useLocation();

  useEffect(() => {
    if (location.state?.playerName) {
      setPlayerNameStore(location.state.playerName);
    }
  }, [location.state, setPlayerNameStore]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedRegionStore(region);
    if (region === 'La Libertad') {
      setShowDistricts(true);
    } else {
      setShowDistricts(false);
      // For Ica, proceed (placeholder)
      setSelectedDistrictStore(''); // No district for Ica
      navigate('/game');
    }
  };

  const handleDistrictClick = (district: string) => {
    setSelectedDistrictStore(district);
    navigate('/game');
  };

  return (
    <div className="map-selector-screen">
      <h1>Select Region</h1>
      <div className="region-options">
        <label>
          <input
            type="radio"
            name="region"
            value="La Libertad"
            checked={selectedRegion === 'La Libertad'}
            onChange={() => handleRegionChange('La Libertad')}
          />
          La Libertad
        </label>
        <label>
          <input
            type="radio"
            name="region"
            value="Ica"
            checked={selectedRegion === 'Ica'}
            disabled
            onChange={() => handleRegionChange('Ica')}
          />
          Ica (Coming Soon)
        </label>
      </div>

      {showDistricts && (
        <div className="district-map">
          <h2>Select District in La Libertad - Perú</h2>
          <div className="map-container">
            <img src={ASSETS.laLibertadMap} alt="La Libertad Map" className="map-image" />
            {districts.map((district) => (
              <div
                key={district.name}
                className="district-area"
                style={{
                  left: district.x,
                  top: district.y,
                  width: district.width,
                  height: district.height,
                }}
                onClick={() => handleDistrictClick(district.name)}
                onMouseEnter={() => setHoveredDistrict(district.name)}
                onMouseLeave={() => setHoveredDistrict('')}
                title={district.name}
              >
              </div>
            ))}
          </div>
          <p className="district-name-display">Play in {hoveredDistrict && <span>{hoveredDistrict}</span>}</p>
        </div>
      )}
    </div>
  );
}