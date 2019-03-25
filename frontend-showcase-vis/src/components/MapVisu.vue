<template>

    <div id="mapVisu">

    <l-map
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
    >
      <l-tile-layer
        :url="url"
        :attribution="attribution"
      />
      <map-object
        type="car"
        :initParas="testCar"
      />
      <map-object
        type="male"
        :initParas="testGuy"
      />
      <!-- add stops -->
      <map-object
        v-for="stop in env.stops"
        type="stop"
        :initParas="stop"
      />
      <!--integrate tram lines into map-->
      <l-geo-json
        :geojson="tram.geojson"
      />
      
    </l-map>

    </div>
    
</template>

<script>
import { eventBus } from './../events.ts';
import L from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LGeoJson } from 'vue2-leaflet';
import MapObject from './MapObject';

// load geo data locally
import data from '../../public/assets/geojson/geojson.js';



export default {
  name: 'MapVisu',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LGeoJson,
    MapObject,
  },
  data() {
    return {
      zoom: 13,
      center: L.latLng(49.0091, 8.3799),
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      testCar: {lat: 49.0091, lng: 8.3799, name: 'Tessi'},
      testGuy: {lat: 49.0091, lng: 8.381, name: 'Peter'},
      mapOptions: {
        zoomSnap: 0.25,
      },
      env: {},
      // integrate tram lines
      tram: {
        geojson: data.tram,
      },
    };
  },
  created() {
      // listen on events
      
  },
  sockets: {
      connect() {
        // get env data from server
        this.$http.get(this.$hostname + '/env').then(function(env) {
               this.env = env.body;
            });
      }
  },
};
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";

.leaflet-tooltip {
  border: 1px solid #a3a3a3;;
  color: #04a997;
  transition: 3s linear;
}

.leaflet-popup-content {
  color: #04a997;
}

.leaflet-tooltip-bottom::before {
    border-bottom-color: #a3a3a3;;
} 

.leaflet-marker-icon {
  transition: 3s linear;
}

#mapVisu {
    height: 70vh;
    -webkit-box-shadow: 7px 7px 12px 1px rgba(173,173,173,0.8);
    -moz-box-shadow: 7px 7px 12px 1px rgba(173,173,173,0.8);
    box-shadow: 7px 7px 12px 1px rgba(173,173,173,0.8);
}

</style>

