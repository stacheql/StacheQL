<template>
  <div id="app">
    <b-container>
      <b-row align-v="center">
        <b-col>
          <div class="d-flex justify-content-center">
            <img src="./assets/stache.png" width="50" height="50">
            <h1>
              <router-link to="/">{{title}}</router-link>
            </h1>
            <span class="align-bottom">{{subtitle}}</span>
          </div>
          <hr>
          <router-view/>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {
      title: "stacheQL",
      subtitle: "DEMO APP"
    };
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: black;
  min-height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
}
body {
  background-image: linear-gradient(#add0f7, white);
}

li {
  background-image: linear-gradient(#eee, white);
  border-radius: 15px;
  margin: 0 auto;
  margin-bottom: 30px;
  width: 65%;
  padding: 15px;
}

#limitBox {
  width: 80px;
}

#zipBox {
  width: 100px;
}

input {
  font-size: 18px;
  padding: 5px 10px;
  margin: 10px;
  border: 2px solid #e1e5e8;
  border-radius: 10rem;
  color: #171717;
}

select {
  font-size: 18px;
  padding: 5px 10px;
  margin: 10px;
  border: 2px solid #e1e5e8;
  border-radius: 10rem;
  color: #171717;
}

button {
  padding: 3px 16px;
  margin: 5px 5px;
  border: none;
  border-radius: 10rem;
  font-size: 23px;
  font-weight: bold;
  text-transform: lowercase;
  letter-spacing: 1.5px;
  background: linear-gradient(to top, #eee, white);
  color: #007bff;
  display: inline;
  /* font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"; */
}

button:hover {
  background: linear-gradient(to bottom, #eee, white);
}

button:active {
  border-radius: 6px;
}

.searchBartext {
  font-weight: bold !important;
  color: #4d4e4f;
}

.bizName {
  font-size: 27px;
}

.star {
  font-size: 17px;
}

.reviewText {
  margin: 0 auto;
  font-size: 17px;
}
</style>
