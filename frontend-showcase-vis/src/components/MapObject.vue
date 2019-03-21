<template>
  <l-marker
    :lat-lng="position"
    :title="title"
    :draggable="false"
    :icon="icon">
    <l-popup content="ID"/>
  </l-marker>
</template>

<script>
import { LMarker, LPopup, LIcon } from 'vue2-leaflet';
export default {
  name: 'MapObject',
  components: {
    LMarker,
    LPopup,
  },
  props: {
    position: {
      type: Object,
      default: () => {},
    },
  },
  data() {
      return {
        icon: L.icon({
            iconUrl: 'assets/car.png',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
      }),
      }
  },
  created() {
      // listen on events
  },
};
</script>