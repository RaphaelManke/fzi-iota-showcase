<template>

<div class="connection">

    <img v-if="direction === 0" src="../assets/street_hor.png" v-bind:style="top: position.y + '%', left: position.x + '%'">

</div>
    
</template>

<script>
export default {
    props: ['type', 'direction', 'position'],
}
</script>

<style>

.connection {
    position: absolute;
}

</style>


