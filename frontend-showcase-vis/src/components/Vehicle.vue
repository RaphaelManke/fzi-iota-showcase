<template>

  <div class="vehicle" v-bind:style="{top: specs.y*10 + '%', left: specs.x*10 + '%'}">

      <img src="../assets/car.png">

  </div>
  
</template>

<script>
import { eventBus } from './../events.ts';

export default {
  props: ['specs'],
  created() {
    eventBus.on('updatedPos', (data) => {
      if (data.id === this.specs.id) {
        this.specs.x = data.x;
        this.specs.y = data.y;
      }
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.vehicle {
    position: absolute;
    text-align: center;
    height: 8%;
    width: 8%;
    transition: 1s linear;
}

img {
    height: 100%;
}

</style>
