import { create } from "zustand";

interface TimeState {
  now: number;
  startTicker: () => void;
  stopTicker: () => void;
}

let intervalId: NodeJS.Timeout | null = null;

export const useTimeStore = create<TimeState>((set) => ({
  now: Math.floor(Date.now() / 1000), // Initial time

  startTicker: () => {
    if (intervalId) return;

    intervalId = setInterval(() => {
      set({ now: Math.floor(Date.now() / 1000) });
    }, 1000);
  },

  stopTicker: () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },
}));
