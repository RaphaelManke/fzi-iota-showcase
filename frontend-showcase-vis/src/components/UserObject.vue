<template>
  <l-marker
    :lat-lng="userData.position"
    :draggable="false"
    :icon="icon"
    :z-index-offset="prioityZIndex"
  >
    <l-tooltip
      :options="{ permanent: true, direction: 'left', offset: [-20, -5] }"
      :z-index-offset="prioityZIndex"
      class="iota_style"
      >{{ userData.name }}</l-tooltip
    >
  </l-marker>
</template>

<script>
import { LMarker, LPopup, LIcon, LTooltip } from "vue2-leaflet";
export default {
  name: "UserObject",
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
      prioityZIndex: 9999,
      icon: L.icon({
        iconUrl: "assets/images/male.png",
        iconSize: [40, 40],
        iconAnchor: [20, 30],
        popupAnchor: [0, -20]
      })
    };
  },
  computed: {
    userData() {
      return this.$store.getters["mapObjects/getUserById"](this.id);
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
