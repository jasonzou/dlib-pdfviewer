<template>
  <div id="viewerContainer" ref="viewerContainer" style="position:absolute">
    <div id="viewer" class="pdfViewer" ref="viewer" style="position:absolute">
      <canvas ref="viewerCanvas" dir="ltr" style="display: block" role="main" />
    </div>
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
    <button class="toolbarButton pageUp" title="Previous Page" id="previous"></button>
    <button class="toolbarButton pageDown" title="Next Page" id="next"></button>

    <input type="number" id="pageNumber" class="toolbarField pageNumber" value="1" size="4" min="1" />

    <button class="toolbarButton zoomOut" title="Zoom Out" id="zoomOut"></button>
    <button class="toolbarButton zoomIn" title="Zoom In" id="zoomIn"></button>
  </footer>
</template>
<script setup lang="ts">
import { DLIBViewer } from "../lib/dlib-viewer.ts";
import { onMounted, ref, Ref } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import PDFJSWorker from "pdfjs-dist/build/pdf.worker?url";
import {
  PDFDocumentProxy,
  PDFPageProxy,
} from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

// viewer containers
const viewerContainer = ref<HTMLDivElement>();
const viewerCanvas = ref<HTMLCanvasElement>();

const viewer = ref<HTMLDivElement>();


let pdfapp: DLIBViewer;

onMounted(async () => {
  console.log(viewerContainer.value)
  console.log(viewerContainer)
  pdfapp = new DLIBViewer(
    viewerContainer.value as HTMLDivElement,
    viewerCanvas.value as HTMLCanvasElement
  )
  pdfapp.open('./test1.pdf');
});
</script>
<style></style>
