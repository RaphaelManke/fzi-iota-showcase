<template>

    <div id="vehicleSpace">
            
            <vehicle v-bind:style="{top: getTop + 'px', left: getLeft + 'px'}"></vehicle>

    </div>
    
</template>

<script>
import Vehicle from './Vehicle';
import { eventBus } from './../events.ts';


export default{
  data() {
      return {

      };
  },
  components: {
      Vehicle,
  },
  methods: {
      moveCar(event) {
          this.top = event.offsetY;
          this.left = event.offsetX;
      },
  },
  computed: {
        getTop() {
            return this.top;
        },
        getLeft() {
            return this.left;
        },
  },
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

