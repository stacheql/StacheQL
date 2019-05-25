<template>
  <div class="home">
    <search-bar></search-bar>
  </div>
</template>

<script>
import SearchBar from "./SearchBar.vue";
import Router from "vue-router";

export default {
  name: "Home",
  components: {
    SearchBar
  },
  data() {
    return {
      title: "stacheQL",
      subtitle: ""
    };
  }
};
</script>

<style scoped>
h1,
h2 {
  font-weight: normal;
}
</style>
