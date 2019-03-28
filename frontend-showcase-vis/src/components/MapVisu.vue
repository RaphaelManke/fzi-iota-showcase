<template>
    
    <div id="mapVisu">
      <div v-for="conn in store.connections">{{ conn}} </div>
    <l-map
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
    >
      <l-tile-layer
        :url="url"
        :attribution="attribution"
      />
      <vehicle-object
        v-for="vehicle in vehicles" :key="vehicle.id"
        :paras="vehicle"
      />
      <user-object
        :paras="testGuy"
      />
    
      <stop-object
        v-for="stop in stops" :key="stop.id"
        :paras="stop"
      />
      <!--integrate connections into map-->
      <l-polyline
        v-for="connection in store"
        :latLngs="connection.path"
        :color="connectionColor(connection)"
      />
      
    </l-map>
  
    </div>
    
</template>

<script>
import { eventBus } from './../events.ts';
import L from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LPolyline } from 'vue2-leaflet';
import StopObject from './StopObject';
import VehicleObject from './VehicleObject';
import UserObject from './UserObject';

// load geo data locally for testing
import data from '../../public/assets/geojson/geojson.js';



export default {
  name: 'MapVisu',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LPolyline,
    StopObject,
    VehicleObject,
    UserObject,
  },
  data() {
    return {
      zoom: 13,
      center: L.latLng(49.0091, 8.3799),
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      testGuy: {position: [49.0091, 8.381], name: 'Peter', type: 'male'},
      mapOptions: {
        zoomSnap: 0.25,
      },
      data: data,
    };
  },
  created() {
      // listen on events
      
  },
  methods: {
    connectionColor (connection) {
      switch (connection.type) {
            case 'car': return "#ff0000";
            case 'tram':   return "#EAC02B";
        }
      },
    },
  computed: {
    
      store() {
        return this.$store.getters['mapObjects/getConnections'];
      },
      stops() {
        return this.$store.getters['mapObjects/getStops'];
      },
      vehicles() {
        
        return this.$store.getters['mapObjects/getVehicles'];

      },
      vehiclesById() {
        
        return this.$store.getters['mapObjects/getStopsById']('A');

      }
  }
};
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";

/* custom tooltip styling*/
.leaflet-tooltip {
  border: 1px solid #a3a3a3;;
  transition: 3s linear;
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

