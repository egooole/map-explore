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
