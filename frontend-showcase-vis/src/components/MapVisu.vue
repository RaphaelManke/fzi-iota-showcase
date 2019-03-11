<template>

    <div id="mapVisu">

        <div id="mapGrid">

        <basicPanel v-for="entry in matrix" :key="entry" 
            :location="entry">
        </basicPanel>

        </div>

        <vehicleSpace></vehicleSpace>

    </div>
    
</template>

<script>

import BasicPanel from './BasicPanel';
import VehicleSpace from './VehicleSpace';
import { eventBus } from './../events.ts';


export default{
  data() {
      return {
          matrix: ['1', '2', '3', '4', '5', '6', '7', '8'],
      };
  },
  components: {
      BasicPanel,
      VehicleSpace,
  },
  methods: {},
  computed: {},
};
</script>

<style scoped>
#mapVisu {
    position: relative;
    border: 10px solid gray;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.3), 0 12px 40px 0 rgba(0, 0, 0, 0.3);
    border-radius: 10px;
}

#mapGrid {
    display: grid;
    grid-template-columns: auto auto auto auto;
}

</style>

