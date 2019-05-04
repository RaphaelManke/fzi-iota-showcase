<template>
  <l-marker
    :lat-lng="vehicleData.position"
    :draggable="false"
    :icon="vehicleIcon"
    :z-index-offset="prioityZIndex"
  >
    <!--<l-tooltip
      :options="{ permanent: true, direction: 'bottom', offset: [0, 15] }"
      :z-index-offset="prioityZIndex"
      class="iota_style"
    >
      {{ vehicleData.name }}
    </l-tooltip>-->
  </l-marker>
</template>

<script>
import { LMarker, LPopup, LIcon } from "vue2-leaflet";
export default {
  name: "VehicleObject",
  components: {
    LMarker
  },
  props: {
    id: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      prioityZIndex: 9999
    };
  },
  computed: {
    vehicleData() {
      return this.$store.getters["mapObjects/getVehicleById"](this.id);
    },
    vehicleIcon() {
      return L.icon({
        iconUrl:
          "assets/images/" +
          this.$store.getters["mapObjects/getVehicleById"](this.id).info.type +
          ".png",
        iconSize: [40, 40],
        iconAnchor: [20, 30],
        popupAnchor: [0, -20]
      });
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
