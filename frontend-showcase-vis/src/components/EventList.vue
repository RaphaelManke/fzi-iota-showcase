<template>

  <div class="eventList">

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
};

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


</style>
