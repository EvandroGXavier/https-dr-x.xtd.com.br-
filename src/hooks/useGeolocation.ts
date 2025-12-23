import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        loading: false,
      }));
      return;
    }

    const success = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      });
    };

    const error = (error: GeolocationPositionError) => {
      setLocation(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 300000, // 5 minutes
    });
  }, []);

  const getNavigationUrl = (destinationAddress: string): string => {
    const encodedAddress = encodeURIComponent(destinationAddress);
    
    if (location.latitude && location.longitude) {
      // With current location
      return `https://www.google.com/maps/dir/${location.latitude},${location.longitude}/${encodedAddress}`;
    } else {
      // Without current location - let user choose
      return `https://www.google.com/maps/search/${encodedAddress}`;
    }
  };

  return {
    ...location,
    getNavigationUrl,
  };
}