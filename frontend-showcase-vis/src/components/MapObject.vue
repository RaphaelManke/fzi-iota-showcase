<template>
  <l-marker
    v-if="shown"
    :lat-lng="position"
    :draggable="false"
    :icon="icon">
    <l-tooltip v-if="this.type !== 'stop'" :options="{permanent: true, direction: 'bottom'}" class="iota_style">
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
      borded: false,
      };
  },
  created() {
 
      eventBus.on('updatedPos', (data) => {
        if (this.type !== 'stop') {
          this.position = data;
        }
        },
      );
  },
  computed: {
      position: {
          get() {
            return L.latLng(this.paras.lat, this.paras.lng);
          },
          set(data) {
            this.paras.lat = this.paras.lat + data.y / 1000;
            this.paras.lng = this.paras.lng + data.x / 1000;
          },
      },
      shown() {
        return !this.borded;
      }
  },
};
</script>

<style scoped>

img {
    height: 10px;
}

.iota_style {
  color: #04a997;
}

</style>

