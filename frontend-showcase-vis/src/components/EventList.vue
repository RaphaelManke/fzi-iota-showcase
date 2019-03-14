<template>

  <div id="eventList">
           
    <ul>

          <li v-for="event in events">{{event}}</li>

    </ul>

  </div>
  
</template>

<script>
import { eventBus } from '../events';

export default {
  data() {
      return {
          events: [],
      };
  },
  created() {
      eventBus.on('**', (data) => {
        this.events.push(eventBus.event + ': ' + JSON.stringify(data));
      });
  },
  updated() {
  this.$el.scrollTop = this.$el.scrollHeight;
  },
};

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

#eventList {
    position: relative;
    max-height: 90%;
    height: 90%;
    margin-top: 16%;
    overflow-y: scroll;
    overflow-x: hidden;
    border: solid 2px black;
    margin-left: 10px;
}

</style>
