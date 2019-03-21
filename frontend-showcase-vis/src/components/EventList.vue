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
  name: 'EventList',
  data() {
      return {
          events: [],
      };
  },
  created() {
      eventBus.on('**', (data) => {
        this.events.push(eventBus.event + ': ' + JSON.stringify(data));
        if (this.events.length > 11) { this.events.shift(); }
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
    max-height: 91%;
    height: 91%;
    margin-top: 16%;
    overflow-y: scroll;
    overflow-x: hidden;
    border: solid 2px black;
    margin-left: 7%;
}

ul {
  margin-left: -8%;
}


</style>
