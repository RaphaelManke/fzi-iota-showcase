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
        :position="withPopup"
      />
      <!--<l-marker :lat-lng="withPopup">
        <l-popup>
          <div @click="innerClick">
            I am a popup
            <p v-show="showParagraph">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sed pretium nisl, ut sagittis sapien. Sed vel sollicitudin nisi. Donec finibus semper metus id malesuada1.
            </p>
          </div>
        </l-popup>
      </l-marker>
      <l-marker :lat-lng="withTooltip">
        <l-tooltip :options="{permanent: true, interactive: true}">
          <div @click="innerClick">
            I am a tooltip
            <p v-show="showParagraph">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sed pretium nisl, ut sagittis sapien. Sed vel sollicitudin nisi. Donec finibus semper metus id malesuada2.
            </p>
          </div>
        </l-tooltip>
      </l-marker>-->
    </l-map>

    </div>
    
</template>

<script>
import { eventBus } from './../events.ts';
import L from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from 'vue2-leaflet';
import MapObject from './MapObject';


export default {
  name: 'MapVisu',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LTooltip,
    MapObject,
  },
  data() {
    return {
      zoom: 13,
      center: L.latLng(49.0091, 8.3799),
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      withPopup: L.latLng(49.0091, 8.3799),
      withTooltip: L.latLng(49.0091, 8.385),
      showParagraph: true,
      mapOptions: {
        zoomSnap: 0.5,
      },
    };
  },
  created() {
      // listen on events
  },
  methods: {
    showLongText() {
      this.showParagraph = !this.showParagraph;
    },
    innerClick() {
      alert('Click!');
    },
  },
};
</script>

<style scoped>
@import "../../node_modules/leaflet/dist/leaflet.css";

#mapVisu {
    height: 80vh;
    -webkit-box-shadow: 7px 7px 12px 1px rgba(173,173,173,0.8);
    -moz-box-shadow: 7px 7px 12px 1px rgba(173,173,173,0.8);
    box-shadow: 7px 7px 12px 1px rgba(173,173,173,0.8);
}

</style>

