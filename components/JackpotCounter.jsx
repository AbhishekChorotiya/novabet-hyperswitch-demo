"use client";

import { useEffect, useState } from "react";

export default function JackpotCounter({ base = 2847391.42 }) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => v + Math.random() * 7 + 1.5);
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-display font-bold tabular-nums text-gradient-gold animate-count-glow">
      $
      {value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}
