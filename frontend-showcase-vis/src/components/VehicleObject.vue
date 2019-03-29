<template>
  <l-marker :lat-lng="vehicleData.position" :draggable="false" :icon="icon" zIndexOffset="999">
    <l-tooltip
      :options="{ permanent: true, direction: 'bottom' }"
      zIndexOffset="999"
      class="iota_style">
      {{
      vehicleData.name
      }}
    </l-tooltip>
  </l-marker>
</template>

<script>
import { eventBus } from "./../events.ts";
import { LMarker, LPopup, LIcon, LTooltip } from "vue2-leaflet";
export default {
  name: "VehicleObject",
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
        iconUrl: "assets/images/car.png",
        iconSize: [40, 40],
        iconAnchor: [20, 30],
        popupAnchor: [0, -20]
      })
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
