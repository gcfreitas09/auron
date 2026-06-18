export type GlobeCamera = {
  height: number;
  heading: number;
  pitch: number;
  roll: number;
};

export type MapLocation = {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
  zoom: number;
  camera: GlobeCamera;
  aliases: string[];
};

export type MapViewport = {
  label: string;
  latitude: number;
  longitude: number;
  zoom: number;
};

export type MapRuntimeCommand =
  | {
      nonce: number;
      type: "fly-to";
      location: MapLocation;
    }
  | {
      nonce: number;
      type: "zoom";
      delta: number;
    }
  | {
      nonce: number;
      type: "rotate";
      delta: number;
    }
  | {
      nonce: number;
      type: "tilt";
      delta: number;
    };

export const mapLocations: MapLocation[] = [
  {
    key: "globo",
    label: "Globo",
    latitude: 0,
    longitude: -45,
    zoom: 2,
    camera: {
      height: 20000000,
      heading: 0,
      pitch: -90,
      roll: 0
    },
    aliases: ["globo", "mundo", "terra"]
  },
  {
    key: "porto-alegre",
    label: "Porto Alegre",
    latitude: -30.0346,
    longitude: -51.2177,
    zoom: 13,
    camera: {
      height: 80000,
      heading: 18,
      pitch: -55,
      roll: 0
    },
    aliases: ["porto alegre"]
  },
  {
    key: "brasil",
    label: "Brasil",
    latitude: -14.235,
    longitude: -51.9253,
    zoom: 4,
    camera: {
      height: 6000000,
      heading: 0,
      pitch: -89,
      roll: 0
    },
    aliases: ["brasil"]
  },
  {
    key: "sao-paulo",
    label: "Sao Paulo",
    latitude: -23.5505,
    longitude: -46.6333,
    zoom: 12,
    camera: {
      height: 80000,
      heading: 12,
      pitch: -55,
      roll: 0
    },
    aliases: ["sao paulo"]
  },
  {
    key: "rio-de-janeiro",
    label: "Rio de Janeiro",
    latitude: -22.9068,
    longitude: -43.1729,
    zoom: 12,
    camera: {
      height: 80000,
      heading: 22,
      pitch: -55,
      roll: 0
    },
    aliases: ["rio de janeiro"]
  },
  {
    key: "nova-york",
    label: "Nova York",
    latitude: 40.7128,
    longitude: -74.006,
    zoom: 12,
    camera: {
      height: 85000,
      heading: 18,
      pitch: -55,
      roll: 0
    },
    aliases: ["nova york", "new york"]
  },
  {
    key: "toquio",
    label: "Toquio",
    latitude: 35.6762,
    longitude: 139.6503,
    zoom: 11,
    camera: {
      height: 90000,
      heading: 24,
      pitch: -55,
      roll: 0
    },
    aliases: ["toquio", "tokyo"]
  },
  {
    key: "londres",
    label: "Londres",
    latitude: 51.5072,
    longitude: -0.1276,
    zoom: 12,
    camera: {
      height: 85000,
      heading: 16,
      pitch: -55,
      roll: 0
    },
    aliases: ["londres", "london"]
  },
  {
    key: "paris",
    label: "Paris",
    latitude: 48.8566,
    longitude: 2.3522,
    zoom: 12,
    camera: {
      height: 85000,
      heading: 18,
      pitch: -55,
      roll: 0
    },
    aliases: ["paris"]
  }
];

export const defaultMapLocation = mapLocations[0];
export const homeMapLocation = mapLocations[1];

export function toMapViewport(location: MapLocation): MapViewport {
  return {
    label: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    zoom: location.zoom
  };
}

export function findMapLocation(query: string) {
  return mapLocations.find((location) => location.aliases.includes(query)) ?? null;
}
