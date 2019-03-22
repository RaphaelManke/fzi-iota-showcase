export default {
  tram: {
    'type': 'FeatureCollection',
    'features': [
      {
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [49.009938876997616,8.395093923217814],
            [49.009247858168976,8.403897285461426]
          ]
        },
        'properties': {
          'popupContent': 'This is a free bus line that will take you across downtown.',
          'underConstruction': false
        },
        'id': 'ATOB'
      },
      {
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [49.009247858168976,8.403897285461426],
            [49.00930415767915,8.410162925720215]
          ]
        },
        'properties': {
          'popupContent': 'This is a free bus line that will take you across downtown.',
          'underConstruction': true
        },
        'id': 'BTOC'
      },
      {
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [49.00930415767915,8.410162925720215],
            [49.00598237765667,8.410420417785645]
          ]
        },
        'properties': {
          'popupContent': 'This is a free bus line that will take you across downtown.',
          'underConstruction': false
        },
        'id': 'CTOD'
      }
    ]
  },
  
};
