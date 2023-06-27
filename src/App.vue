<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import PdfVue03 from './components/PdfViewer03.vue'
import PdfVue04 from './components/PdfVue3.vue'
import PdfVue05 from './components/PdfViewer05.vue'
import PdfVue02 from './components/MobileView.vue'
</script>

<template>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <h2>Viewer 01</h2>
  <HelloWorld msg="Dlib PDFViewer" />
  <br />
  <hr />
  <h2>Viewer 02</h2>
  <PdfVue02 /> 
  <br />
  <hr />
  <h2>Viewer 03</h2>
  <PdfVue03 src="/test1.pdf"/>
  <br />
  <hr />
  <h2>Viewer 04</h2>
  <PdfVue04 src="/test1.pdf"/>
  <br />
  <hr />
  <h2>Viewer 05</h2>
  <PdfVue05 src="/test1.pdf"/>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
