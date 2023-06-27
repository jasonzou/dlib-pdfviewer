/* ------------------------------------------------------------------
 ** Customized PDF Viewer
 ** created by <jason.zou@gmail.com>
 **
 ** =================================================================*/
// import pdfjs and pdfviewer
import * as pdfjsLib from "pdfjs-dist";
import { UnknownErrorException } from "pdfjs-dist/types/src/shared/util";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import {
  PDFDocumentProxy,
  PDFPageProxy,
  PDFDocumentLoadingTask
} from "pdfjs-dist";
import {
  DefaultAnnotationLayerFactory,
  DefaultTextLayerFactory,
  PDFFindController,
  PDFLinkService,
  PDFPageView,
  EventBus,
  PDFHistory,
  PDFViewer
} from "pdfjs-dist/web/pdf_viewer.js";

//??TODO??
const CMAP_PACKED = true;
const CMAP_URL = "../../node_modules/pdfjs-dist/cmaps/";
const MAX_IMAGE_SIZE = 1024 * 1024;

class DLIBViewer {
  pdfLoadingTask: PDFDocumentLoadingTask | undefined;
  pdfDocument: PDFDocumentProxy | undefined;
  pdfViewer: PDFViewer;
  pdfHistory: PDFHistory;
  pdfLinkService: PDFLinkService;
  eventBus: EventBus;
  // l10n: typeof pdfjsViewer.GenericL10n;

  // other customization
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  //peekContainer: HTMLDivElement;
  pdfFindController: PDFFindController;
  //peekManager: PeekManager;

  constructor(container: HTMLDivElement, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.container = container;
    console.log("1");
    console.log(this.canvas);
    const eventBus = new EventBus();

    const linkService = new PDFLinkService({
      eventBus,
    });

    const findController = new PDFFindController({
      eventBus,
      linkService: linkService,
    });
    console.log("2");
    console.log("2-------------------------------");
    console.log(container);
    console.log(container.firstChild);
    console.log("2===============================");

    // l10n resource
    // ???TODO???
    // this.l10n = pdfjsViewer.NullL10n;

    // pdf viewer
    const pdfViewer = new PDFViewer({
      container,
      eventBus: eventBus,
      linkService: linkService,
      findController: findController,
      //annotationEditorMode: AnnotationEditorType.NONE,
      // l10n: thisl10n,
      useOnlyCssZoom: true,
      textLayerMode: 0, //disabled??
    });
    console.log("3");

    // pdfLinkService default viewer
    linkService.setViewer(pdfViewer);

    const history = new PDFHistory({
      eventBus,
      linkService,
    });
    linkService.setHistory(history);
    console.log("4");
    2
    this.container = container;
    this.eventBus = eventBus;
    this.pdfLinkService = linkService;
    this.pdfFindController = findController;
    this.pdfHistory = history;
    this.pdfViewer = pdfViewer; // pdfViewer configuration is done

    console.log("5");
    // pdfjs internal event listeners
    eventBus.on("pagesinit", function () {
      // We can use pdfViewer now, e.g. let's change default scale.
      this.pdfViewer.currentScaleValue = "auto";
      this.container.addEventListener("mousewheel", (e) =>
        this.handleCtrlScroll(e as WheelEvent)
      );
    });

    eventBus.on(
      "pagechanging",
      // ???TODO????
      function (evt: any) {
        const page = evt.pageNumber;
        const numPages = this.pdfViewer.pagesCount;
        console.log(numPages);
        this.pdfViewer.currentPageNumber = page;
      },
      true
    );
  }

  /**
   * Opens PDF document specified by URL.
   * @returns {Promise} - Returns the promise, which is resolved when document
   *                      is opened.
   */
  public open(url: string) {
    console.log('----------------open 1-------------')
    console.log(url)
    console.log('----------------open 2-------------')
    if (this.pdfLoadingTask) {
      // We need to destroy already opened document
      // return this.close().then(
      //   function () {
      //     // ... and repeat the open() call.
      //     return this.open(url);
      //   }.bind(this)
      // );
    }

    console.log("++++++++++++++++++++++++++++++")
    //this.setTitleUsingUrl(url);

    // Loading document.
    const loadingTask = pdfjsLib.getDocument({
      url,
      maxImageSize: MAX_IMAGE_SIZE,
      //cMapUrl: CMAP_URL,
      //cMapPacked: CMAP_PACKED,
    });
    this.pdfLoadingTask = loadingTask;
    console.log("+++++++++++++++++++ iiiiii +++++++++++")
    console.log(this.pdfLoadingTask);

    // ??TODO?? progressData
    // this.pdfLoadingTask.onProgress = function (progressData) {
    //   self.progress(progressData.loaded / progressData.total);
    // };

    this.pdfLoadingTask.promise.then(
      function (pdf) {

        // Fetch the first page
        var pageNumber = 1;
        pdf.getPage(pageNumber).then(function (page) {
          console.log('Page loaded');

          var scale = 1.5;
          var viewport = page.getViewport({ scale: scale });
          console.log(this.canvas);
          console.log("000000i0000000000 canvas")

          // Prepare canvas using PDF page dimensions
          var context = this.canvas.getContext('2d');
          this.canvas.height = viewport.height;
          this.canvas.width = viewport.width;

          // Render PDF page into canvas context
          var renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          var renderTask = page.render(renderContext);
          renderTask.promise.then(function () {
            console.log('Page rendered');
          });
        });
      }
    );
  }

  /*
    * Closes opened PDF document.
    * @returns { Promise } - Returns the promise, which is resolved when all
    * destruction is completed.
    */
  public close(): Promise<void> {
    // const errorWrapper = document.getElementById("errorWrapper");
    // errorWrapper.hidden = true;

    if (!this.pdfLoadingTask) {
      return Promise.resolve();
    }

    const promise = this.pdfLoadingTask.destroy();
    //this.pdfLoadingTask = null;

    if (this.pdfDocument) {
      //this.pdfDocument = null;

      //this.pdfViewer.setDocument(null);
      this.pdfLinkService.setDocument(null, null);

      if (this.pdfHistory) {
        this.pdfHistory.reset();
      }
    }
    return promise;
  }

  public setTitleUsingUrl(url: string): void {
    // this.url = url;
    let title = pdfjsLib.getFilenameFromUrl(url) || url;
    try {
      title = decodeURIComponent(title);
    } catch {
      // decodeURIComponent may throw URIError,
      // fall back to using the unprocessed url in that case
    }
  }

  public setTitleUsingMetadata(): void {
    if (!this.pdfDocument) return;
    this.pdfDocument.getMetadata().then(function (data) {
      const info = data.info,
        metadata = data.metadata;

      // Provides some basic debug information
      console.log(
        "PDF " +
        this.pdfDocument.fingerprints[0] +
        " (PDF.js: " +
        (pdfjsLib.version || "-") +
        ")"
      );

      console.log(info, metadata);

      // let pdfTitle;
      // if (metadata && metadata.has("dc:title")) {
      //   const title = metadata.get("dc:title");
      //   // Ghostscript sometimes returns 'Untitled', so prevent setting the
      //   // title to 'Untitled.
      //   if (title !== "Untitled") {
      //     pdfTitle = title;
      //   }
      // }

      // if (!pdfTitle && info && info.Title) {
      //   pdfTitle = info.Title;
      // }
    });
  }

  public error(message: string, moreInfo: boolean) {
    //const l10n = this.l10n;
    // const moreInfoText = [
    //   l10n.get(
    //     "error_version_info",
    //     { version: pdfjsLib.version || "?", build: pdfjsLib.build || "?" },
    //     "PDF.js v{{version}} (build: {{build}})"
    //   ),
    // ];
    console.log(message);
  }

  public get pagesCount(): number | undefined {
    if (this.pdfDocument) {
      return this.pdfDocument.numPages;
    }
    return undefined;
  }

  public get page(): number {
    return this.pdfViewer.currentPageNumber;
  }

  public set page(val) {
    this.pdfViewer.currentPageNumber = val;
  }
}

export { DLIBViewer }