import { useCallback, useRef, useState } from "react";

const formatBlob = (chunks) => new Blob(chunks, { type: "audio/webm" });

const useAudioRecorder = () => {
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const stopResolverRef = useRef(null);
  const discardRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      if (typeof window !== "undefined") {
        window.clearInterval(timerRef.current);
      } else {
        clearInterval(timerRef.current);
      }
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    if (typeof window === "undefined") return;
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const finalizeRecording = useCallback(() => {
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);

    if (analyser) {
      analyser.disconnect();
      setAnalyser(null);
    }

    if (audioContext) {
      audioContext.close().catch(() => {});
      setAudioContext(null);
    }

    stopStreamTracks();

    const blob = formatBlob(audioChunksRef.current);
    audioChunksRef.current = [];

    if (discardRef.current) {
      discardRef.current = false;
      if (stopResolverRef.current) {
        stopResolverRef.current(null);
        stopResolverRef.current = null;
      }
      return null;
    }

    setAudioBlob(blob);
    if (stopResolverRef.current) {
      stopResolverRef.current(blob);
      stopResolverRef.current = null;
    }

    return blob;
  }, [analyser, audioContext, stopStreamTracks]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    stopTimer();
    setRecordingTime(0);
    setAudioBlob(null);
    discardRef.current = false;

    const hasGetUserMedia = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    if (!hasGetUserMedia) {
      console.warn("Media devices are unavailable in this environment.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyserNode);

      setAudioContext(context);
      setAnalyser(analyserNode);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", finalizeRecording);
      recorder.start(500);

      setIsRecording(true);
      setIsPaused(false);
      startTimer();
      context.resume().catch(() => {});
    } catch (error) {
      console.error("Unable to start recording:", error);
    }
  }, [finalizeRecording, isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        resolve(null);
        return;
      }

      stopResolverRef.current = resolve;
      if (mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }

      mediaRecorderRef.current.stop();
    });
  }, []);

  const deleteRecording = useCallback(() => {
    discardRef.current = true;
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      if (analyser) {
        analyser.disconnect();
        setAnalyser(null);
      }

      if (audioContext) {
        audioContext.close().catch(() => {});
        setAudioContext(null);
      }

      stopStreamTracks();
    }
  }, [analyser, audioContext, stopStreamTracks]);

  const cleanup = useCallback(() => {
    deleteRecording();
  }, [deleteRecording]);

  return {
    audioBlob,
    isRecording,
    isPaused,
    recordingTime,
    audioContext,
    analyser,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    deleteRecording,
    cleanup,
  };
};

export default useAudioRecorder;
