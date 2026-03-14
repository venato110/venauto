import { useEffect, useRef, useState } from "react";
import L from "leaflet";

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
}

const LocationPicker = ({ latitude, longitude, onLocationChange }: LocationPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const defaultCenter: [number, number] = [
    latitude ? parseFloat(latitude) : 40.3693,
    longitude ? parseFloat(longitude) : 49.8371,
  ];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OSM',
    }).addTo(map);

    // Add marker if we already have coords
    if (latitude && longitude) {
      markerRef.current = L.marker(defaultCenter).addTo(map);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationChange(lat.toFixed(6), lng.toFixed(6));

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync marker when coords change externally (e.g. "Use my location")
  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    mapRef.current.flyTo([lat, lng], 15, { duration: 0.8 });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full rounded-xl overflow-hidden border border-border"
    />
  );
};

export default LocationPicker;
