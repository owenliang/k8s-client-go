"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Types_1 = require("./atlas/Types");
var CharAtlasCache_1 = require("./atlas/CharAtlasCache");
var Buffer_1 = require("../Buffer");
var CharAtlasUtils_1 = require("./atlas/CharAtlasUtils");
var BaseRenderLayer = (function () {
    function BaseRenderLayer(_container, id, zIndex, _alpha, _colors) {
        this._container = _container;
        this._alpha = _alpha;
        this._colors = _colors;
        this._scaledCharWidth = 0;
        this._scaledCharHeight = 0;
        this._scaledCellWidth = 0;
        this._scaledCellHeight = 0;
        this._scaledCharLeft = 0;
        this._scaledCharTop = 0;
        this._currentGlyphIdentifier = {
            chars: '',
            code: 0,
            bg: 0,
            fg: 0,
            bold: false,
            dim: false,
            italic: false
        };
        this._canvas = document.createElement('canvas');
        this._canvas.classList.add("xterm-" + id + "-layer");
        this._canvas.style.zIndex = zIndex.toString();
        this._initCanvas();
        this._container.appendChild(this._canvas);
    }
    BaseRenderLayer.prototype.dispose = function () {
        this._container.removeChild(this._canvas);
        if (this._charAtlas) {
            this._charAtlas.dispose();
        }
    };
    BaseRenderLayer.prototype._initCanvas = function () {
        this._ctx = this._canvas.getContext('2d', { alpha: this._alpha });
        if (!this._alpha) {
            this.clearAll();
        }
    };
    BaseRenderLayer.prototype.onOptionsChanged = function (terminal) { };
    BaseRenderLayer.prototype.onBlur = function (terminal) { };
    BaseRenderLayer.prototype.onFocus = function (terminal) { };
    BaseRenderLayer.prototype.onCursorMove = function (terminal) { };
    BaseRenderLayer.prototype.onGridChanged = function (terminal, startRow, endRow) { };
    BaseRenderLayer.prototype.onSelectionChanged = function (terminal, start, end, columnSelectMode) {
        if (columnSelectMode === void 0) { columnSelectMode = false; }
    };
    BaseRenderLayer.prototype.onThemeChanged = function (terminal, colorSet) {
        this._refreshCharAtlas(terminal, colorSet);
    };
    BaseRenderLayer.prototype.setTransparency = function (terminal, alpha) {
        if (alpha === this._alpha) {
            return;
        }
        var oldCanvas = this._canvas;
        this._alpha = alpha;
        this._canvas = this._canvas.cloneNode();
        this._initCanvas();
        this._container.replaceChild(this._canvas, oldCanvas);
        this._refreshCharAtlas(terminal, this._colors);
        this.onGridChanged(terminal, 0, terminal.rows - 1);
    };
    BaseRenderLayer.prototype._refreshCharAtlas = function (terminal, colorSet) {
        if (this._scaledCharWidth <= 0 && this._scaledCharHeight <= 0) {
            return;
        }
        this._charAtlas = CharAtlasCache_1.acquireCharAtlas(terminal, colorSet, this._scaledCharWidth, this._scaledCharHeight);
        this._charAtlas.warmUp();
    };
    BaseRenderLayer.prototype.resize = function (terminal, dim) {
        this._scaledCellWidth = dim.scaledCellWidth;
        this._scaledCellHeight = dim.scaledCellHeight;
        this._scaledCharWidth = dim.scaledCharWidth;
        this._scaledCharHeight = dim.scaledCharHeight;
        this._scaledCharLeft = dim.scaledCharLeft;
        this._scaledCharTop = dim.scaledCharTop;
        this._canvas.width = dim.scaledCanvasWidth;
        this._canvas.height = dim.scaledCanvasHeight;
        this._canvas.style.width = dim.canvasWidth + "px";
        this._canvas.style.height = dim.canvasHeight + "px";
        if (!this._alpha) {
            this.clearAll();
        }
        this._refreshCharAtlas(terminal, this._colors);
    };
    BaseRenderLayer.prototype.fillCells = function (x, y, width, height) {
        this._ctx.fillRect(x * this._scaledCellWidth, y * this._scaledCellHeight, width * this._scaledCellWidth, height * this._scaledCellHeight);
    };
    BaseRenderLayer.prototype.fillBottomLineAtCells = function (x, y, width) {
        if (width === void 0) { width = 1; }
        this._ctx.fillRect(x * this._scaledCellWidth, (y + 1) * this._scaledCellHeight - window.devicePixelRatio - 1, width * this._scaledCellWidth, window.devicePixelRatio);
    };
    BaseRenderLayer.prototype.fillLeftLineAtCell = function (x, y) {
        this._ctx.fillRect(x * this._scaledCellWidth, y * this._scaledCellHeight, window.devicePixelRatio, this._scaledCellHeight);
    };
    BaseRenderLayer.prototype.strokeRectAtCell = function (x, y, width, height) {
        this._ctx.lineWidth = window.devicePixelRatio;
        this._ctx.strokeRect(x * this._scaledCellWidth + window.devicePixelRatio / 2, y * this._scaledCellHeight + (window.devicePixelRatio / 2), width * this._scaledCellWidth - window.devicePixelRatio, (height * this._scaledCellHeight) - window.devicePixelRatio);
    };
    BaseRenderLayer.prototype.clearAll = function () {
        if (this._alpha) {
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        else {
            this._ctx.fillStyle = this._colors.background.css;
            this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        }
    };
    BaseRenderLayer.prototype.clearCells = function (x, y, width, height) {
        if (this._alpha) {
            this._ctx.clearRect(x * this._scaledCellWidth, y * this._scaledCellHeight, width * this._scaledCellWidth, height * this._scaledCellHeight);
        }
        else {
            this._ctx.fillStyle = this._colors.background.css;
            this._ctx.fillRect(x * this._scaledCellWidth, y * this._scaledCellHeight, width * this._scaledCellWidth, height * this._scaledCellHeight);
        }
    };
    BaseRenderLayer.prototype.fillCharTrueColor = function (terminal, charData, x, y) {
        this._ctx.font = this._getFont(terminal, false, false);
        this._ctx.textBaseline = 'top';
        this._clipRow(terminal, y);
        this._ctx.fillText(charData[Buffer_1.CHAR_DATA_CHAR_INDEX], x * this._scaledCellWidth + this._scaledCharLeft, y * this._scaledCellHeight + this._scaledCharTop);
    };
    BaseRenderLayer.prototype.drawChars = function (terminal, chars, code, width, x, y, fg, bg, bold, dim, italic) {
        var drawInBrightColor = terminal.options.drawBoldTextInBrightColors && bold && fg < 8 && fg !== Types_1.INVERTED_DEFAULT_COLOR;
        fg += drawInBrightColor ? 8 : 0;
        this._currentGlyphIdentifier.chars = chars;
        this._currentGlyphIdentifier.code = code;
        this._currentGlyphIdentifier.bg = bg;
        this._currentGlyphIdentifier.fg = fg;
        this._currentGlyphIdentifier.bold = bold && terminal.options.enableBold;
        this._currentGlyphIdentifier.dim = dim;
        this._currentGlyphIdentifier.italic = italic;
        var atlasDidDraw = this._charAtlas && this._charAtlas.draw(this._ctx, this._currentGlyphIdentifier, x * this._scaledCellWidth + this._scaledCharLeft, y * this._scaledCellHeight + this._scaledCharTop);
        if (!atlasDidDraw) {
            this._drawUncachedChars(terminal, chars, width, fg, x, y, bold && terminal.options.enableBold, dim, italic);
        }
    };
    BaseRenderLayer.prototype._drawUncachedChars = function (terminal, chars, width, fg, x, y, bold, dim, italic) {
        this._ctx.save();
        this._ctx.font = this._getFont(terminal, bold, italic);
        this._ctx.textBaseline = 'top';
        if (fg === Types_1.INVERTED_DEFAULT_COLOR) {
            this._ctx.fillStyle = this._colors.background.css;
        }
        else if (CharAtlasUtils_1.is256Color(fg)) {
            this._ctx.fillStyle = this._colors.ansi[fg].css;
        }
        else {
            this._ctx.fillStyle = this._colors.foreground.css;
        }
        this._clipRow(terminal, y);
        if (dim) {
            this._ctx.globalAlpha = Types_1.DIM_OPACITY;
        }
        this._ctx.fillText(chars, x * this._scaledCellWidth + this._scaledCharLeft, y * this._scaledCellHeight + this._scaledCharTop);
        this._ctx.restore();
    };
    BaseRenderLayer.prototype._clipRow = function (terminal, y) {
        this._ctx.beginPath();
        this._ctx.rect(0, y * this._scaledCellHeight, terminal.cols * this._scaledCellWidth, this._scaledCellHeight);
        this._ctx.clip();
    };
    BaseRenderLayer.prototype._getFont = function (terminal, isBold, isItalic) {
        var fontWeight = isBold ? terminal.options.fontWeightBold : terminal.options.fontWeight;
        var fontStyle = isItalic ? 'italic' : '';
        return fontStyle + " " + fontWeight + " " + terminal.options.fontSize * window.devicePixelRatio + "px " + terminal.options.fontFamily;
    };
    return BaseRenderLayer;
}());
exports.BaseRenderLayer = BaseRenderLayer;
//# sourceMappingURL=BaseRenderLayer.js.map