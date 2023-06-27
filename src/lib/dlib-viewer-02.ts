import {
  getDocument,
  PDFDocumentProxy,
  AnnotationEditorType,
} from "pdfjs-dist";
import {
  PDFFindController,
  PDFLinkService,
  EventBus,
  PDFViewer,
  GenericL10n,
} from "pdfjs-dist/web/pdf_viewer.js";
class PDFApplication {
  container: HTMLDivElement;
  // peekContainer: HTMLDivElement;
  eventBus: EventBus;
  pdfLinkService: PDFLinkService;
  pdfFindController: PDFFindController;
  pdfViewer: PDFViewer;
  pdfDocument: PDFDocumentProxy | undefined;

  constructor(container: HTMLDivElement) {
    const eventBus = new EventBus();
    const pdfLinkService = new PDFLinkService({
      eventBus,
    });
    const pdfFindController = new PDFFindController({
      eventBus,
      linkService: pdfLinkService,
    });

    // l10n resource
    const l10n = new GenericL10n("en-US");

    const pdfViewer = new PDFViewer({
      container,
      eventBus: eventBus,
      linkService: pdfLinkService,
      findController: pdfFindController,
      annotationEditorMode: AnnotationEditorType.NONE,
      l10n: l10n,
    });
    // must have this otherwise find controller does not work
    pdfLinkService.setViewer(pdfViewer);

    this.container = container;
    // this.peekContainer = peekContainer;
    this.eventBus = eventBus;
    this.pdfLinkService = pdfLinkService;
    this.pdfFindController = pdfFindController;
    this.pdfViewer = pdfViewer;
    this.pdfDocument = undefined; // initialize in loadPDF

    // install internal event listener
    eventBus.on("pagesinit", () => {
      this.container.addEventListener("mousewheel", (e) =>
        this.handleCtrlScroll(e as WheelEvent)
      );
    });

    eventBus.on("annotationlayerrendered", () => {
      this.container
        .querySelectorAll("section.linkAnnotation")
        .forEach((section) => {
          let link = section.querySelector("a");
          if (!link) return;
          if (section.hasAttribute("data-internal-link")) {
            // peek internal links
          } else {
            // external links must open using default browser
            let href = link.href;
            link.onclick = (e) => {
              e.preventDefault();
              // window.browser.openURL(href);
            };
          }
        });
    });

    // make saveState a debounce function
    // it ignores the signals 500ms after each call
  }

  async loadPDF(filePath: string) {
    console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeenter loadPDF");
    // load cmaps for rendering translated fonts
    let cMapUrl = "";
    cMapUrl = new URL("../../../cmaps/", import.meta.url).href;
    console.log("url?", import.meta.url);
    // cMapUrl = new URL("cmaps/", import.meta.url).href;
    console.log("readddddddddddddddddddy to read");
    console.log(filePath);
    this.pdfDocument = await getDocument({
      url: filePath,
      cMapUrl: cMapUrl,
      cMapPacked: true,
    }).promise;
    this.pdfLinkService.setDocument(this.pdfDocument, null);
    this.pdfFindController.setDocument(this.pdfDocument);
    this.pdfViewer.setDocument(this.pdfDocument);
  }

  changePageNumber(pageNumber: number) {
    this.pdfViewer.currentPageNumber = pageNumber;
  }

  changeScale(params: {
    delta?: number;
    scaleValue?: "page-width" | "page-height";
    scale?: number;
  }) {
    if (!!params.delta) this.pdfViewer.currentScale += params.delta;

    if (!!params.scaleValue)
      this.pdfViewer.currentScaleValue = params.scaleValue;

    if (!!params.scale) this.pdfViewer.currentScale = params.scale;
  }

  handleCtrlScroll(e: WheelEvent) {
    if (e.ctrlKey === true) {
      // this is not scrolling, so we need to
      // disable the default action avoid the offsetParent not set error
      e.preventDefault();
      if (e.deltaY < 0) {
        let container = this.container;
        let oldScale = this.pdfViewer.currentScale;
        this.pdfViewer.currentScale += 0.1;
        let newScale = this.pdfViewer.currentScale;

        let ratio = newScale / oldScale - 1;

        // shift the scroll bar if cursor is on the right / bottom of the screen
        // the default zoom-in takes the upper-left conner as scale origin
        if (e.pageX > window.innerWidth * (6 / 10))
          container.scrollLeft += ratio * (container.scrollLeft + e.pageX);
        if (e.pageY > window.innerHeight * (6 / 10))
          container.scrollTop += ratio * e.pageY;
      } else {
        this.pdfViewer.currentScale -= 0.1;
      }
    }
  }

  async getPageLabels(): Promise<string[]> {
    if (this.pdfDocument === undefined) return [];
    let labels = await this.pdfDocument.getPageLabels();
    if (labels === null) labels = [];
    return labels;
  }

  changeMatch(delta: number) {
    // delta can only be +1 (next) or -1 (prev)
    // highlight the next/previous match
    if (this.pdfFindController.selected === undefined) return;
    if (this.pdfFindController.pageMatches === undefined) return;

    let currentMatch = this.pdfFindController.selected;
    let matches = this.pdfFindController.pageMatches;

    let pageIdx = currentMatch.pageIdx;
    let newMatchIdx = currentMatch.matchIdx + delta;
    let matchIdxList = matches[pageIdx];

    while (newMatchIdx < 0 || newMatchIdx > matchIdxList.length - 1) {
      pageIdx += delta;
      let mod = pageIdx % this.pdfViewer.pagesCount; // mod can be negative
      pageIdx = mod >= 0 ? mod : this.pdfViewer.pagesCount - Math.abs(mod);
      // if next: select first match (delta-1 = 0) in the next available pages
      // if prev: select last match (length-1) in the previous available pages
      matchIdxList = matches[pageIdx];
      newMatchIdx = delta > 0 ? 0 : matchIdxList.length - 1;
    }

    if (newMatchIdx < 0) newMatchIdx = 0;
    if (newMatchIdx > matchIdxList.length)
      newMatchIdx = matchIdxList.length - 1;

    this.pdfFindController.selected.pageIdx = pageIdx;
    this.pdfFindController.selected.matchIdx = newMatchIdx;
    this.changePageNumber(pageIdx + 1);
    this.eventBus.dispatch("updatetextlayermatches", {
      source: this.pdfFindController,
      pageIndex: pageIdx,
    });
  }
}

export { PDFApplication };
