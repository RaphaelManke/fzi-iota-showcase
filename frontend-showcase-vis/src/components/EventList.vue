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
    max-height: 100%;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
}

</style>
