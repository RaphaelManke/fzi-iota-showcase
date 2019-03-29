<template>
  <div id="eventListContainer">
    <h2 style="text-align: center; margin: 0;">
      Transactions
    </h2>

    <div
      id="eventList"
      ref="eventList"
      @mouseover="mouseOnEvents = true"
      @mouseleave="mouseOnEvents = false"
    >
      <ul>
        <li v-for="event in events">
          {{ event }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { eventBus } from "../events";

export default {
  name: "EventList",
  data() {
    return {
      events: [],
      mouseOnEvents: false
    };
  },
  created() {
    eventBus.on("**", data => {
      this.events.push(eventBus.event + ": " + JSON.stringify(data));
      if (this.events.length > 50) {
        this.events.shift();
      }
    });
  },
  updated() {
    if (!this.mouseOnEvents) {
      this.$refs.eventList.scrollTop = this.$refs.eventList.scrollHeight;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#eventListContainer {
  display: flex;
  flex-flow: column;
  height: 70vh;
}

#eventList {
  position: relative;
  overflow-y: scroll;
  overflow-x: hidden;
  border: solid 2px black;
  margin-left: 7%;
  flex-grow: 1;
}

ul {
  margin-left: -8%;
}
</style>
