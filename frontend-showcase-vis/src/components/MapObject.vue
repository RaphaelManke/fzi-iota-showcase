<template>
  <l-marker
    :lat-lng="getPosition"
    :draggable="false"
    :icon="icon">
    <l-popup content="ID"/>
  </l-marker>
</template>

<script>
import { eventBus } from './../events.ts';
import { LMarker, LPopup, LIcon } from 'vue2-leaflet';
export default {
  name: 'MapObject',
  components: {
    LMarker,
    LPopup,
  },
  props: {
    initPosition: {
      type: Object,
      default: () => {},
    },
  },
  data() {
      return {
        icon: L.icon({
            iconUrl: 'assets/images/car.png',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -15],
      }),
      position: this.initPosition,
      };
  },
  created() {
      eventBus.on('updatedPos', (data) => {
            this.position = L.latLng(this.position.lat + data.y / 1000, this.position.lng + data.x / 1000);
      },
      );
  },
  computed: {
      getPosition() {
          return this.position;
      },
  },
};
</script>