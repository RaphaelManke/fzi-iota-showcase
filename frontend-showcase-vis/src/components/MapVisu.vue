<template>

    <div id="mapVisu">

        <div id="mapGrid">

        <basicPanel v-for="entry in matrix" :key="entry" 
            :location="entry">
        </basicPanel>

        </div>

        <div id="vehicleSpace" v-on:mousemove="moveCar">
            
            <vehicle v-bind:style="{top: getTop + 'px', left: getLeft + 'px'}"></vehicle>

        </div>

    </div>
    
</template>

<script>
import { Component, Watch, Prop, Vue } from 'vue-property-decorator';
import BasicPanel from './BasicPanel';
import Vehicle from './Vehicle';


export default{
  data() {
      return {
          matrix: ['1', '2', '3', '4', '5', '6', '7', '8'],
          top: 100,
          left: 100,
      };
  },
  components: {
      BasicPanel,
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

#vehicleSpace {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent;
}

</style>

