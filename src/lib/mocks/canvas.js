// Stub for pdf.js-extract optional canvas dependency (not needed for text extraction)
class Canvas {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    getContext() {
        return null;
    }
}
module.exports = Canvas;
