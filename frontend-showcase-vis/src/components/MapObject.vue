<template>
  <l-marker
    :lat-lng="getPosition"
    :draggable="false"
    :icon="icon">
    <l-popup>
         1,5 Mi<img src="assets/images/iota.png">
    </l-popup>
    <l-tooltip v-if="this.type !== 'stop'" :options="{permanent: true, direction: 'bottom'}">
            {{paras.name}}
    </l-tooltip>
  </l-marker>
</template>

<script>
import { eventBus } from './../events.ts';
import { LMarker, LPopup, LIcon, LTooltip} from 'vue2-leaflet';
export default {
  name: 'MapObject',
  components: {
    LMarker,
    LPopup,
    LTooltip,
  },
  props: {
    type: {
        type: String,
        default: '',
    },
    initParas: {
      type: Object,
      default: () => {},
    },
  },
  data() {
      return {
        icon: L.icon({
            iconUrl: 'assets/images/' + this.type + '.png',
            iconSize: [40, 40],
            iconAnchor: [20, 30],
            popupAnchor: [0, -20],
      }),
      paras: this.initParas,
      position: L.latLng(this.initParas.lat, this.initParas.lng),
      };
  },
  created() {
      this.position = L.latLng(this.paras.lat, this.paras.lng);
      eventBus.on('updatedPos', (data) => {
        if (this.type !== 'stop') {
          this.position = L.latLng(this.position.lat + data.y / 1000, this.position.lng + data.x / 1000);
        }
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

<style scoped>

img {
    height: 10px;
}

</style>

