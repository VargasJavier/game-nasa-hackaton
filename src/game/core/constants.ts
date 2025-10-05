export const SCENE = { w: 1090, h: 663 } as const; // tus límites reales
export const PLAYER = { w: 65, h: 105, speed: 200 } as const;

export const INTERACT_RADIUS = 120;
export const EVAP_PER_TURN = 0.15;
export const RAIN_TO_MOISTURE = 1/20; // 5mm => +0.25
export const MOISTURE_OK = { min: 0.3, max: 0.85 };
export const RIVER_POSITION = { x: 62, y: 482 };
export const MAX_TANK_CAPACITY = 10;
