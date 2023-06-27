<template>
  <div
    id="viewerContainer"
    ref="viewerContainer"
    style="background-color: wheat"
  >
    <div id="viewer" class="pdfViewer" ref="viewer">
      <canvas
        id="canvas"
        ref="viewerCanvas"
        dir="ltr"
        style="display: block"
        role="main"
      />
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
// import { DLIBViewer } from "../lib/dlib-viewer";
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

// let pdfapp: DLIBViewer;
var pdfDoc = null,
  pageNum = 1,
  pageRendering = false,
  pageNumPending = null,
  scale = 0.8;

onMounted(async () => {
  console.log(viewerCanvas);
  // console.log(videwerCanvas());
  let ctx = viewerCanvas.value.getContext("2d");
  console.log(ctx);

  /**
   * Asynchronously downloads PDF.
   */
  pdfjsLib.getDocument("/test.pdf").promise.then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    //document.getElementById("page_count").textContent = pdfDoc.numPages;

    // Initial/first page rendering
    renderPage(pageNum);
  });
  console.log(viewerContainer.value);
  console.log(viewerContainer);
  // pdfapp = new DLIBViewer(
  //   viewerContainer.value as HTMLDivElement,
  //   viewerCanvas.value as HTMLCanvasElement
  // );

  //pdfapp.open("/test.pdf");
  //await loadPDF("/test.pdf");

  // const loadPDF = async (filePath: string) => {
  //   console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeenter loadPDF");
  //   // load cmaps for rendering translated fonts
  //   // let cMapUrl = '';
  //   // if (process.env.DEV)
  //   //   cMapUrl = new URL('../../../cmaps/', import.meta.url).href;
  //   // else {
  //   //   console.log('url?', import.meta.url);
  //   //   cMapUrl = new URL('cmaps/', import.meta.url).href;
  //   // }
  //   console.log("readddddddddddddddddddy to read");
  //   console.log(filePath);
  //   // let buffer = await readBinaryFile(filePath);
  //   const pdfDocument = await pdfjsLib.getDocument({
  //     url: filePath,
  //     // data: buffer,
  //     // cMapUrl: cMapUrl,
  //     // cMapPacked: true,
  //   }).promise;
  //   //this.pdfLinkService.setDocument(this.pdfDocument, null);
  //   //this.pdfFindController.setDocument(this.pdfDocument);
  //   PDFViewer.setDocument(pdfDocument);
  //   //this.peekManager.loadPDF(filePath);
  // };

  /**
   * Get page info from document, resize canvas accordingly, and render page.
   * @param num Page number.
   */
  function renderPage(num) {
    pageRendering = true;
    // Using promise to fetch the page
    pdfdoc.getPage(num).then(function (page) {
      var viewport = page.getViewport({ scale: scale });
      viewerCanvas.value.height = viewport.height;
      viewerCanvas.value.width = viewport.width;

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      var renderTask = page.render(renderContext);

      // Wait for rendering to finish
      renderTask.promise.then(function () {
        pageRendering = false;
        if (pageNumPending !== null) {
          // New page rendering is pending
          renderPage(pageNumPending, pdfdoc, ctx);
          pageNumPending = null;
        }
      });
    });

    // Update page counters
    //document.getElementById('page_num').textContent = num;
  }

  /**
   * If another page rendering in progress, waits until the rendering is
   * finised. Otherwise, executes rendering immediately.
   */
  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }

  /**
   * Displays previous page.
   */
  function onPrevPage() {
    if (pageNum <= 1) {
      return;
    }
    pageNum--;
    queueRenderPage(pageNum);
  }
  //document.getElementById('prev').addEventListener('click', onPrevPage);

  /**
   * Displays next page.
   */
  function onNextPage() {
    pageNum++;
    queueRenderPage(pageNum);
  }
});
// document.getElementById("next").addEventListener("click", onNextPage);
</script>
<style></style>
