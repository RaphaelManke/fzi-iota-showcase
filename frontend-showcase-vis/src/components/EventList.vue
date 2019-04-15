<template>
  <b-card header="Transactions">
    <div style="height: 60vh; overflow-y: scroll; overflow-x: hidden;"
              id="eventList"
      ref="eventList"
              >
            <b-row>
              <b-col>
              <b-list-group>
      <b-list-group-item v-for="transaction in transactionData" class="d-flex justify-content-between align-items-center">
          {{formatIota(transaction.amount)}} transfered from {{transaction.from}} to {{transaction.to}}
          <b-badge variant="primary" pill>{{transaction.time}}</b-badge>
      </b-list-group-item>
    </b-list-group>
    </b-col>
    </b-row>
    </div>
  </b-card>
</template>

<script>
export default {
  name: "EventList",
  data() {
    return {
      mouseOnEvents: false
    };
  },
  computed: {
    transactionData() {
      return this.$store.getters["transactions/getTransactions"];
    }
  },
  methods: {
    formatIota(iotas) {
      if (iotas > 1000000000) return (iotas / 1000000000).toFixed(0) + " Gi";
      if (iotas > 1000000) return (iotas / 1000000).toFixed(0) + " Mi";
      if (iotas > 1000) return (iotas / 1000).toFixed(0) + " Ki";
      return iotas + " i";
    }
  },
  updated() {
    this.$refs.eventList.scrollTop = this.$refs.eventList.scrollHeight;
  }
};
</script>

