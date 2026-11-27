'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type GeolocationStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported'
  | 'insecure';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationErrorDetails {
  code?: number;
  message: string;
}

export interface UseGeolocationOptions {
  onSuccess?: (coords: GeolocationCoordinates) => void;
  onError?: (status: GeolocationStatus, error?: GeolocationErrorDetails) => void;
}

export interface UseGeolocationReturn {
  status: GeolocationStatus;
  coords: GeolocationCoordinates | null;
  permissionState: PermissionState | 'unknown';
  error: GeolocationErrorDetails | null;
  isLocating: boolean;
  requestLocation: () => Promise<GeolocationCoordinates | null>;
  reset: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationErrorDetails | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('unknown');

  const mountedRef = useRef<boolean>(true);
  const isRequestingRef = useRef<boolean>(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Track unmount to prevent setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen to Permissions API changes when available
  useEffect(() => {
    let permStatus: PermissionStatus | null = null;

    const handlePermChange = () => {
      if (!mountedRef.current || !permStatus) return;
      const state = permStatus.state;
      setPermissionState(state);
      if (state === 'denied') {
        setStatus((prev) => (prev === 'success' ? prev : 'denied'));
        setError({
          code: 1,
          message: 'Location permission is denied in browser settings.',
        });
      } else if (state === 'granted') {
        // If previously denied, allow user to try again
        setStatus((prev) => (prev === 'denied' ? 'idle' : prev));
        setError(null);
      }
    };

    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'permissions' in navigator &&
      typeof navigator.permissions?.query === 'function'
    ) {
      try {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((p) => {
            if (!mountedRef.current) return;
            permStatus = p;
            setPermissionState(p.state);
            p.onchange = handlePermChange;
          })
          .catch((err) => {
            // Safari or specific browser quirks
            console.warn('[useGeolocation] Permissions query error:', err);
          });
      } catch (err) {
        // Ignored for environments where query fails
      }
    }

    return () => {
      if (permStatus) {
        permStatus.onchange = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus('idle');
    setCoords(null);
    setError(null);
  }, []);

  const requestLocation = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    // Prevent duplicate calls on double-click
    if (isRequestingRef.current) {
      return null;
    }

    // Check secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      const errDetails: GeolocationErrorDetails = {
        code: 0,
        message: 'Geolocation requires a secure context (HTTPS or localhost).',
      };
      if (mountedRef.current) {
        setStatus('insecure');
        setError(errDetails);
      }
      optionsRef.current.onError?.('insecure', errDetails);
      return null;
    }

    // Check navigator.geolocation support
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const errDetails: GeolocationErrorDetails = {
        code: 0,
        message: 'Geolocation is not supported by your browser.',
      };
      if (mountedRef.current) {
        setStatus('unsupported');
        setError(errDetails);
      }
      optionsRef.current.onError?.('unsupported', errDetails);
      return null;
    }

    isRequestingRef.current = true;
    if (mountedRef.current) {
      setStatus('requesting');
      setError(null);
    }

    return new Promise<GeolocationCoordinates | null>((resolve) => {
      // First attempt options: fast, cached, standard accuracy
      const firstOptions: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      };

      // Second attempt retry options: high accuracy, longer timeout
      const retryOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      };

      const handleSuccess = (position: GeolocationPosition) => {
        isRequestingRef.current = false;
        const resultCoords: GeolocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        if (mountedRef.current) {
          setCoords(resultCoords);
          setStatus('success');
          setError(null);
        }

        optionsRef.current.onSuccess?.(resultCoords);
        resolve(resultCoords);
      };

      const handleFinalFailure = (err: GeolocationPositionError, finalStatus: GeolocationStatus) => {
        isRequestingRef.current = false;
        console.warn(`[useGeolocation] Failed with status "${finalStatus}":`, {
          code: err.code,
          message: err.message,
        });

        const errDetails: GeolocationErrorDetails = {
          code: err.code,
          message: err.message || 'Unable to retrieve location.',
        };

        if (mountedRef.current) {
          setStatus(finalStatus);
          setError(errDetails);
        }

        optionsRef.current.onError?.(finalStatus, errDetails);
        resolve(null);
      };

      const executeAttempt = (isRetry: boolean) => {
        const currentOpts = isRetry ? retryOptions : firstOptions;

        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (err: GeolocationPositionError) => {
            console.warn(`[useGeolocation] Attempt ${isRetry ? 2 : 1} error:`, {
              code: err.code,
              message: err.message,
            });

            // Map code 1: PERMISSION_DENIED (no retry)
            if (err.code === err.PERMISSION_DENIED) {
              handleFinalFailure(err, 'denied');
              return;
            }

            // If first attempt failed with code 2 (POSITION_UNAVAILABLE) or code 3 (TIMEOUT), retry once with high accuracy
            if (!isRetry && (err.code === err.POSITION_UNAVAILABLE || err.code === err.TIMEOUT)) {
              console.log(
                `[useGeolocation] First attempt failed with code ${err.code}. Retrying once with high accuracy...`
              );
              executeAttempt(true);
              return;
            }

            // Retry failed or direct failure mapping
            if (err.code === err.POSITION_UNAVAILABLE) {
              handleFinalFailure(err, 'unavailable');
            } else if (err.code === err.TIMEOUT) {
              handleFinalFailure(err, 'timeout');
            } else {
              handleFinalFailure(err, 'unavailable');
            }
          },
          currentOpts
        );
      };

      // Launch first attempt
      executeAttempt(false);
    });
  }, []);

  return {
    status,
    coords,
    permissionState,
    error,
    isLocating: status === 'requesting',
    requestLocation,
    reset,
  };
}
