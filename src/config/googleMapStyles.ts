export type GoogleMapStyle = {
  elementType?: string;
  featureType?: string;
  stylers: Record<string, string | number>[];
};

export const mapExploreLightStyles: GoogleMapStyle[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5fbfb" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#898a8c" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a9aaac" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#e1e8e8" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#f5fbfb" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#f3f4f8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ color: "#c0c4d8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a0a6bf" }],
  },
  {
    featureType: "poi.business",
    elementType: "geometry",
    stylers: [{ color: "#f9f3e8" }],
  },
  {
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [{ color: "#eff4ff" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#f1f6e6" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a9c76c" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e5e5e6" }, { weight: 1 }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ color: "#dcdcdc" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b6bcc3" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 1 }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#e9e9ea" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{ color: "#dcdcdc" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b6b6b9" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dcdcdc" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d3d3d4" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a3a5a8" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e5e5e6" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#fcf1ee" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.icon",
    stylers: [{ color: "#c6d7ff" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a0bdff" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e0ecfe" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9dc6fc" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },
];

export const mapExploreVisualizationStyles: GoogleMapStyle[] = [
  ...mapExploreLightStyles,
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

export const mapExploreDarkStyles: GoogleMapStyle[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#1f232b" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#aab3c2" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#171a20" }, { weight: 2 }],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8f98a8" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#242a33" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#1b2028" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#272d37" }],
  },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ color: "#6f7a8d" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b95a6" }],
  },
  {
    featureType: "poi.business",
    elementType: "geometry",
    stylers: [{ color: "#2c2c32" }],
  },
  {
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [{ color: "#273245" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#223126" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#303642" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#222833" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8f98a8" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#39404d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#465061" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2b303a" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ color: "#737f95" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f91bf" }],
  },
];

export const mapExploreVisualizationDarkStyles: GoogleMapStyle[] = [
  ...mapExploreDarkStyles,
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
];
