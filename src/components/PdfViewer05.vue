<script setup lang="ts">
import { computed, defineComponent, onMounted, ref} from "vue";
import * as pdfjsLib from "pdfjs-dist";
import PDFJSWorker from "pdfjs-dist/build/pdf.worker?url";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer.js";
import {
  PDFDocumentProxy,
  PDFPageProxy,
} from "pdfjs-dist";
import { PageViewport } from "pdfjs-dist";
import { createLoadingTask } from "../lib/loadingTask.ts";
import "pdfjs-dist/legacy/web/pdf_viewer.css";

const props = withDefaults(
  defineProps<{
    /**
     * The source of the pdf. Accepts the following types `string | URL | Uint8Array | PDFDataRangeTransport | DocumentInitParameters`
     */
    src: string;
    /**
     * The page number of the pdf to display.
     */
    page?: number;
    /**
     * The scale (zoom) of the pdf. Setting this will also disable auto scaling and resizing.
     */
    scale?: number;
    /**
     * Whether to enable text selection
     */
    enableTextSelection?: boolean;
    /**
     * Whether to enable annotations (clickable links)
     */
    enableAnnotations?: boolean;
  }>(),
  {
    page: 1,
    scale: 1,
    enableTextSelection: true,
    enableAnnotations: true,
  }
);

const loading = ref<boolean>(false);

const pdfWrapperRef = ref<HTMLElement | null>(null);
const parentWrapperRef = ref<HTMLElement | null>(null);

const thePDF = ref<PDFDocumentProxy | null>(null);
const numberOfPages = ref<number>(0);

const eventBus = ref(null);

const pageNumber = computed(() => props.page || 1);

const emits = defineEmits(['pdfLoaded', 'totalPages', 'textContent']) 

const initPdfWorker = () => {
  loading.value = true;
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;
  const loadingTask = createLoadingTask(props.src);
  loadingTask.promise.then((pdf: PDFDocumentProxy) => {
    emits("pdfLoaded", pdf);
    thePDF.value = pdf;
    numberOfPages.value = pdf.numPages;
    emits("totalPages", numberOfPages.value);
    if (pageNumber.value <= numberOfPages.value) {
      pdf
        .getPage(pageNumber.value)
        .then((page: PDFPageProxy) => renderPage(page));
    }
  });
};

const renderPage = async (page: PDFPageProxy) => {
  loading.value = true;

  const pdfWrapperEl = pdfWrapperRef.value as HTMLElement;
  const parentWrapperEl = parentWrapperRef.value as HTMLElement;

  // Create a wrapper for each page
  const pageWrapper = document.createElement("div");
  pageWrapper.classList.add("vue-pdf__wrapper");
  pageWrapper.id = `vue-pdf-page-${props.page}`;

  // Create a canvas element for each page to draw on
  const canvas = document.createElement("canvas");
  pageWrapper.appendChild(canvas);

  // Create an annotation layer for each page
  const annotationLayer = document.createElement("div");
  if (props.enableAnnotations) {
    annotationLayer.classList.add("vue-pdf__wrapper-annotation-layer");
    pageWrapper.appendChild(annotationLayer);
  }

  // Create div which will hold text-fragments (for selection)
  const textLayerDiv = document.createElement("div");
  if (props.enableTextSelection) {
    textLayerDiv.classList.add("textLayer", "vue-pdf__wrapper-text-layer");
    pageWrapper.appendChild(textLayerDiv);
  }

  pdfWrapperEl?.appendChild(pageWrapper);

  // This gives us the page's dimensions at full scale
  const initViewport = page.getViewport({ scale: 1 });

  const context = canvas.getContext("2d");
  await scaleCanvas(
    pdfWrapperEl,
    initViewport,
    page,
    canvas,
    context,
    textLayerDiv,
    annotationLayer
  );

  if (!props.scale) {
    const debouncedScaling = debounce(
      async () =>
        await scaleCanvas(
          pdfWrapperEl,
          initViewport,
          page,
          canvas,
          context,
          textLayerDiv,
          annotationLayer
        )
    );
    window.addEventListener("resize", debouncedScaling);
  } else {
    parentWrapperEl.style.display = "inline-block";
    pdfWrapperEl.style.display = "inline-block";
  }
};

const scaleCanvas = async (
  pdfWrapperEl: HTMLElement,
  intialisedViewport: PageViewport,
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  context: any,
  textLayerDiv: HTMLDivElement,
  annotationLayer: HTMLDivElement
) => {
  textLayerDiv.innerHTML = "";
  annotationLayer.innerHTML = "";

  const pdfWrapperElStyles = window.getComputedStyle(pdfWrapperEl);
  const pdfWrapperElWidth = parseFloat(pdfWrapperElStyles.width);

  const scale = props.scale
    ? props.scale
    : pdfWrapperElWidth / intialisedViewport.width;
  const viewport = page.getViewport({ scale });

  // assume the device pixel ratio is 1 if the browser doesn't specify it
  const devicePixelRatio = window.devicePixelRatio || 1;

  // determine the 'backing store ratio' of the canvas context
  const backingStoreRatio =
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  // determine the actual ratio we want to draw at
  const ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    // set the 'real' canvas size to the higher width/height
    canvas.width = props.scale
      ? viewport.width * ratio
      : pdfWrapperElWidth * ratio;
    canvas.height = viewport.height * ratio;

    // ...then scale it back down with CSS
    canvas.style.width = props.scale ? "" : "100%";
    canvas.style.height = viewport.height + "px";
  } else {
    // this is a normal 1:1 device; just scale it simply
    canvas.width = props.scale ? viewport.width : pdfWrapperElWidth;
    canvas.height = viewport.height;
    canvas.style.width = "";
    canvas.style.height = "";
  }

  // scale the drawing context so everything will work at the higher ratio
  await context.scale(ratio, ratio);
  // Draw it on the canvas
  if (context) {
    page.render({ canvasContext: context, viewport }).promise.then(() => {
      // Render text layer for text selection
      if (props.enableTextSelection) {
        page.getTextContent().then((textContent) => {
          if (!eventBus.value) {
            eventBus.value = new pdfjsViewer.EventBus();
          }
          // Create new instance of TextLayerBuilder class
          const textLayer = new pdfjsViewer.TextLayerBuilder({
            textLayerDiv: textLayerDiv,
            pageIndex: page._pageIndex,
            eventBus: eventBus.value,
            viewport: viewport,
            enhanceTextSelection: true,
          });

          // Set text-fragments
          textLayer.setTextContentSource(textContent);
          // emit("textContent", textContent);
          // Render text-fragments
          textLayer.render(viewport);
        });
      }

      if (props.enableAnnotations) {
        // Render annotation layer for clickable links
        page.getAnnotations().then((annotationData) => {
          annotationLayer.style.cssText = `left: 0; top: 0; height: ${
            viewport.height
          }px; width: ${props.scale ? viewport.width : pdfWrapperElWidth}px;`;

          // Render the annotation layer
          pdfjsLib.AnnotationLayer.render({
            viewport: viewport.clone({ dontFlip: true }),
            div: annotationLayer,
            annotations: annotationData,
            page: page,
            linkService: "",
            downloadManager: "",
            renderInteractiveForms: false,
          });
        });
      }
      loading.value = false;
    });
  }
};

const debounce = (
  func: { apply: (arg0: void, arg1: any) => void },
  timeout = 300
) => {
  let timer: number | undefined;
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

onMounted(() => {
  initPdfWorker();
});
</script>

<template>
  <div class="vue-pdf-main" ref="parentWrapperRef">
    <div class="vue-pdf" ref="pdfWrapperRef"></div>
  </div>
</template>

<style lang="scss">
.vue-pdf {
  &__wrapper {
    position: relative;

    &-text-layer {
      br {
        display: none;
      }
    }

    &-annotation-layer {
      position: absolute;

      .linkAnnotation {
        position: absolute;
        z-index: 1;

        a {
          width: 100%;
          height: 100%;
          display: inline-block;
        }
      }
    }
  }
}
</style>
