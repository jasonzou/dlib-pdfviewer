# PDF.js examples
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

Alternatively, if you want the canvas to render to a certain pixel size you could do the following:

```
var desiredWidth = 100;
var viewport = page.getViewport({ scale: 1, });
var scale = desiredWidth / viewport.width;
var scaledViewport = page.getViewport({ scale: scale, });
```

## Sources:
- https://mozilla.github.io/pdf.js/examples/index.html#interactive-examples
- https://mozilla.github.io/pdf.js