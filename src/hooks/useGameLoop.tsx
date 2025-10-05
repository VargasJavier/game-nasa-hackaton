// src/hooks/useGameLoop.ts
import { useEffect, useRef } from "react";
import { useKeyboard } from "./useKeyboard";
import { useGame } from "../game/state/store";

/**
 * Bucle principal del juego:
 * - Lee teclado (useKeyboard)
 * - Mueve al jugador con delta time
 * - Actualiza facing left/right
 * - Dispara acciones discretas: plant, irrigate, nextTurn, toggleShop, cycleSeed
 */
export function useGameLoop() {
  const keys = useKeyboard();

  // acciones del store
  const move       = useGame(s => s.move);
  const face       = useGame(s => s.face);
  const plant      = useGame(s => s.plant);
  const irrigate   = useGame(s => s.irrigate);
  const nextTurn   = useGame(s => s.nextTurn);
  const toggleShop = useGame(s => s.toggleShop);
  const cycleSeed  = useGame(s => s.cycleSeed);

  const raf  = useRef<number>(null);
  const last = useRef<number>(performance.now());

  useEffect(() => {
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last.current) / 1000);
      last.current = t;

      const k = keys.current;
      let dx = 0, dy = 0;

      // Movimiento continuo
      if (k["a"] || k["arrowleft"])  dx -= 1;
      if (k["d"] || k["arrowright"]) dx += 1;
      if (k["w"] || k["arrowup"])    dy -= 1;
      if (k["s"] || k["arrowdown"])  dy += 1;

      // Aplica movimiento con normalización
      move(dx, dy, dt);

      // Facing solo si hay intención horizontal
      if (dx < 0) face("left");
      else if (dx > 0) face("right");

      // Acciones discretas: una vez por pulsación
      if (k["e"])   { plant();      k["e"] = false; }
      if (k["r"])   { irrigate();   k["r"] = false; }
      if (k["n"])   { nextTurn();   k["n"] = false; }
      if (k["escape"]) { toggleShop(); k["escape"] = false; }
      if (k["tab"]) { cycleSeed();  k["tab"] = false; }

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [keys, move, face, plant, irrigate, nextTurn, toggleShop, cycleSeed]);
}
