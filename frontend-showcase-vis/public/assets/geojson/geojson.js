export default {
  connections: [
    {
      id: "MARTPLATZKARLSRUHE9TRAM9KRONENPLATZKARLSRUHE",
      coordinates: [[49.00954, 8.403885], [49.009304, 8.410162]],
      type: "tram"
    },
    {
      id: "KRONENPLATZKARLSRUHE9TRAM9SCHECKINKARLSRUHE",
      coordinates: [
        [49.009304, 8.410162],
        [49.007649, 8.409987],
        [49.005752, 8.41036]
      ],
      type: "tram"
    },
    {
      id: "KRONENPLATZKARLSRUHE9CAR9SCHECKINKARLSRUHE",
      coordinates: [
        [49.009304, 8.410262],
        [49.007649, 8.410087],
        [49.005752, 8.41046]
      ],
      type: "car"
    }
  ],
  stops: [
    {
      id: "MARTPLATZKARLSRUHE",
      name: "Marktplatz",
      coordinates: [49.00954, 8.403885]
    },
    {
      id: "KRONENPLATZKARLSRUHE",
      name: "Kronenplatz",
      coordinates: [49.009288, 8.410087]
    },
    {
      id: "SCHECKINKARLSRUHE",
      name: "Rüppurer Tor",
      coordinates: [49.005752, 8.41036]
    }
  ],
  vehicles: [
    {
      id: "CARA",
      name: "Tessi",
      coordinates: [49.0091, 8.3799],
      type: "car"
    }
  ]
};
