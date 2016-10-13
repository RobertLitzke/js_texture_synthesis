class SimpleMarkovRetexture {
  constructor(outputCanvasEl) {
    this.outputCanvasEl = outputCanvasEl;
    this.outputCtx = outputCanvasEl.getContext('2d');
    this.originalWidth = 0;
    this.originalHeight = 0;
  }

  generate(originalImageData, neighborCount, targetWidth, targetHeight) {
    this.targetArray = [];
    this.targetWidth = targetWidth;
    this.targetHeight = targetHeight;
    this.sourceWidth = originalImageData.width;
    this.sourceHeight = originalImageData.height;

    this.sourceRowArrayWidth = this.sourceWidth * 4;
    this.targetRowArrayWidth = this.targetWidth * 4;
    this.neighborCount = neighborCount;
    this.originalPixelArray = [];
    for (var i = 0; i < originalImageData.data.length; i += 4) {
      this.originalPixelArray.push(originalImageData.data.slice(i, i+4));
    }
    this.drawNoise_();
    this.start_();
  }

  start_() {
    this.generateRows_();
    var rgba = new ImageData(
      new Uint8ClampedArray(this.targetArray),
      this.targetWidth,
      this.targetHeight);
    this.outputCtx.putImageData(rgba, 0, 0);

    /*tileCtx.putImageData(rgba, 0, newHeight);
    tileCtx.putImageData(rgba, 0, 2 * newHeight);
    tileCtx.putImageData(rgba, newWidth, newHeight);
    tileCtx.putImageData(rgba, newWidth, 2 * newHeight);*/

    console.log('done');
  }

  generateRows_() {
    for (var i = 0; i < this.targetHeight; i++) {
      for (var j = 0; j < this.targetWidth; j++) {
        this.replaceNoise_(i, j);
      }
      console.log('generated row ' + i);
    }
  }

  /** Draws seed noise. */
  drawNoise_() {
    var array = new Array(this.targetWidth * this.targetHeight * 4);
    for (var i = 0; i < this.targetWidth * this.targetHeight * 4; i++) {
      // Generate noise, but no noisy alpha.
      array[i] = (i % 4 == 3) ? 255 : Math.floor(Math.random() * 256);
    }
    this.targetArray = array;
  }

  /** Generates retexture pixels. */
  replaceNoise_(x, y) {
    var match = this.findMatch_(x, y);
    var pixels = this.extractOriginalPixels_(match[0], match[1]);
    var start = x * 4 + y * this.sourceRowArrayWidth;
    this.targetArray[start] = pixels[0];
    this.targetArray[start+1] = pixels[1];
    this.targetArray[start+2] = pixels[2];
  }

  /**
   * Finds the closest pixel in the source that matches neighbors in the target.
   * and returns its coordinates.
   */
  findMatch_(x, y) {
    var minCost = Number.MAX_VALUE;
    var result = [0, 0];
    for (var i = 0; i < this.sourceWidth; i++) {
      for (var j = 0; j < this.sourceHeight; j++) {
        var cost = this.compareNeighbors_(x, y, i, j);
        if (cost < minCost) {
          minCost = cost;
          result = [i, j];
        }
      }
    }
    return result;
  }

  /** Returns total cost difference of neighboring pixels, as a number. */
  compareNeighbors_(x, y, x1, y1) {
    var targetNeighbors = this.getNeighbors_(
      x, y, this.targetWidth, this.targetHeight);
    var sourceNeighbors = this.getNeighbors_(
      x1, y1, this.sourceWidth, this.sourceHeight);
    var total = 0;
    for (var i = 0; i < sourceNeighbors.length; i++) {
      var sourcePixel = this.extractOriginalPixels_(
        sourceNeighbors[i][0],
        sourceNeighbors[i][1]);
      var targetPixel = this.extractPixels_(
        this.targetArray,
        targetNeighbors[i][0],
        targetNeighbors[i][1],
        this.targetRowArrayWidth);
      var delta = this.comparePixel_(sourcePixel, targetPixel);
      total += delta;
    }
    return total;
  }

  /**
   * Returns sequentially earlier neighbors for x, y, given a canvas of w, h.
   * Assumes a toroidal canvas (wrapping around).
   */
  getNeighbors_(x, y, w, h) {
    var results = [];
    // The neighborCount lines above, with 2x neighborCount bordering pixels,
    // Up to the current line.
    for (var i = x - this.neighborCount; i <= x + this.neighborCount; i++) {
      for (var j = y - this.neighborCount; j < y; j++) {
        if (i == x && j == y) {
          // Stope once we reach ourselves.
          break;
        }
        // Wrap width < 0.
        var xAt = i < 0 ? w + i : i;
        // Wrap width > max.
        var xAt = i >= w ? i - w : xAt;
        // Wrap height < 0.
        var yAt = j < 0 ? h + j : j;
        results.push([xAt, yAt]);
      }
    }
    return results;
  }

  /** Returns the four RGBA values that represent the pixel at X, Y. */
  extractPixels_(array, x, y, pixelValWidth) {
    var start = x * 4 + y * pixelValWidth;
    return array.slice(start, start+4);
  }

  /** Returns the four RGBA values that represent the pixel at X, Y. */
  extractOriginalPixels_(x, y) {
    return this.originalPixelArray[x + y * originalWidth];
  }

  /**
   * Given two pixels, squares the difference for each of r, g, b and returns
   * a sum of the result.
   */
  comparePixel_(p1, p2) {
    return Math.pow(p1[0]-p2[0], 2) +
      Math.pow(p1[1]-p2[1], 2) +
      Math.pow(p1[2]-p2[2], 2);
  }

}
