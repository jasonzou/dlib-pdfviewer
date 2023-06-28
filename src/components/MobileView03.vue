<template>
  <div
    id="viewerContainer"
    ref="viewerContainer"
    style="background-color: black; position: absolute"
  >
    <div id="viewer" class="pdfViewer" ref="viewer">
  <iframe>
      <!-- <canvas
        id="canvas"
        ref="viewerCanvas"
        dir="ltr"
        style="display: block"
        role="main"
      /> -->
  </iframe>
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
    <button
      class="toolbarButton pageUp"
      title="Previous Page"
      id="previous"
      @click="onNextPage"
    >
      Prev
    </button>
    <button
      class="toolbarButton pageDown"
      title="Next Page"
      @click="onPrevPage"
      id="next"
    >
      Next
    </button>

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
import { PDFApplication } from "../lib/dlib-viewer.ts";
import { onMounted, ref, Ref } from "vue";
import { PDFViewer } from "pdfjs-dist/web/pdf_viewer.js";
import * as pdfjsLib from "pdfjs-dist";
import PDFJSWorker from "pdfjs-dist/build/pdf.worker?url";
import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;

// viewer containers
const viewerContainer = ref<HTMLDivElement>();

const viewerCanvas = ref<HTMLCanvasElement>() as Ref<HTMLCanvasElement>;
const viewer = ref<HTMLDivElement>();

let pdfapp: PDFApplication;

onMounted(async () => {
  console.log(viewerCanvas);
  pdfapp = new PDFApplication(viewerContainer.value);
  pdfapp.loadPDF("/test.pdf");
});
</script>
<style></style>
