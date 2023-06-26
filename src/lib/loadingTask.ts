import * as pdfjsLib from "pdfjs-dist";
import PDFJSWorker from "pdfjs-dist/build/pdf.worker?url";
import {
  DocumentInitParameters,
  PDFDataRangeTransport,
  PDFDocumentLoadingTask,
} from "pdfjs-dist/types/src/display/api";

export const createLoadingTask = (
  src:
    | string
    | URL
    | Uint8Array
    | PDFDataRangeTransport
    | DocumentInitParameters
): PDFDocumentLoadingTask => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJSWorker;
  const loadingTask = pdfjsLib.getDocument(src);
  return loadingTask;
};
