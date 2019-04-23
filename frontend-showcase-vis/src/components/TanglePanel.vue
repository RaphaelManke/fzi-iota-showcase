<template>

<b-row no-gutters="true">
    <b-col v-for="transaction in transactionData" style="height: 100%">
        <b-card style="height: 100%">
          <b-row align-h="end" slot="header">
            <b-col>Transaction</b-col>
            <b-col cols="3"><b-badge variant="light">{{transaction.time}}</b-badge></b-col>
          </b-row>
          <b-row>
          <b-col>From: <b-badge>{{getUserById(transaction.from).name}}</b-badge></b-col>
           <b-col>To: <b-badge>{{getVehicleById(transaction.to).name}}</b-badge></b-col>
          </b-row>
          <b-row>
          <b-col>Amount: <b-badge :variant="getAmoutVariant(transaction.amount)">{{formatIota(transaction.amount)}}<img src="assets/images/iota.png"/></b-badge></b-col>
          </b-row>

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
    getVehicleById(id) {
      return this.$store.getters["mapObjects/getVehicleById"](id);
    },
    getUserById(id) {
      return this.$store.getters["mapObjects/getUserById"](id);
    },
    formatIota(iotas) {
      if (iotas > 1000000000) return (iotas / 1000000000).toFixed(2) + " Gi";
      if (iotas > 1000000) return (iotas / 1000000).toFixed(2) + " Mi";
      if (iotas > 1000) return (iotas / 1000).toFixed(2) + " Ki";
      return iotas + " i";
    },
    getAmoutVariant(amount) {
      if (amount > 0) return "success";
      else return "primary";
    }
  }
};
</script>

<style scoped>
img {
  height: 12px;
}
p {
  margin-bottom: 0;
}
</style>

