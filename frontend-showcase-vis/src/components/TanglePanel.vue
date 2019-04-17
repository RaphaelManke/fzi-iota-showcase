<template>

<b-row no-gutters="true">
    <b-col v-for="transaction in transactionData">
        <b-card style="height: 100%" header="Transaction">
            <p>Amount: {{transaction.amount}}</p>
            <p>Time: {{transaction.time}}</p>
            </b-card>
    </b-col>
</b-row>
    
</template>

<script>
export default {
  name: "TanglePanel",
  computed: {
    transactionData() {
      return this.$store.getters["transactions/getTransactions"];
    }
  },
  methods: {
    formatIota(iotas) {
      if (iotas > 1000000000) return (iotas / 1000000000).toFixed(2) + " Gi";
      if (iotas > 1000000) return (iotas / 1000000).toFixed(2) + " Mi";
      if (iotas > 1000) return (iotas / 1000).toFixed(2) + " Ki";
      return iotas + " i";
    }
  }
};
</script>
