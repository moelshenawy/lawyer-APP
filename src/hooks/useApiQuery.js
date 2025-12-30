import { useState, useEffect, useCallback, useRef } from "react";
import { useLocaleChange } from "@/context/LocaleChangeContext";

export const useApiQuery = (queryFn, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { registerRefetch } = useLocaleChange();

  const queryFnRef = useRef(queryFn);
  const optionsRef = useRef(options);
  const abortControllerRef = useRef(null);

  queryFnRef.current = queryFn;
  optionsRef.current = options;

  const executeQuery = useCallback(async (...args) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const result = await queryFnRef.current(...args);

      if (!abortControllerRef.current.signal.aborted) {
        let processedData = result;

        if (optionsRef.current.onSuccess) {
          const transformed = optionsRef.current.onSuccess(result);
          processedData = transformed !== undefined ? transformed : result;
        }

        setData(processedData);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err);

        let processedData = null;
        if (optionsRef.current.onError) {
          const fallback = optionsRef.current.onError(err);
          processedData = fallback !== undefined ? fallback : null;
        }

        setData(processedData);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    executeQuery();
  }, [executeQuery]);

  useEffect(() => {
    if (optionsRef.current.immediate !== false) {
      executeQuery();
    }

    const unregister = registerRefetch(refetch);

    return () => {
      unregister();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeQuery, registerRefetch, refetch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

export const useApiMutation = (mutationFn, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const executeMutation = useCallback(
    async (...args) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const result = await mutationFn(...args);

        if (!abortControllerRef.current.signal.aborted) {
          if (options.onSuccess) {
            options.onSuccess(result);
          }
          return result;
        }
      } catch (err) {
        if (!abortControllerRef.current.signal.aborted) {
          setError(err);
          if (options.onError) {
            options.onError(err);
          }
          throw err;
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [mutationFn, options],
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    mutate: executeMutation,
    loading,
    error,
  };
};
