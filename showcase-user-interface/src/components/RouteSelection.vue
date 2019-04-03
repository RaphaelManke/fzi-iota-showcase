<template>
  <b-container fluid>
    <b-row>
      <b-col>List one</b-col>
      <b-col cols="8">
        <map-visu />
      </b-col>
      <b-col>List 2</b-col>
    </b-row>
  </b-container>
</template>

<script>
import MapVisu from "./MapVisu";

export default {
  components: {
    MapVisu
  }
};
</script>
