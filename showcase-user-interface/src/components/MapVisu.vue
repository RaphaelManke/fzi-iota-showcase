<template>
  <div>
    <l-map :zoom="zoom" :center="userInfo.position" :options="mapOptions">
      <l-tile-layer :url="url" :attribution="attribution" />

      <stop-object v-for="stop in stops" :id="stop.id" :key="stop.id" />
      <!--integrate connections into map-->
      <l-polyline
        v-for="connection in connections"
        :key="connection.from + connection.to"
        :lat-lngs="connection.path"
        :color="connectionColor(connection)"
      />

      <vehicle-object
        v-for="vehicle in vehicles"
        :id="vehicle.id"
        :key="vehicle.id"
      />
      <user-object :paras="userInfo" />
    </l-map>
  </div>
</template>

<script>
import L from "leaflet";
import { LMap, LTileLayer, LMarker, LPopup, LPolyline } from "vue2-leaflet";
import StopObject from "./StopObject";
import VehicleObject from "./VehicleObject";
import UserObject from "./UserObject";

export default {
  name: "MapVisu",
  components: {
    LMap,
    LTileLayer,
    LPolyline,
    StopObject,
    VehicleObject,
    UserObject
  },
  data() {
    return {
      zoom: 16,
      url: this.$osm, // for BW Map: http://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      mapOptions: {
        zoomSnap: 0.25
      }
    };
  },
  computed: {
    connections() {
      return this.$store.getters["mapObjects/getConnections"];
    },
    stops() {
      return this.$store.getters["mapObjects/getStops"];
    },
    vehicles() {
      return this.$store.getters["mapObjects/getVehicles"];
    },
    userInfo() {
      return this.$store.getters["user/getUserInfo"];
    }
  },
  methods: {
    connectionColor(connection) {
      switch (connection.type) {
        case "car":
          return "#ff0000";
        case "tram":
          return "#EAC02B";
        case "bike":
          return "#7ae047";
      }
    }
  }
};
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";

/* custom tooltip styling*/
.leaflet-tooltip {
  border: 1px solid #a3a3a3;
  transition: 0.5s linear;
}

.leaflet-tooltip-bottom::before {
  border-bottom-color: #a3a3a3;
}

.leaflet-marker-icon {
  transition: 0.5s linear;
}
</style>
