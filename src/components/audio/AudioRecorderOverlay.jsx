import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlinePauseCircle, AiOutlinePlayCircle } from "react-icons/ai";
import { BsSend, BsTrash } from "react-icons/bs";
import { FiMic } from "react-icons/fi";
import AudioWaveform from "./AudioWaveform";
import styles from "./audio.module.scss";

const formatTime = (seconds = 0) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const AudioRecorderOverlay = ({ isOpen, onClose, onSend, recorderState = {}, actions = {} }) => {
  const { isRecording, isPaused, time, analyser } = recorderState;

  const handleStopAndSend = async () => {
    const blob = await actions.stop?.();
    if (!blob) return;
    onSend?.(blob);
    actions.delete?.();
    onClose?.();
  };

  const handleDelete = () => {
    actions.delete?.();
    onClose?.();
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      actions.resume?.();
    } else {
      actions.pause?.();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.inlineBar}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 270, damping: 28 }}
        >
          <div className={styles.barWave}>
            <AudioWaveform analyser={analyser} />
          </div>
          <div className={styles.timerRow}>
            <div className={styles.status}>
              {isRecording && <span className={styles.pulse} aria-hidden />}
              <FiMic size={18} aria-hidden />
              <span className={styles.srOnly}>{isRecording ? "Recording" : isPaused ? "Paused" : "Ready"}</span>
            </div>
            <div className={styles.timer}>{formatTime(time)}</div>
          </div>
          <div className={styles.barActions}>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.pauseButton}`}
              onClick={handlePauseToggle}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
              disabled={!isRecording && !isPaused}
            >
            {isPaused ? (
              <AiOutlinePlayCircle size={22} />
            ) : (
              <AiOutlinePauseCircle size={22} />
            )}
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.sendButton}`}
              onClick={handleStopAndSend}
              aria-label="Stop and send voice message"
              disabled={!time && !isRecording}
            >
              <BsSend size={20} />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.deleteButton}`}
              onClick={handleDelete}
              aria-label="Cancel voice message"
            >
              <BsTrash size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioRecorderOverlay;
