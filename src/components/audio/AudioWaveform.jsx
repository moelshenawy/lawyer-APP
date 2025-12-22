import React, { useEffect, useRef } from "react";
import styles from "./audio.module.scss";

const AudioWaveform = ({ analyser }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dataArray = new Uint8Array(analyser.fftSize);

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 0;
      const height = canvas.clientHeight || 0;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.85)";
      ctx.beginPath();

      const slice = canvas.clientWidth / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i += 1) {
        const value = dataArray[i] / 128;
        const y = (value * canvas.clientHeight) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += slice;
      }

      ctx.lineTo(canvas.clientWidth, canvas.clientHeight / 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resizeCanvas();
    };

    resizeCanvas();
    draw();
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [analyser]);

  return <canvas ref={canvasRef} className={styles.waveformCanvas} aria-hidden />;
};

export default AudioWaveform;
