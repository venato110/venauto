import { useEffect, useRef } from "react";
import L from "leaflet";
import { Tables } from "@/integrations/supabase/types";

type ParkingSpot = Tables<"parking_spots">;

const createIcon = (color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const availableIcon = createIcon("hsl(145, 63%, 42%)");
const reservedIcon = createIcon("hsl(0, 72%, 51%)");

interface ParkingMapProps {
  spots: ParkingSpot[];
  center: [number, number];
  onSpotClick: (spot: ParkingSpot) => void;
}

const ParkingMap = ({ spots, center, onSpotClick }: ParkingMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo(center, 14, { duration: 1 });
    }
  }, [center]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    spots.forEach((spot) => {
      const marker = L.marker([spot.latitude, spot.longitude], {
        icon: spot.status === "available" ? availableIcon : reservedIcon,
      })
        .addTo(mapRef.current!)
        .on("click", () => onSpotClick(spot));

      marker.bindPopup(
        `<div style="font-size:13px"><strong>${spot.name}</strong><br/>${spot.price_per_hour} AZN/hr</div>`
      );

      markersRef.current.push(marker);
    });
  }, [spots, onSpotClick]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
};

export default ParkingMap;
