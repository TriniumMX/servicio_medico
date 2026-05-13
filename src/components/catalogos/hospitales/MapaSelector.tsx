// src/components/catalogos/hospitales/MapaSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icono default
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Coordenadas de San Juan del Río, Qro.
const SJR_COORDS: [number, number] = [20.3889, -99.9958];

interface Props {
  lat?: number;
  lng?: number;
  searchQuery?: string; // Nueva prop para buscar lo que el usuario escribe
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

// Componente para mover el mapa cuando cambia la búsqueda (Input -> Mapa)
function MapUpdater({ searchQuery, onLocationSelect }: { searchQuery?: string, onLocationSelect: any }) {
  const map = useMap();

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 4) return;

    // Retrasamos un poco la búsqueda para no saturar (debounce simple)
    const timer = setTimeout(() => {
      // Limitamos la búsqueda a la zona de San Juan del Río usando viewbox
      // viewbox=<left>,<top>,<right>,<bottom> (aprox)
      const viewbox = '-100.10,20.45,-99.90,20.30';
      
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=${viewbox}&bounded=1&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const newLat = parseFloat(lat);
            const newLng = parseFloat(lon);
            
            // Movemos el mapa
            map.flyTo([newLat, newLng], 16);
            
            // Actualizamos el marcador (pero SIN cambiar la dirección escrita para no hacer loop infinito)
            // Pasamos undefined en address para que el form sepa que no debe sobrescribir el texto
            onLocationSelect(newLat, newLng, undefined); 
          }
        })
        .catch(err => console.error("Error buscando dirección:", err));
    }, 1000); // Espera 1 segundo después de que dejes de escribir

    return () => clearTimeout(timer);
  }, [searchQuery, map, onLocationSelect]);

  return null;
}

// Componente para detectar clics en el mapa (Mapa -> Input)
function LocationMarker({ onLocationSelect, position }: { onLocationSelect: any, position: any }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      // Reverse Geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          // Aquí SÍ enviamos la dirección para que se escriba en el input
          onLocationSelect(lat, lng, data.display_name);
        })
        .catch(() => {
          onLocationSelect(lat, lng, '');
        });
    },
  });

  useEffect(() => {
    if (position) {
      // Si hay posición inicial, centramos ahí, si no, no hacemos nada para dejar al usuario navegar
      // map.flyTo(position, map.getZoom()); 
    }
  }, [position, map]);

  return position ? <Marker position={position} icon={iconDefault} /> : null;
}

export default function MapaSelector({ lat, lng, searchQuery, onLocationSelect }: Props) {
  const position: [number, number] | null = lat && lng ? [lat, lng] : null;

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 z-0 relative">
      <MapContainer 
        center={position || SJR_COORDS} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Controlador de búsqueda por texto */}
        <MapUpdater searchQuery={searchQuery} onLocationSelect={onLocationSelect} />
        
        {/* Controlador de clics */}
        <LocationMarker onLocationSelect={onLocationSelect} position={position} />
      </MapContainer>
      
      {!position && (
        <div className="absolute bottom-2 left-2 bg-white/80 px-2 py-1 text-xs rounded z-[1000]">
          San Juan del Río, Qro.
        </div>
      )}
    </div>
  );
}