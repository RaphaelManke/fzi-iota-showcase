<template>
  <l-marker :lat-lng="vehicleData.position" :draggable="false" :icon="vehicleIcon">
    <l-tooltip
      :options="{permanent: true, direction: 'bottom'}"
      class="iota_style"
    >{{vehicleData.name}}</l-tooltip>
  </l-marker>
</template>

<script>
import { eventBus } from "./../events.ts";
import { LMarker, LPopup, LIcon, LTooltip } from "vue2-leaflet";
export default {
  name: "VehicleObject",
  components: {
    LMarker,
    LPopup,
    LTooltip
  },
  props: {
    id: {
      type: String
    }
  },
  data() {
    return {
      icon: L.icon({
        iconUrl: "assets/images/" + vehicleData.info.type + ".png",
        iconSize: [40, 40],
        iconAnchor: [20, 30],
        popupAnchor: [0, -20]
      })
    };
  },
  created() {
    this.icon = L.icon({
      iconUrl: "assets/images/" + vehicleData.info.type + ".png",
      iconSize: [40, 40],
      iconAnchor: [20, 30],
      popupAnchor: [0, -20]
    });
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

