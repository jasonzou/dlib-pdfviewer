# PDF.js
Learning PDF.js with examples. 

## Introduction
PDF.js has three layers.

| Layer | Description| 
| - | - |
| Core |  The core layer is where a binary PDF is parsed and interpreted. This layer is the foundation for all subsequent layers. It is not documented here because using it directly is considered an advanced usage and the API is likely to change. For an example of using the core layer see the [PDF Object Browser](pdfobjectbrowser). |
| Display | The display layer takes the core layer and exposes an easier to use API to render PDFs and get other information out of a document. This API is what the version number is based on. |
| Viewer|The viewer is built on the display layer and is the UI for PDF viewer in Firefox and the other browser extensions within the project. It can be a good starting point for building your own viewer. However, we do ask if you plan to embed the viewer in your own site, that it not just be an unmodified version. Please re-skin it or build upon it. |

### File Layout Overview

#### Prebuilt
```
├── build/
│   ├── pdf.js                             - display layer
│   ├── pdf.js.map                         - display layer's source map
│   ├── pdf.worker.js                      - core layer
│   └── pdf.worker.js.map                  - core layer's source map
├── web/
│   ├── cmaps/                             - character maps (required by core)
│   ├── compressed.tracemonkey-pldi-09.pdf - PDF file for testing purposes
│   ├── debugger.js                        - helpful debugging features
│   ├── images/                            - images for the viewer and annotation icons
│   ├── locale/                            - translation files
│   ├── viewer.css                         - viewer style sheet
│   ├── viewer.html                        - viewer layout
│   ├── viewer.js                          - viewer layer
│   └── viewer.js.map                      - viewer layer's source map
└── LICENSE
```
#### Source
```
├── docs/                                  - website source code
├── examples/                              - simple usage examples
├── extensions/                            - browser extension source code
├── external/                              - third party code
├── l10n/                                  - translation files
├── src/
│   ├── core/                              - core layer
│   ├── display/                           - display layer
│   ├── shared/                            - shared code between the core and display layers
│   ├── interfaces.js                      - interface definitions for the core/display layers
│   └── pdf.*.js                           - wrapper files for bundling
├── test/                                  - unit, font, reference, and integration tests
├── web/                                   - viewer layer
├── LICENSE
├── README.md
├── gulpfile.js                            - build scripts/logic
├── package-lock.json                      - pinned dependency versions
└── package.json                           - package definition and dependencies
```

## The Viewer
The web/viewer.html is a viewer that we can use to view pdfs. In the source, the web folder has lots of js files that can give us more about the PDF.js

## PDF.js examples
PDF.js heavily relies on the use of [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise).

### Document
The object structure of PDF.js loosely follows the structure of an actual PDF. At the top level there is a document object.

The following code is to get a document.
```
pdfjsLib.getDocument('helloworld.pdf')
```
pdfjsLib is the core of PDF.js. The previous code uses promises should like the following:
```
var loadingTask = pdfjsLib.getDocument('helloworld.pdf');
loadingTask.promise.then(function (pdf){
    // then pdf can be used here.
});
```

### Page
Once we have the document, we can get a page.
```
pdf.getPage(1).then(function(page){
    // page can be used here
});

#### Rendering the Page
Each PDF page has its won viewport which defines the size in pixels (72DPI) and initial rotatioin. By default the viewport is scaled to the original size of the PDF, but this can be changed by modifying the viewport. When the viewport is created, an initial transformation matrix will also be created that takes into account the desired scale, rotation, and it transforms the coordinate system (the 0,0 point in PDF documents the bottom-left whereas canvas 0,0 is top-left).

```javascript,editable
var scale = 1.5;
var viewport = page.getViewport({ scale: scale, });
// Support HiDPI-screens.
var outputScale = window.devicePixelRatio || 1;

var canvas = document.getElementById('the-canvas');
var context = canvas.getContext('2d');

canvas.width = Math.floor(viewport.width * outputScale);
canvas.height = Math.floor(viewport.height * outputScale);
canvas.style.width = Math.floor(viewport.width) + "px";
canvas.style.height =  Math.floor(viewport.height) + "px";

var transform = outputScale !== 1
  ? [outputScale, 0, 0, outputScale, 0, 0]
  : null;

var renderContext = {
  canvasContext: context,
  transform: transform,
  viewport: viewport
};
page.render(renderContext);
```

## Sources:
- https://mozilla.github.io/pdf.js/examples/index.html#interactive-examples
- https://mozilla.github.io/pdf.js