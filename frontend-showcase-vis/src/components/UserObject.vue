<template>
  <l-marker
    :lat-lng="paras.position"
    :draggable="false"
    :icon="icon">
    <l-tooltip :options="{permanent: true, direction: 'bottom'}" class="iota_style">
            {{paras.name}}
    </l-tooltip>
  </l-marker>
</template>

<script>
import { eventBus } from './../events.ts';
import { LMarker, LPopup, LIcon, LTooltip} from 'vue2-leaflet';
export default {
  name: 'UserObject',
  components: {
    LMarker,
    LPopup,
    LTooltip,
  },
  props: {
    paras: {
      type: Object,
      default: () => {},
    },
  },
  data() {
      return {
        icon: L.icon({
            iconUrl: 'assets/images/male.png',
            iconSize: [40, 40],
            iconAnchor: [20, 30],
            popupAnchor: [0, -20],
      }),
      };
  },

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

