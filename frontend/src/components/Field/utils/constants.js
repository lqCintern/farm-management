import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Default marker icon
export const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Set default marker icon
L.Marker.prototype.options.icon = DefaultIcon;

// Default center for the map
export const DEFAULT_CENTER = [20.14, 105.848];
export const DEFAULT_ZOOM = 15;

// Map Types
export const MAP_TYPES = {
  SATELLITE: "satellite",
  OSM: "osm",
};

// Default label opacity
export const DEFAULT_LABEL_OPACITY = 0.8;
