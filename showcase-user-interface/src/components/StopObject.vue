<template>
  <l-marker :lat-lng="stopData.position" :draggable="false" :icon="icon">
    <l-tooltip
      :options="{ permanent: true, direction: 'bottom' }"
      class="iota_style"
      >{{ stopData.name }}</l-tooltip
    >
  </l-marker>
</template>

<script>
import { LMarker, LPopup, LIcon, LTooltip } from "vue2-leaflet";

export default {
  name: "StopObject",
  components: {
    LMarker,
    LTooltip
  },
  props: {
    id: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      icon: L.icon({
        iconUrl: "assets/images/stop.png",
        iconSize: [40, 40],
        iconAnchor: [20, 30],
        popupAnchor: [0, -20]
      })
    };
  },
  computed: {
    stopData() {
      return this.$store.getters["mapObjects/getStopById"](this.id);
    }
  }
};
</script>

<style scoped>
img {
  height: 3vh;
}

.iota_style {
  color: #04a997;
}
</style>
