/* ------------------------------------------------------------------
 ** Customized PDF Viewer
 ** created by <jason.zou@gmail.com>
 **
 ** =================================================================*/
// import pdfjs and pdfviewer
import * as pdfjsLib from "pdfjs-dist";
import { UnknownErrorException } from "pdfjs-dist/types/src/shared/util";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";

//??TODO??
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "../../node_modules/pdfjs-dist/build/pdf.worker.js";
const CMAP_PACKED = true;
const CMAP_URL = "../../node_modules/pdfjs-dist/cmaps/";
const MAX_IMAGE_SIZE = 1024 * 1024;

class DLIBViewer {
  pdfLoadingTask: pdfjsLib.PDFDocumentLoadingTask | undefined;
  pdfDocument: pdfjsLib.PDFDocumentProxy | undefined;
  pdfViewer: pdfjsViewer.PDFViewer;
  pdfHistory: pdfjsViewer.PDFHistory;
  pdfLinkService: pdfjsViewer.PDFLinkService;
  eventBus: pdfjsViewer.EventBus;
  // l10n: typeof pdfjsViewer.GenericL10n;

  // other customization
  container: HTMLDivElement;
  //peekContainer: HTMLDivElement;
  pdfFindController: pdfjsViewer.PDFFindController;
  //peekManager: PeekManager;

  constructor(container: HTMLDivElement) {
    const eventBus = new pdfjsViewer.EventBus();

    const linkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });

    const findController = new pdfjsViewer.PDFFindController({
      eventBus,
      linkService: linkService,
    });

    // l10n resource
    // ???TODO???
    // this.l10n = pdfjsViewer.NullL10n;

    // pdf viewer
    const pdfViewer = new pdfjsViewer.PDFViewer({
      container,
      eventBus: eventBus,
      linkService: linkService,
      findController: findController,
      annotationEditorMode: pdfjsLib.AnnotationEditorType.NONE,
      // l10n: thisl10n,
      useOnlyCssZoom: true,
      textLayerMode: 0, //disabled??
    });

    // pdfLinkService default viewer
    linkService.setViewer(pdfViewer);

    const history = new pdfjsViewer.PDFHistory({
      eventBus,
      linkService,
    });
    linkService.setHistory(history);

    this.container = container;
    this.eventBus = eventBus;
    this.pdfLinkService = linkService;
    this.pdfFindController = findController;
    this.pdfHistory = history;
    this.pdfViewer = pdfViewer; // pdfViewer configuration is done

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
    if (this.pdfLoadingTask) {
      // We need to destroy already opened document
      return this.close().then(
        function () {
          // ... and repeat the open() call.
          return this.open(url);
        }.bind(this)
      );
    }

    this.setTitleUsingUrl(url);

    // Loading document.
    const loadingTask = pdfjsLib.getDocument({
      url,
      maxImageSize: MAX_IMAGE_SIZE,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    });
    this.pdfLoadingTask = loadingTask;

    // ??TODO?? progressData
    // this.pdfLoadingTask.onProgress = function (progressData) {
    //   self.progress(progressData.loaded / progressData.total);
    // };

    return this.pdfLoadingTask.promise.then(
      function (pdfDocument) {
        // Document loaded, specifying document for the viewer.
        this.pdfDocument = pdfDocument;
        this.pdfViewer.setDocument(pdfDocument);
        this.pdfLinkService.setDocument(pdfDocument);
        this.pdfHistory.initialize({
          fingerprint: pdfDocument.fingerprints[0],
        });

        this.loadingBar.hide();
        this.setTitleUsingMetadata(pdfDocument);
      },
      function (exception: UnknownErrorException) {
        const message = exception && exception.message;
        const l10n = this.l10n;
        let loadingErrorMessage;

        if (exception instanceof pdfjsLib.InvalidPDFException) {
          // change error message also for other builds
          loadingErrorMessage = this.l10n.get(
            "invalid_file_error",
            null,
            "Invalid or corrupted PDF file."
          );
        } else if (exception instanceof pdfjsLib.MissingPDFException) {
          // special message for missing PDFs
          loadingErrorMessage = this.l10n.get(
            "missing_file_error",
            null,
            "Missing PDF file."
          );
        } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
          loadingErrorMessage = this.l10n.get(
            "unexpected_response_error",
            null,
            "Unexpected server response."
          );
        } else {
          loadingErrorMessage = this.l10n.get(
            "loading_error",
            null,
            "An error occurred while loading the PDF."
          );
        }

        console.log(loadingErrorMessage);
      }
    );
  }

  /**
   * Closes opened PDF document.
   * @returns {Promise} - Returns the promise, which is resolved when all
   *                      destruction is completed.
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
