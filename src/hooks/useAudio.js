import { useRef } from "react";

export function useAudio(src) {
  const ref = useRef(new Audio(src));

  function play() {
    ref.current.currentTime = 0;
    ref.current.play();
  }

  return play;
}
