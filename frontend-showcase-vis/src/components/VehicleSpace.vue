<template>

    <div id="vehicleSpace">
            
            <vehicle v-for="vehicle in vehicles" v-bind:specs="vehicle"></vehicle>

    </div>
    
</template>

<script>
import Vehicle from './Vehicle';
import { eventBus } from './../events.ts';


export default{
  data() {
      return {
        vehicles: [],
        clients: {},
      };
  },
  components: {
      Vehicle,
  },
  created() {
      eventBus.on('vehicleAdded', (data) => {
        this.vehicles.push(data);
      });
  },
  methods: {},
  computed: {},
};
</script>

<style scoped>

#vehicleSpace {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent;
}

</style>

