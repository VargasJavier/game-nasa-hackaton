import React, { useMemo } from 'react'
import ASSETS from '../assets/gameAssets';

// Rio coordinates
const RIVER_X = -150;
const RIVER_Y = 0; // bottom
const RIVER_WIDTH = 390;
const RIVER_HEIGHT = 650;
const RIVER_CENTER_X = RIVER_X + RIVER_WIDTH / 2;
const RIVER_CENTER_Y = 450; // scene height 630

const River = ({ forecast, player, setIsNearRiver }: any) => {
  
  const riverImage = forecast.label === 'fuerte' || forecast.label === 'moderada'
    ? ASSETS.riverImg
    : forecast.label === 'ligera'
      ? ASSETS.lowerRiverImg
      : ASSETS.dryRiverImg;

  const isNearRiverMemo = useMemo(() => {
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const isNear = (Math.hypot(playerCenterX - RIVER_CENTER_X, playerCenterY - RIVER_CENTER_Y) < 200);
    setIsNearRiver(isNear)
    return isNear
  }, [player]);
  
  return (
    <img src={riverImage} alt="River" className={`river ${isNearRiverMemo ? "focus" : ""}`} style={{ left: RIVER_X, bottom: RIVER_Y, width: RIVER_WIDTH, height: RIVER_HEIGHT }} />
  )
}

export default River