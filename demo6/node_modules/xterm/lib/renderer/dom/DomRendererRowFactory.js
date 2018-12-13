"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("../../Buffer");
var Types_1 = require("../atlas/Types");
exports.BOLD_CLASS = 'xterm-bold';
exports.ITALIC_CLASS = 'xterm-italic';
exports.CURSOR_CLASS = 'xterm-cursor';
exports.CURSOR_STYLE_BLOCK_CLASS = 'xterm-cursor-block';
exports.CURSOR_STYLE_BAR_CLASS = 'xterm-cursor-bar';
exports.CURSOR_STYLE_UNDERLINE_CLASS = 'xterm-cursor-underline';
var DomRendererRowFactory = (function () {
    function DomRendererRowFactory(_document) {
        this._document = _document;
    }
    DomRendererRowFactory.prototype.createRow = function (lineData, isCursorRow, cursorStyle, cursorX, cellWidth, cols) {
        var fragment = this._document.createDocumentFragment();
        var lineLength = 0;
        for (var x = Math.min(lineData.length, cols) - 1; x >= 0; x--) {
            var charData = lineData.get(x);
            var code = charData[Buffer_1.CHAR_DATA_CODE_INDEX];
            if (code !== Buffer_1.NULL_CELL_CODE || (isCursorRow && x === cursorX)) {
                lineLength = x + 1;
                break;
            }
        }
        for (var x = 0; x < lineLength; x++) {
            var charData = lineData.get(x);
            var char = charData[Buffer_1.CHAR_DATA_CHAR_INDEX];
            var attr = charData[Buffer_1.CHAR_DATA_ATTR_INDEX];
            var width = charData[Buffer_1.CHAR_DATA_WIDTH_INDEX];
            if (width === 0) {
                continue;
            }
            var charElement = this._document.createElement('span');
            if (width > 1) {
                charElement.style.width = cellWidth * width + "px";
            }
            var flags = attr >> 18;
            var bg = attr & 0x1ff;
            var fg = (attr >> 9) & 0x1ff;
            if (isCursorRow && x === cursorX) {
                charElement.classList.add(exports.CURSOR_CLASS);
                switch (cursorStyle) {
                    case 'bar':
                        charElement.classList.add(exports.CURSOR_STYLE_BAR_CLASS);
                        break;
                    case 'underline':
                        charElement.classList.add(exports.CURSOR_STYLE_UNDERLINE_CLASS);
                        break;
                    default:
                        charElement.classList.add(exports.CURSOR_STYLE_BLOCK_CLASS);
                        break;
                }
            }
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
            if (flags & 1) {
                if (fg < 8) {
                    fg += 8;
                }
                charElement.classList.add(exports.BOLD_CLASS);
            }
            if (flags & 64) {
                charElement.classList.add(exports.ITALIC_CLASS);
            }
            charElement.textContent = char;
            if (fg !== Types_1.DEFAULT_COLOR) {
                charElement.classList.add("xterm-fg-" + fg);
            }
            if (bg !== Types_1.DEFAULT_COLOR) {
                charElement.classList.add("xterm-bg-" + bg);
            }
            fragment.appendChild(charElement);
        }
        return fragment;
    };
    return DomRendererRowFactory;
}());
exports.DomRendererRowFactory = DomRendererRowFactory;
//# sourceMappingURL=DomRendererRowFactory.js.map