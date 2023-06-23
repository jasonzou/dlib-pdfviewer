<script setup lang="ts">
import { reactive, ref, shallowRef } from 'vue'
import * as pdfjs from 'pdfjs-dist'
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  PageViewport,
  RenderTask
} from 'pdfjs-dist'
import PdfViewer from './PdfViewer.vue'
import PDFWorker from 'pdfjs-dist/build/pdf.worker?url'

import type { GetViewportParameters, RenderParameters } from 'pdfjs-dist/types/src/display/api'
import { UsePDFInfo } from './types'

const props = withDefaults(defineProps<{
  msg: string
  pdf?: PDFDocumentLoadingTask
  page?: number
  pageScale?: number
  rotation?: number
  fitParent?: boolean
  textLayer?: boolean
  annotationLayer?: boolean
  annotationsFilter?: string[]
  annotationsMap?: Function
}>(), {
  page: 1,
  pageScale: 1,
})

//pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker?url';

// Template Refs
const container = ref<HTMLSpanElement>()
const loadingLayer = ref<HTMLSpanElement>()
const loading = ref(false)
let renderTask: RenderTask

// PDF Refs 
const DocumentProxy = ref<PDFDocumentProxy | null>(null)
const PageProxy = ref<PDFPageProxy | null>(null)
const InternalViewport = ref<PageViewport | null>(null)

// Could not find a way to make this work with vite, importing the worker entry bundle the whole worker to the the final output
// https://erindoyle.dev/using-pdfjs-with-vite/
pdfjs.GlobalWorkerOptions.workerSrc = PDFWorker

const pdf = shallowRef<PDFDocumentLoadingTask>()
const pages = shallowRef(0)
const info = shallowRef<UsePDFInfo | {}>({})

const state = reactive({
  pageNum: 1,
  scale: 1,
  numPages: 0
})

const loadingTask = pdfjs.getDocument('/test.pdf')

loadingTask.promise.then(async (doc) => {
  pdf.value = doc.loadingTask
  pages.value = doc.numPages

  state.numPages = pages.value

  const metadata = await doc.getMetadata();
  // .then(function (data) {
  //   console.log("# Metadata Is Loaded");
  //   console.log("## Info");
  //   console.log(JSON.stringify(data.info, null, 2));
  //   console.log();
  //   if (data.metadata) {
  //     console.log("## Metadata");
  //     console.log(JSON.stringify(data.metadata.getAll(), null, 2));
  //     console.log();
  //   }
  // });
  const attachments = (await doc.getAttachments()) as Record<string, unknown>
  const javascript = await doc.getJavaScript()

  info.value = {
    metadata,
    attachments,
    javascript,
  }
  console.log(pdf, pages, info)
  console.log("# Document Loaded---------");
  console.log("Number of Pages: " + pages.value);
  console.log();
  console.log("# Metadata Is Loaded");
  console.log("## Metadata");
  console.log(metadata);
  if (metadata.metadata) {
    console.log("## Metadata--------------");
    console.log(JSON.stringify(metadata.metadata.getAll(), null, 2));
    console.log();
  }
  console.log();

}, (error) => {
  console.log("loading pdf error!")
});
function previousPage() {
  if (state.pageNum > 1) {
    state.pageNum -= 1
  }
}
function nextPage() {
  if (state.pageNum < state.numPages) {
    state.pageNum += 1
  }
}

// dVueefineProps<{ msg: string }>()
function initDoc(proxy: PDFDocumentLoadingTask) {
  proxy.promise.then(async (doc) => {
    DocumentProxy.value = doc

    const numPages = doc.numPages;
    console.log("# Document Loaded");
    console.log("Number of Pages: " + numPages);
    console.log();

    let lastPromise; // will be used to chain promises
    lastPromise = doc.getMetadata().then(function (data) {
      console.log("# Metadata Is Loaded");
      console.log("## Info");
      console.log(JSON.stringify(data.info, null, 2));
      console.log();
      if (data.metadata) {
        console.log("## Metadata");
        console.log(JSON.stringify(data.metadata.getAll(), null, 2));
        console.log();
      }
    });
  })
}
const pdfPath = "../assets/test.pdf";

// Will be using promises to load document, pages and misc data instead of
// callback.
//const loadingTask = pdfjsLib.getDocument(pdfPath);
// const loadPage = function (pageNum) {
//       return doc.getPage(pageNum).then(function (page) {
//         console.log("# Page " + pageNum);
//         const viewport = page.getViewport({ scale: 1.0 });
//         console.log("Size: " + viewport.width + "x" + viewport.height);
//         console.log();
//         return page
//           .getTextContent()
//           .then(function (content) {
//             // Content contains lots of information about the text layout and
//             // styles, but we need only strings at the moment
//             const strings = content.items.map(function (item) {
//               return item.str;
//             });
//             console.log("## Text Content");
//             console.log(strings.join(" "));
//             // Release page resources.
//             page.cleanup();
//           })
//           .then(function () {
//             console.log();
//           });
//       });
//     };
//     // Loading of the first page will wait on metadata and subsequent loadings
//     // will wait on the previous pages.
//     for (let i = 1; i <= numPages; i++) {
//       lastPromise = lastPromise.then(loadPage.bind(null, i));
//     }
//     return lastPromise;
//   })
//   .then(
//     function () {
//       console.log("# End of Document");
//     },
//     function (err) {
//       console.error("Error: " + err);
//     }
//   );


const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the official Vue + Vite
    starter
  </p>
  <p>
    Install
    <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
  <PdfViewer :pdf="pdf" :page="state.pageNum"></PdfViewer>
  <div class="page-tool">
    <div class="page-tool-item" @click="previousPage">Previous</div>
    <div class="page-tool-item">{{ state.pageNum }} / {{ state.numPages }}</div>
    <div class="page-tool-item" @click="nextPage">Next</div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
