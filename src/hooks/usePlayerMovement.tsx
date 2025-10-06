import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/state/store';
import ASSETS from '../assets/gameAssets';

export const usePlayerMovement = () => {
  const {
    player,
    move,
    face,
    // showShop,
    plant,
    irrigate,
    nextTurn,
    toggleShop,
    cycleSeed,
    tutorialShown,
    setTutorialShown,
    // showControls,
    toggleControls
  } = useGame();

  const [isMoving, setIsMoving] = useState(false);
  const keys = useRef<Record<string, boolean>>({});
  const raf = useRef<number | null>(null);
  const last = useRef<number>(performance.now());

  // Handle input
  useEffect(() => {
    // attach once; handlers will read latest state via refs
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", "r", "n", "i", "escape", "tab"].includes(k)) {
        e.preventDefault();
      }
      keys.current[k] = true;

      if (!tutorialShown && ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
          setTutorialShown(true);
      }

      switch (k) {
        case "e": plant(); break;
        case "r": irrigate(); break;
        case "n": nextTurn(); break;
        case "escape": toggleShop(); break;
        case "tab": cycleSeed(); break;
        case "i": toggleControls(); break;
      }
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [plant, irrigate, nextTurn, toggleShop, cycleSeed, toggleControls]);

  // Game loop for movement
  useEffect(() => {
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last.current) / 1000);
      last.current = t;

      let dx = 0, dy = 0;
      if (keys.current["arrowleft"] || keys.current["a"]) {
        dx -= 1;
        face("left");
      }
      if (keys.current["arrowright"] || keys.current["d"]) {
        dx += 1;
        face("right");
      }
      if (keys.current["arrowup"] || keys.current["w"]) dy -= 1;
      if (keys.current["arrowdown"] || keys.current["s"]) dy += 1;

      const moving = !!(dx || dy);
      if (moving !== isMoving) setIsMoving(moving);

      if (dx || dy) {
        move(dx, dy, dt);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [move, face, isMoving]);

  const frameFarmer = isMoving
    ? (player.facing === "left" ? ASSETS.farmerWalk : ASSETS.farmerWalkInvert)
    : (player.facing === "left" ? ASSETS.farmer : ASSETS.farmerInvert);

  return {
    player,
    frameFarmer
  };
};