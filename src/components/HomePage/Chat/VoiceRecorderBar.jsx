import React, { useEffect, useRef, useState } from "react";
import styles from "./mobile.module.scss";

const BAR_COUNT = 28;

const formatTime = (seconds = 0) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const VoiceRecorderBar = ({ onSend, onCancel }) => {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const [levels, setLevels] = useState(Array(BAR_COUNT).fill(6));
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(true);

  /* ===============================
     START RECORDING + ANALYSER
  ================================ */
  useEffect(() => {
    startRecording();

    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      stopAll();
    };
    // eslint-disable-next-line
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.start();

    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyserRef.current = analyser;

    source.connect(analyser);
    animateBars();
  };

  /* ===============================
     REAL-TIME WAVES (WhatsApp-like)
  ================================ */
  const animateBars = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);

      const slice = Math.floor(data.length / BAR_COUNT);
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const v = data[i * slice] || 0;
        return Math.max(6, v / 2);
      });

      setLevels(next);
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  /* ===============================
     STOP & CLEAN
  ================================ */
  const stopAll = () => {
    rafRef.current && cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  /* ===============================
     ACTIONS
  ================================ */
  const handleSend = () => {
    setRecording(false);
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = () => {
      stopAll();
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onSend(blob);
    };
  };

  const handleCancel = () => {
    stopAll();
    onCancel();
  };

  /* ===============================
     UI (UNCHANGED STRUCTURE)
  ================================ */
  return (
    <>
      <button type="button" className={styles.circleBtn} onClick={handleCancel}>
        ✕
      </button>

      <div className={styles.recordBar}>
        <div className={styles.recordInfo}>
          <div className={styles.recordStatus}>
            <span className={styles.recordDot} />
            <span className={styles.recordLabel}>جاري التسجيل</span>
          </div>
          <span className={styles.recordTimer}>{formatTime(seconds)}</span>
        </div>

        {/* WAVES INSTEAD OF CANVAS */}
        <div className={styles.recordWaveWrapper}>
          <div className={styles.waveContainer}>
            {levels.map((h, i) => (
              <span
                key={i}
                className={styles.wave}
style={{ height: `${Math.min(h, 34)}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        className={styles.sendBtn}
        disabled={!recording}
        onClick={handleSend}
      >
        إرسال
      </button>
    </>
  );
};

export default VoiceRecorderBar;

// import React, { useEffect, useRef, useState } from "react";
// import styles from "./mobile.module.scss";

// const BAR_COUNT = 28;

// const VoiceRecorderBar = ({ onSend, onCancel }) => {
//   const mediaRecorderRef = useRef(null);
//   const streamRef = useRef(null);
//   const chunksRef = useRef([]);

//   const audioCtxRef = useRef(null);
//   const analyserRef = useRef(null);
//   const rafRef = useRef(null);

//   const [levels, setLevels] = useState(Array(BAR_COUNT).fill(4));
//   const [recording, setRecording] = useState(true);

//   /* ===============================
//      START RECORDING + ANALYSER
//   ================================ */
//   useEffect(() => {
//     startRecording();
//     return stopAll;
//     // eslint-disable-next-line
//   }, []);

//   const startRecording = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     streamRef.current = stream;

//     /* MediaRecorder */
//     const recorder = new MediaRecorder(stream);
//     mediaRecorderRef.current = recorder;
//     recorder.start();

//     recorder.ondataavailable = (e) => {
//       if (e.data.size) chunksRef.current.push(e.data);
//     };

//     /* Audio analyser */
//     const audioCtx = new AudioContext();
//     audioCtxRef.current = audioCtx;

//     const source = audioCtx.createMediaStreamSource(stream);
//     const analyser = audioCtx.createAnalyser();
//     analyser.fftSize = 128;
//     analyserRef.current = analyser;

//     source.connect(analyser);

//     animateBars();
//   };

//   /* ===============================
//      REAL-TIME WAVES
//   ================================ */
//   const animateBars = () => {
//     const analyser = analyserRef.current;
//     if (!analyser) return;

//     const data = new Uint8Array(analyser.frequencyBinCount);

//     const loop = () => {
//       analyser.getByteFrequencyData(data);

//       const slice = Math.floor(data.length / BAR_COUNT);
//       const next = Array.from({ length: BAR_COUNT }, (_, i) => {
//         const value = data[i * slice] || 0;
//         return Math.max(6, value / 2);
//       });

//       setLevels(next);
//       rafRef.current = requestAnimationFrame(loop);
//     };

//     loop();
//   };

//   /* ===============================
//      STOP & CLEAN
//   ================================ */
//   const stopAll = () => {
//     rafRef.current && cancelAnimationFrame(rafRef.current);
//     analyserRef.current = null;

//     audioCtxRef.current?.close();
//     streamRef.current?.getTracks().forEach((t) => t.stop());
//   };

//   /* ===============================
//      ACTIONS
//   ================================ */
//   const handleStop = () => {
//     setRecording(false);
//     mediaRecorderRef.current.stop();

//     mediaRecorderRef.current.onstop = () => {
//       stopAll();
//       const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//       onSend(blob);
//     };
//   };

//   const handleCancel = () => {
//     stopAll();
//     onCancel();
//   };

//   /* ===============================
//      UI (UNCHANGED)
//   ================================ */
//   return (
//     <div className={styles.recorderBar}>
//       <button onClick={handleCancel} className={styles.cancelBtn}>✕</button>

//       {/* WAVES */}
//       <div className={styles.waveContainer}>
//         {levels.map((h, i) => (
//           <span
//             key={i}
//             className={styles.wave}
//             style={{ height: `${h}px` }}
//           />
//         ))}
//       </div>

//       <button
//         onClick={handleStop}
//         disabled={!recording}
//         className={styles.sendBtn}
//       >
//         إرسال
//       </button>
//     </div>
//   );
// };

// export default VoiceRecorderBar;

// import React, { useCallback, useEffect, useRef, useState } from "react";
// import styles from "./mobile.module.scss";
// import useRecorder from "./useRecorder";

// const formatTime = (seconds = 0) => {
//   const m = Math.floor(seconds / 60)
//     .toString()
//     .padStart(2, "0");
//   const s = Math.floor(seconds % 60)
//     .toString()
//     .padStart(2, "0");
//   return `${m}:${s}`;
// };

// const VoiceRecorderBar = ({ onSend, onCancel }) => {
//   const [seconds, setSeconds] = useState(0);
//   const waveformRef = useRef(null);
//   const { start, stop, status } = useRecorder();
//   const isRecording = status === "recording";

//   const finalizeRecording = useCallback(
//     async ({ send = false, cancel = false } = {}) => {
//       let recordedBlob = null;
//       try {
//         recordedBlob = await stop();
//       } catch {
//         recordedBlob = null;
//       } finally {
//         setSeconds(0);
//       }

//       if (send && recordedBlob?.size) {
//         onSend(recordedBlob);
//       }

//       if (cancel) {
//         onCancel();
//       }

//       return recordedBlob;
//     },
//     [stop, onSend, onCancel]
//   );

//   useEffect(() => {
//     setSeconds(0);
//     start().catch(() => {});
//     return () => {
//       stop().catch(() => {});
//     };
//   }, [start, stop]);

//   useEffect(() => {
//     if (!isRecording) {
//       return undefined;
//     }
//     const interval = setInterval(() => {
//       setSeconds((prev) => prev + 1);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [isRecording]);

//   useEffect(() => {
//     const canvas = waveformRef.current;
//     if (!canvas) {
//       return;
//     }
//     const ctx = canvas.getContext("2d");
//     if (!ctx) {
//       return;
//     }
//     const { width, height } = canvas;
//     ctx.clearRect(0, 0, width, height);
//     ctx.lineWidth = 2;
//     ctx.lineCap = "round";
//     ctx.strokeStyle = "#003f6f";
//     ctx.beginPath();
//     const segments = 18;
//     for (let i = 0; i <= segments; i += 1) {
//       const x = (i / segments) * width;
//       const amplitude = Math.sin((i / segments) * Math.PI * 1.5) * (height / 3);
//       const y = height / 2 + amplitude;
//       if (i === 0) {
//         ctx.moveTo(x, y);
//       } else {
//         ctx.lineTo(x, y);
//       }
//     }
//     ctx.stroke();
//   }, []);

//   const handleCancelClick = () => {
//     void finalizeRecording({ cancel: true });
//   };

//   const handleSendClick = async () => {
//     if (status === "recording" || status === "paused") {
//       await finalizeRecording({ send: true });
//     }
//   };

//   return (
//     <>
//       <button type="button" className={styles.circleBtn} onClick={handleCancelClick}>
//         X
//       </button>

//       <div className={styles.recordBar}>
//         <div className={styles.recordInfo}>
//           <div className={styles.recordStatus}>
//             <span className={styles.recordDot} />
//             <span className={styles.recordLabel}>جاري التسجيل</span>
//           </div>
//           <span className={styles.recordTimer}>{formatTime(seconds)}</span>
//         </div>

//         <div className={styles.recordWaveWrapper}>
//           <canvas
//             ref={waveformRef}
//             width={180}
//             height={32}
//             aria-hidden="true"
//           />
//         </div>
//       </div>

//       <button className={styles.sendBtn} onClick={handleSendClick}>
//         إرسال
//       </button>
//     </>
//   );
// };

// export default VoiceRecorderBar;
