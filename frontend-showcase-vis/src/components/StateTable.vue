<template>

<div id="table_container">

    <div class="table_wrapper">

    </div>

    <div class="table_wrapper">

    </div>

    <div class="table_wrapper">

    </div>

    <div class="table_wrapper">
        
    </div>

    
</div>
</template>

<script>
import StateTableObject from './StateTableObject.vue';

export default {
  name: 'StateTable',
  components: {
    StateTableObject,
  },
  computed: {

  },
};
</script>

<style scoped>

.table_wrapper {
    display: flex;
}

#table_container {
    display: grid;
    grid-template-columns: auto auto auto auto;
    height: 30vh;
}

</style>


