<template>

  <div class="basicPanel">

      <h1>Feld {{ location }}</h1>

  </div>
  
</template>

<script>


export default {
  name: 'basicPanel',
  props: ['location'],
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.basicPanel {
  width: 100%; 
  height: 0; 
  padding-bottom: 100%;
  background-color: green;
  text-align: center;
}

h1 {
  margin-top: 45%;
}


</style>
