import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/wav",
];

const getSupportedMimeType = () => {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    return "";
  }

  for (const candidate of MIME_CANDIDATES) {
    if (window.MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "";
};

const useRecorder = () => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const pendingStopRef = useRef(null);
  const lastMimeRef = useRef("");
  const supportedMime = useMemo(getSupportedMimeType, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const buildBlob = useCallback(() => {
    const mime = lastMimeRef.current || supportedMime || "audio/webm";
    return new Blob(chunksRef.current, { type: mime });
  }, [supportedMime]);

  const stop = useCallback(() => {
    if (pendingStopRef.current) {
      return pendingStopRef.current;
    }

    const recorder = recorderRef.current;

    if (!recorder) {
      cleanupStream();
      setStatus("stopped");
      return Promise.resolve(null);
    }

    const finalize = () => {
      const blob = buildBlob();
      cleanupStream();
      recorderRef.current = null;
      setStatus("stopped");
      return blob;
    };

    if (recorder.state === "inactive") {
      return Promise.resolve(finalize());
    }

    const promise = new Promise((resolve, reject) => {
      const handleStop = () => resolve(finalize());
      const handleError = (event) => {
        finalize();
        reject(event?.error || new Error("Recorder failed to stop"));
      };

      recorder.addEventListener("stop", handleStop, { once: true });
      recorder.addEventListener("error", handleError, { once: true });

      try {
        recorder.requestData();
      } catch {
        // ignore request errors
      }

      try {
        recorder.stop();
      } catch (stopError) {
        handleError({ error: stopError });
      }
    });

    pendingStopRef.current = promise;
    return promise.finally(() => {
      pendingStopRef.current = null;
    });
  }, [buildBlob, cleanupStream]);

  const prepareRecorder = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone unavailable");
    }

    const mediaRecorderCtor =
      typeof window !== "undefined" ? window.MediaRecorder : undefined;
    if (!mediaRecorderCtor) {
      throw new Error("MediaRecorder unsupported");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const options = supportedMime ? { mimeType: supportedMime } : undefined;
    const recorder = new mediaRecorderCtor(stream, options);
    lastMimeRef.current = recorder.mimeType || supportedMime || "audio/webm";
    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      setError(event.error || new Error("Recording error"));
    };

    recorder.onpause = () => setStatus("paused");
    recorder.onresume = () => setStatus("recording");

    return recorder;
  }, [supportedMime]);

  const start = useCallback(async () => {
    try {
      await stop();
    } catch {
      // ignore previous stop failures
    }

    try {
      const recorder = await prepareRecorder();
      recorder.start();
      setStatus("recording");
      setError(null);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [prepareRecorder, stop]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setStatus("recording");
    }
  }, []);

  useEffect(() => {
    return () => {
      stop().catch(() => {});
    };
  }, [stop]);

  return { start, pause, resume, stop, status, error };
};

export default useRecorder;
