"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface LottiePlayerProps {
  src: string;
  className?: string;
}

export function LottiePlayer({ src, className }: LottiePlayerProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch(src)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(() => {
        // silently fail — parent still shows the number badge
      });
  }, [src]);

  if (!animationData) {
    return <div className={className} />;
  }

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className={className}
    />
  );
}
