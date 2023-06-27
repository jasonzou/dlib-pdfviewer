<template>
  <div id="viewerContainer" ref="viewerContainer">
    <div id="viewer" class="pdfViewer" ref="viewer02" style="position:absolute"></div>
  </div>

  <div id="loadingBar">
    <div class="progress"></div>
    <div class="glimmer"></div>
  </div>

  <div id="errorWrapper" hidden="true">
    <div id="errorMessageLeft">
      <span id="errorMessage"></span>
      <button id="errorShowMore">More Information</button>
      <button id="errorShowLess">Less Information</button>
    </div>
    <div id="errorMessageRight">
      <button id="errorClose">Close</button>
    </div>
    <div class="clearBoth"></div>
    <textarea id="errorMoreInfo" hidden="true" readonly="readonly"></textarea>
  </div>

  <footer>
    <button
      class="toolbarButton pageUp"
      title="Previous Page"
      id="previous"
    ></button>
    <button class="toolbarButton pageDown" title="Next Page" id="next"></button>

    <input
      type="number"
      id="pageNumber"
      class="toolbarField pageNumber"
      value="1"
      size="4"
      min="1"
    />

    <button
      class="toolbarButton zoomOut"
      title="Zoom Out"
      id="zoomOut"
    ></button>
    <button class="toolbarButton zoomIn" title="Zoom In" id="zoomIn"></button>
  </footer>
</template>
<script setup lang="ts">
import { DLIBViewer } from "../lib/dlib-viewer.ts";
import { onMounted, ref, Ref } from "vue";

// viewer containers
const viewerContainer = ref<HTMLDivElement>();

const viewer02 = ref<HTMLDivElement>();


let pdfapp: DLIBViewer;

onMounted(async()=>{
  console.log(viewer02.value)
  console.log(viewer02)
  pdfapp = new DLIBViewer(
    viewer02.value as HTMLDivElement
  )
  pdfapp.open('./test1.pdf');
});
</script>
<style></style>
