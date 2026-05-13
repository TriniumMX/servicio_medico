// src/components/catalogos/hospitales/MapaEdicion.tsx
'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  lat: number;
  lng: number;
  // Actualizamos la interfaz para aceptar la dirección opcional
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && lat && lng) {
      map.setView([lat, lng], 16);
      initialized.current = true;
    }
  }, [lat, lng, map]);

  return null;
}

// --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
function LocationMarker({ position, onLocationSelect }: { position: [number, number], onLocationSelect: any }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      
      // 1. Llamamos a la API de Nominatim (OpenStreetMap)
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          // 2. Enviamos lat, lng Y la dirección encontrada
          onLocationSelect(lat, lng, data.display_name);
        })
        .catch((err) => {
          console.error("Error obteniendo dirección", err);
          // Si falla, enviamos solo coordenadas
          onLocationSelect(lat, lng, undefined);
        });
    },
  });

  return <Marker position={position} icon={iconDefault} />;
}

export default function MapaEdicion({ lat, lng, onLocationSelect }: Props) {
  const initialLat = lat || 20.3889;
  const initialLng = lng || -99.9958;

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 z-0 relative">
      <MapContainer 
        center={[initialLat, initialLng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={initialLat} lng={initialLng} />
        <LocationMarker position={[lat || initialLat, lng || initialLng]} onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}