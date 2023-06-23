<script setup lang="ts">
import { computed, onMounted, ref, toRaw } from "vue";
import * as pdfjsLib from "pdfjs-dist";

import type {
    PDFDocumentLoadingTask,
    PDFDocumentProxy,
    PDFPageProxy,
    PageViewport,
    RenderTask,
} from "pdfjs-dist";
import type {
    GetViewportParameters,
    RenderParameters,
} from "pdfjs-dist/types/src/display/api";

import {
    DefaultAnnotationLayerFactory,
    DefaultTextLayerFactory,
    PDFFindController,
    PDFLinkService,
    PDFPageView,
    EventBus,
} from "pdfjs-dist/web/pdf_viewer.js";

const props = withDefaults(defineProps<{
    pdf?: PDFDocumentLoadingTask
    src?: [String, Object], // The source of the pdf. Accepts the following types `string | URL | Uint8Array | PDFDataRangeTransport | DocumentInitParameters`
    page?: number // The page number of the pdf to display.
    scale?: number // The scale (zoom) of the pdf. Setting this will also disable auto scaling and resizing.
    rotation?: number //  Rotation: how many degrees
    fitParent?: boolean //
    textLayer?: boolean
    annotationLayer?: boolean
    annotationsFilter?: string[]
    annotationsMap?: Function
    enableAnnotations?: boolean
    enableTextSelection?: boolean

}>(), {
    page: 1,
    scale: 1,
})

let renderTask: RenderTask

function cancelRender() {
    if (renderTask) {
        renderTask.cancel()
    }
}

const renderPage = async (pageNumber: number) => {
    toRaw(DocumentProxy.value)?.getPage(pageNumber).then(page) => {
    cancelRender()

}
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
                    textLayer.setTextContent(textContent);
                    ctx.emit("textContent", textContent);
                    // Render text-fragments
                    textLayer.render();
                });
            }

            if (props.enableAnnotations) {
                // Render annotation layer for clickable links
                page.getAnnotations().then((annotationData) => {
                    annotationLayer.style.cssText = `left: 0; top: 0; height: ${viewport.height
                        }px; width: ${props.scale ? viewport.width : pdfWrapperElWidth
                        }px;`;

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

return {
    props,
    pdfWrapperRef,
    parentWrapperRef,
};
  },
});


// Template Refs
const container = ref<HTMLSpanElement>()
const loadingLayer = ref<HTMLSpanElement>()
const loading = ref(false)
let renderTask: RenderTask

// PDF Refs
const DocumentProxy = ref<PDFDocumentProxy | null>(null)
const PageProxy = ref<PDFPageProxy | null>(null)
const InternalViewport = ref<PageViewport | null>(null)


// function computeRotation(rotation: number): number {
//   if (!(typeof rotation === 'number' && rotation % 90 === 0))
//     return 0
//   const factor = rotation / 90
//   if (factor > 4)
//     return computeRotation(rotation - 360)
//   else if (factor < 0)
//     return computeRotation(rotation + 360)
//   return rotation
// }

// function computeScale(page: PDFPageProxy): number {
//   let fscale = props.scale
//   if (props.fitParent) {
//     const parentWidth: number = (container.value!.parentNode! as HTMLElement).clientWidth
//     const scale1Width = page.getViewport({ scale: 1 }).width
//     fscale = parentWidth / scale1Width
//   }
//   return fscale
// }

function getCurrentCanvas(): HTMLCanvasElement | null {
    let oldCanvas = null
    container.value?.childNodes.forEach((el) => {
        if ((el as HTMLElement).tagName === 'CANVAS')
            oldCanvas = el
    })
    return oldCanvas
}

function setupCanvas(viewport: PageViewport): HTMLCanvasElement {
    let canvas
    const currentCanvas = getCurrentCanvas()!
    if (currentCanvas && currentCanvas?.getAttribute('role') === 'main') {
        canvas = currentCanvas
    }
    else {
        canvas = document.createElement('canvas')
        canvas.style.display = 'block'
        canvas.setAttribute('dir', 'ltr')
    }
    canvas.width = viewport.width
    canvas.height = viewport.height

    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    // --scale-factor property
    container.value?.style.setProperty('--scale-factor', `${viewport.scale}`)
    // Also setting dimension properties for load layer
    loadingLayer.value!.style.width = `${viewport.width}px`
    loadingLayer.value!.style.height = `${viewport.height}px`
    loading.value = true
    return canvas
}

function cancelRender() {
    if (renderTask)
        renderTask.cancel()
}

function renderPage(pageNum: number) {
    toRaw(DocumentProxy.value)?.getPage(pageNum).then((page) => {
        cancelRender()

        const defaultViewport = page.getViewport()
        const viewportParams: GetViewportParameters = {
            scale: computeScale(page),
            rotation: computeRotation((props.rotation || 0) + defaultViewport.rotation),
        }
        const viewport = page.getViewport(viewportParams)

        const oldCanvas = getCurrentCanvas()
        const canvas = setupCanvas(viewport)

        // Render PDF page into canvas context
        const renderContext: RenderParameters = {
            canvasContext: canvas.getContext('2d')!,
            viewport,
            annotationMode: PDFJS.AnnotationMode.ENABLE_FORMS,
        }

        if (canvas?.getAttribute('role') !== 'main') {
            if (oldCanvas)
                container.value?.replaceChild(canvas, oldCanvas)
        }
        else {
            canvas.removeAttribute('role')
        }

        PageProxy.value = page
        InternalViewport.value = viewport
        renderTask = page.render(renderContext)
        renderTask.promise.then(() => {
            loading.value = false
            emitLoaded(InternalViewport.value!)
        }).catch(() => {
            // render task cancelled
        })
    })
}

function initDoc(proxy: PDFDocumentLoadingTask) {
    proxy.promise.then(async (doc) => {
        DocumentProxy.value = doc
        renderPage(props.page)
    })
}

watch(() => props.pdf, (pdf) => {
    // for any change in pdf proxy, rework all
    if (pdf !== undefined)
        initDoc(pdf)
})

watch(() => [props.scale, props.rotation, props.page], () => {
    renderPage(props.page)
})

onMounted(() => {
    if (props.pdf !== undefined)
        initDoc(props.pdf)
})

function reload() {
    renderPage(props.page)
}

function cancel() {
    cancelRender()
}

function getAnnotationStorage() {
    const pdf = toRaw(DocumentProxy.value)
    return pdf?.annotationStorage
}

defineExpose({
    reload,
    cancel,
    getAnnotationStorage,
})
</script>

<template>
  <div
    ref="container"
    style="position: relative; display: block; overflow: hidden"
  >
    <canvas dir="ltr" style="display: block" role="main" />
    <TextLayer
      v-show="textLayer"
      :page="PageProxy as PDFPageProxy"
      :viewport="InternalViewport"
    />
    <AnnotationLayer
      v-show="annotationLayer"
      :page="PageProxy as PDFPageProxy"
      :viewport="InternalViewport"
      :document="DocumentProxy as PDFDocumentProxy"
      :filter="annotationsFilter!"
      :map="annotationsMap"
      @annotation="emitAnnotation($event)"
    />
    <div
      v-show="loading"
      ref="loadingLayer"
      style="display: block; position: absolute"
    >
      <slot />
    </div>
  </div>
</template>
<script>
const loadPage = function (pageNum) {
    return doc.getPage(pageNum).then(function
        (page) {
            console.log("# Page " + pageNum); const viewport = page.getViewport({
                scale: 1.0
            }); console.log("Size: " + viewport.width + "x" + viewport.height);
        console.log(); return page.getTextContent().then(function (content) { //
Content contains lots of information about the text layout and // styles, but we
need only strings at the moment const strings = content.items.map(function
            (item) { return item.str; }); console.log("## Text Content");
            console.log(strings.join(" ")); // Release page resources. page.cleanup(); })
.then(function () { console.log(); });
    });
}; // Loading of the first page will
wait on metadata and subsequent loadings // will wait on the previous pages. for
    (let i = 1; i <= numPages; i++) {
        lastPromise =
        lastPromise.then(loadPage.bind(null, i));
} return lastPromise; }) .then(
    function () { console.log("# End of Document"); }, function (err) {
        console.error("Error: " + err);
    }); /** * Get page info from document, resize
canvas accordingly, and render page. * @param num Page number. */ function
    renderPage(num) {
        pageRendering = true; // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
        var viewport =
            page.getViewport({ scale: scale }); canvas.height = viewport.height; canvas.width
                = viewport.width; // Render PDF page into canvas context var renderContext = {
        canvasContext: ctx, viewport: viewport
    }; var renderTask =
        page.render(renderContext); // Wait for rendering to finish
    renderTask.promise.then(function () {
        pageRendering = false; if (pageNumPending
            !== null) { // New page rendering is pending renderPage(pageNumPending);
            pageNumPending = null;
        }
    });
}); // Update page counters
document.getElementById('page_num').textContent = num; } /** * If another page
rendering in progress, waits until the rendering is * finised. Otherwise,
executes rendering immediately. */ function queueRenderPage(num) {
    if
        (pageRendering) { pageNumPending = num; } else { renderPage(num); }
} /** *
Displays previous page. */ function onPrevPage() {
    if (pageNum <= 1) { return; }
    pageNum--; queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage); /** *
Displays next page. */ function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    } pageNum++; queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage); /** *
Asynchronously downloads PDF. */
pdfjsLib.getDocument(url).promise.then(function (pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages; //
    Initial / first page rendering renderPage(pageNum);
});
</script>
