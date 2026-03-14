import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

interface MapCenterProps {
  center: [number, number];
}

const MapCenter = ({ center }: MapCenterProps) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1 });
  }, [center, map]);
  return null;
};

interface ParkingMapProps {
  spots: ParkingSpot[];
  center: [number, number];
  onSpotClick: (spot: ParkingSpot) => void;
}

const ParkingMap = ({ spots, center, onSpotClick }: ParkingMapProps) => {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCenter center={center} />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.latitude, spot.longitude]}
          icon={spot.status === "available" ? availableIcon : reservedIcon}
          eventHandlers={{
            click: () => onSpotClick(spot),
          }}
        >
          <Popup>
            <div className="text-sm font-medium">{spot.name}</div>
            <div className="text-xs text-muted-foreground">{spot.price_per_hour} AZN/hr</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ParkingMap;
