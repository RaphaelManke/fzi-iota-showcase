<template>

    <div id="state_object">

        <img src="assets/images/iota.png">
        <p>Test</p>
        <p>Test1</p>
        <p>Teset2</p>


    </div>
    
</template>

<script>
export default {
    props: {
        paras: {
      type: Object,
      default: () => {name: 'default'},
    },
    }

};
</script>

<style scoped>

p {
    margin:0;
    padding:0
}

img {
    max-height: 100%;
}

#state_object {
    display: flex;
    flex-wrap: wrap;
    margin: auto;
    border: groove 2px;
    height: 4vh;

}

</style>


