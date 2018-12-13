"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("../Buffer");
var Types_1 = require("./atlas/Types");
var GridCache_1 = require("./GridCache");
var BaseRenderLayer_1 = require("./BaseRenderLayer");
var CharAtlasUtils_1 = require("./atlas/CharAtlasUtils");
var TextRenderLayer = (function (_super) {
    __extends(TextRenderLayer, _super);
    function TextRenderLayer(container, zIndex, colors, characterJoinerRegistry, alpha) {
        var _this = _super.call(this, container, 'text', zIndex, alpha, colors) || this;
        _this._characterOverlapCache = {};
        _this._state = new GridCache_1.GridCache();
        _this._characterJoinerRegistry = characterJoinerRegistry;
        return _this;
    }
    TextRenderLayer.prototype.resize = function (terminal, dim) {
        _super.prototype.resize.call(this, terminal, dim);
        var terminalFont = this._getFont(terminal, false, false);
        if (this._characterWidth !== dim.scaledCharWidth || this._characterFont !== terminalFont) {
            this._characterWidth = dim.scaledCharWidth;
            this._characterFont = terminalFont;
            this._characterOverlapCache = {};
        }
        this._state.clear();
        this._state.resize(terminal.cols, terminal.rows);
    };
    TextRenderLayer.prototype.reset = function (terminal) {
        this._state.clear();
        this.clearAll();
    };
    TextRenderLayer.prototype._forEachCell = function (terminal, firstRow, lastRow, joinerRegistry, callback) {
        for (var y = firstRow; y <= lastRow; y++) {
            var row = y + terminal.buffer.ydisp;
            var line = terminal.buffer.lines.get(row);
            var joinedRanges = joinerRegistry ? joinerRegistry.getJoinedCharacters(row) : [];
            for (var x = 0; x < terminal.cols; x++) {
                var charData = line.get(x);
                var code = charData[Buffer_1.CHAR_DATA_CODE_INDEX];
                var chars = charData[Buffer_1.CHAR_DATA_CHAR_INDEX];
                var attr = charData[Buffer_1.CHAR_DATA_ATTR_INDEX];
                var width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
                var isJoined = false;
                var lastCharX = x;
                if (width === 0) {
                    continue;
                }
                if (joinedRanges.length > 0 && x === joinedRanges[0][0]) {
                    isJoined = true;
                    var range = joinedRanges.shift();
                    chars = terminal.buffer.translateBufferLineToString(row, true, range[0], range[1]);
                    width = range[1] - range[0];
                    code = Infinity;
                    lastCharX = range[1] - 1;
                }
                if (!isJoined && this._isOverlapping(charData)) {
                    if (lastCharX < line.length - 1 && line.get(lastCharX + 1)[Buffer_1.CHAR_DATA_CODE_INDEX] === Buffer_1.NULL_CELL_CODE) {
                        width = 2;
                    }
                }
                var flags = attr >> 18;
                var bg = attr & 0x1ff;
                var fg = (attr >> 9) & 0x1ff;
                if (flags & 8) {
                    var temp = bg;
                    bg = fg;
                    fg = temp;
                    if (fg === Types_1.DEFAULT_COLOR) {
                        fg = Types_1.INVERTED_DEFAULT_COLOR;
                    }
                    if (bg === Types_1.DEFAULT_COLOR) {
                        bg = Types_1.INVERTED_DEFAULT_COLOR;
                    }
                }
                callback(code, chars, width, x, y, fg, bg, flags);
                x = lastCharX;
            }
        }
    };
    TextRenderLayer.prototype._drawBackground = function (terminal, firstRow, lastRow) {
        var _this = this;
        var ctx = this._ctx;
        var cols = terminal.cols;
        var startX = 0;
        var startY = 0;
        var prevFillStyle = null;
        ctx.save();
        this._forEachCell(terminal, firstRow, lastRow, null, function (code, chars, width, x, y, fg, bg, flags) {
            var nextFillStyle = null;
            if (bg === Types_1.INVERTED_DEFAULT_COLOR) {
                nextFillStyle = _this._colors.foreground.css;
            }
            else if (CharAtlasUtils_1.is256Color(bg)) {
                nextFillStyle = _this._colors.ansi[bg].css;
            }
            if (prevFillStyle === null) {
                startX = x;
                startY = y;
            }
            if (y !== startY) {
                ctx.fillStyle = prevFillStyle;
                _this.fillCells(startX, startY, cols - startX, 1);
                startX = x;
                startY = y;
            }
            else if (prevFillStyle !== nextFillStyle) {
                ctx.fillStyle = prevFillStyle;
                _this.fillCells(startX, startY, x - startX, 1);
                startX = x;
                startY = y;
            }
            prevFillStyle = nextFillStyle;
        });
        if (prevFillStyle !== null) {
            ctx.fillStyle = prevFillStyle;
            this.fillCells(startX, startY, cols - startX, 1);
        }
        ctx.restore();
    };
    TextRenderLayer.prototype._drawForeground = function (terminal, firstRow, lastRow) {
        var _this = this;
        this._forEachCell(terminal, firstRow, lastRow, this._characterJoinerRegistry, function (code, chars, width, x, y, fg, bg, flags) {
            if (flags & 16) {
                return;
            }
            if (flags & 2) {
                _this._ctx.save();
                if (fg === Types_1.INVERTED_DEFAULT_COLOR) {
                    _this._ctx.fillStyle = _this._colors.background.css;
                }
                else if (CharAtlasUtils_1.is256Color(fg)) {
                    _this._ctx.fillStyle = _this._colors.ansi[fg].css;
                }
                else {
                    _this._ctx.fillStyle = _this._colors.foreground.css;
                }
                _this.fillBottomLineAtCells(x, y, width);
                _this._ctx.restore();
            }
            _this.drawChars(terminal, chars, code, width, x, y, fg, bg, !!(flags & 1), !!(flags & 32), !!(flags & 64));
        });
    };
    TextRenderLayer.prototype.onGridChanged = function (terminal, firstRow, lastRow) {
        if (this._state.cache.length === 0) {
            return;
        }
        if (this._charAtlas) {
            this._charAtlas.beginFrame();
        }
        this.clearCells(0, firstRow, terminal.cols, lastRow - firstRow + 1);
        this._drawBackground(terminal, firstRow, lastRow);
        this._drawForeground(terminal, firstRow, lastRow);
    };
    TextRenderLayer.prototype.onOptionsChanged = function (terminal) {
        this.setTransparency(terminal, terminal.options.allowTransparency);
    };
    TextRenderLayer.prototype._isOverlapping = function (charData) {
        if (charData[Buffer_1.CHAR_DATA_WIDTH_INDEX] !== 1) {
            return false;
        }
        var code = charData[Buffer_1.CHAR_DATA_CODE_INDEX];
        if (code < 256) {
            return false;
        }
        var char = charData[Buffer_1.CHAR_DATA_CHAR_INDEX];
        if (this._characterOverlapCache.hasOwnProperty(char)) {
            return this._characterOverlapCache[char];
        }
        this._ctx.save();
        this._ctx.font = this._characterFont;
        var overlaps = Math.floor(this._ctx.measureText(char).width) > this._characterWidth;
        this._ctx.restore();
        this._characterOverlapCache[char] = overlaps;
        return overlaps;
    };
    return TextRenderLayer;
}(BaseRenderLayer_1.BaseRenderLayer));
exports.TextRenderLayer = TextRenderLayer;
//# sourceMappingURL=TextRenderLayer.js.map