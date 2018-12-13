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
var CircularList_1 = require("./common/CircularList");
var EventEmitter_1 = require("./common/EventEmitter");
var BufferLine_1 = require("./BufferLine");
var Types_1 = require("./renderer/atlas/Types");
exports.DEFAULT_ATTR = (0 << 18) | (Types_1.DEFAULT_COLOR << 9) | (256 << 0);
exports.CHAR_DATA_ATTR_INDEX = 0;
exports.CHAR_DATA_CHAR_INDEX = 1;
exports.CHAR_DATA_WIDTH_INDEX = 2;
exports.CHAR_DATA_CODE_INDEX = 3;
exports.MAX_BUFFER_SIZE = 4294967295;
exports.NULL_CELL_CHAR = ' ';
exports.NULL_CELL_WIDTH = 1;
exports.NULL_CELL_CODE = 32;
var Buffer = (function () {
    function Buffer(_terminal, _hasScrollback) {
        this._terminal = _terminal;
        this._hasScrollback = _hasScrollback;
        this.markers = [];
        this.clear();
    }
    Buffer.prototype.setBufferLineFactory = function (type) {
        if (type === 'JsArray') {
            if (this._bufferLineConstructor !== BufferLine_1.BufferLineJSArray) {
                this._bufferLineConstructor = BufferLine_1.BufferLineJSArray;
                this._recreateLines();
            }
        }
        else {
            if (this._bufferLineConstructor !== BufferLine_1.BufferLine) {
                this._bufferLineConstructor = BufferLine_1.BufferLine;
                this._recreateLines();
            }
        }
    };
    Buffer.prototype._recreateLines = function () {
        if (!this.lines)
            return;
        for (var i = 0; i < this.lines.length; ++i) {
            var oldLine = this.lines.get(i);
            var newLine = new this._bufferLineConstructor(oldLine.length);
            for (var j = 0; j < oldLine.length; ++j) {
                newLine.set(j, oldLine.get(j));
            }
            this.lines.set(i, newLine);
        }
    };
    Buffer.prototype.getBlankLine = function (attr, isWrapped) {
        var fillCharData = [attr, exports.NULL_CELL_CHAR, exports.NULL_CELL_WIDTH, exports.NULL_CELL_CODE];
        return new this._bufferLineConstructor(this._terminal.cols, fillCharData, isWrapped);
    };
    Object.defineProperty(Buffer.prototype, "hasScrollback", {
        get: function () {
            return this._hasScrollback && this.lines.maxLength > this._terminal.rows;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "isCursorInViewport", {
        get: function () {
            var absoluteY = this.ybase + this.y;
            var relativeY = absoluteY - this.ydisp;
            return (relativeY >= 0 && relativeY < this._terminal.rows);
        },
        enumerable: true,
        configurable: true
    });
    Buffer.prototype._getCorrectBufferLength = function (rows) {
        if (!this._hasScrollback) {
            return rows;
        }
        var correctBufferLength = rows + this._terminal.options.scrollback;
        return correctBufferLength > exports.MAX_BUFFER_SIZE ? exports.MAX_BUFFER_SIZE : correctBufferLength;
    };
    Buffer.prototype.fillViewportRows = function (fillAttr) {
        if (this.lines.length === 0) {
            if (fillAttr === undefined) {
                fillAttr = exports.DEFAULT_ATTR;
            }
            var i = this._terminal.rows;
            while (i--) {
                this.lines.push(this.getBlankLine(fillAttr));
            }
        }
    };
    Buffer.prototype.clear = function () {
        this.setBufferLineFactory(this._terminal.options.experimentalBufferLineImpl);
        this.ydisp = 0;
        this.ybase = 0;
        this.y = 0;
        this.x = 0;
        this.lines = new CircularList_1.CircularList(this._getCorrectBufferLength(this._terminal.rows));
        this.scrollTop = 0;
        this.scrollBottom = this._terminal.rows - 1;
        this.setupTabStops();
    };
    Buffer.prototype.resize = function (newCols, newRows) {
        var newMaxLength = this._getCorrectBufferLength(newRows);
        if (newMaxLength > this.lines.maxLength) {
            this.lines.maxLength = newMaxLength;
        }
        if (this.lines.length > 0) {
            if (this._terminal.cols < newCols) {
                var ch = [exports.DEFAULT_ATTR, exports.NULL_CELL_CHAR, exports.NULL_CELL_WIDTH, exports.NULL_CELL_CODE];
                for (var i = 0; i < this.lines.length; i++) {
                    this.lines.get(i).resize(newCols, ch);
                }
            }
            var addToY = 0;
            if (this._terminal.rows < newRows) {
                for (var y = this._terminal.rows; y < newRows; y++) {
                    if (this.lines.length < newRows + this.ybase) {
                        if (this.ybase > 0 && this.lines.length <= this.ybase + this.y + addToY + 1) {
                            this.ybase--;
                            addToY++;
                            if (this.ydisp > 0) {
                                this.ydisp--;
                            }
                        }
                        else {
                            var fillCharData = [exports.DEFAULT_ATTR, exports.NULL_CELL_CHAR, exports.NULL_CELL_WIDTH, exports.NULL_CELL_CODE];
                            this.lines.push(new this._bufferLineConstructor(newCols, fillCharData));
                        }
                    }
                }
            }
            else {
                for (var y = this._terminal.rows; y > newRows; y--) {
                    if (this.lines.length > newRows + this.ybase) {
                        if (this.lines.length > this.ybase + this.y + 1) {
                            this.lines.pop();
                        }
                        else {
                            this.ybase++;
                            this.ydisp++;
                        }
                    }
                }
            }
            if (newMaxLength < this.lines.maxLength) {
                var amountToTrim = this.lines.length - newMaxLength;
                if (amountToTrim > 0) {
                    this.lines.trimStart(amountToTrim);
                    this.ybase = Math.max(this.ybase - amountToTrim, 0);
                    this.ydisp = Math.max(this.ydisp - amountToTrim, 0);
                }
                this.lines.maxLength = newMaxLength;
            }
            this.x = Math.min(this.x, newCols - 1);
            this.y = Math.min(this.y, newRows - 1);
            if (addToY) {
                this.y += addToY;
            }
            this.savedY = Math.min(this.savedY, newRows - 1);
            this.savedX = Math.min(this.savedX, newCols - 1);
            this.scrollTop = 0;
        }
        this.scrollBottom = newRows - 1;
    };
    Buffer.prototype.stringIndexToBufferIndex = function (lineIndex, stringIndex) {
        while (stringIndex) {
            var line = this.lines.get(lineIndex);
            if (!line) {
                [-1, -1];
            }
            for (var i = 0; i < line.length; ++i) {
                stringIndex -= line.get(i)[exports.CHAR_DATA_CHAR_INDEX].length;
                if (stringIndex < 0) {
                    return [lineIndex, i];
                }
            }
            lineIndex++;
        }
        return [lineIndex, 0];
    };
    Buffer.prototype.translateBufferLineToString = function (lineIndex, trimRight, startCol, endCol) {
        if (startCol === void 0) { startCol = 0; }
        if (endCol === void 0) { endCol = null; }
        var lineString = '';
        var line = this.lines.get(lineIndex);
        if (!line) {
            return '';
        }
        var startIndex = startCol;
        if (endCol === null) {
            endCol = line.length;
        }
        var endIndex = endCol;
        for (var i = 0; i < line.length; i++) {
            var char = line.get(i);
            lineString += char[exports.CHAR_DATA_CHAR_INDEX];
            if (char[exports.CHAR_DATA_WIDTH_INDEX] === 0) {
                if (startCol >= i) {
                    startIndex--;
                }
                if (endCol > i) {
                    endIndex--;
                }
            }
            else {
                if (char[exports.CHAR_DATA_CHAR_INDEX].length > 1) {
                    if (startCol > i) {
                        startIndex += char[exports.CHAR_DATA_CHAR_INDEX].length - 1;
                    }
                    if (endCol > i) {
                        endIndex += char[exports.CHAR_DATA_CHAR_INDEX].length - 1;
                    }
                }
            }
        }
        if (trimRight) {
            var rightWhitespaceIndex = lineString.search(/\s+$/);
            if (rightWhitespaceIndex !== -1) {
                endIndex = Math.min(endIndex, rightWhitespaceIndex);
            }
            if (endIndex <= startIndex) {
                return '';
            }
        }
        return lineString.substring(startIndex, endIndex);
    };
    Buffer.prototype.getWrappedRangeForLine = function (y) {
        var first = y;
        var last = y;
        while (first > 0 && this.lines.get(first).isWrapped) {
            first--;
        }
        while (last + 1 < this.lines.length && this.lines.get(last + 1).isWrapped) {
            last++;
        }
        return { first: first, last: last };
    };
    Buffer.prototype.setupTabStops = function (i) {
        if (i !== null && i !== undefined) {
            if (!this.tabs[i]) {
                i = this.prevStop(i);
            }
        }
        else {
            this.tabs = {};
            i = 0;
        }
        for (; i < this._terminal.cols; i += this._terminal.options.tabStopWidth) {
            this.tabs[i] = true;
        }
    };
    Buffer.prototype.prevStop = function (x) {
        if (x === null || x === undefined) {
            x = this.x;
        }
        while (!this.tabs[--x] && x > 0)
            ;
        return x >= this._terminal.cols ? this._terminal.cols - 1 : x < 0 ? 0 : x;
    };
    Buffer.prototype.nextStop = function (x) {
        if (x === null || x === undefined) {
            x = this.x;
        }
        while (!this.tabs[++x] && x < this._terminal.cols)
            ;
        return x >= this._terminal.cols ? this._terminal.cols - 1 : x < 0 ? 0 : x;
    };
    Buffer.prototype.addMarker = function (y) {
        var _this = this;
        var marker = new Marker(y);
        this.markers.push(marker);
        marker.register(this.lines.addDisposableListener('trim', function (amount) {
            marker.line -= amount;
            if (marker.line < 0) {
                marker.dispose();
            }
        }));
        marker.register(marker.addDisposableListener('dispose', function () { return _this._removeMarker(marker); }));
        return marker;
    };
    Buffer.prototype._removeMarker = function (marker) {
        this.markers.splice(this.markers.indexOf(marker), 1);
    };
    Buffer.prototype.iterator = function (trimRight, startIndex, endIndex, startOverscan, endOverscan) {
        return new BufferStringIterator(this, trimRight, startIndex, endIndex, startOverscan, endOverscan);
    };
    return Buffer;
}());
exports.Buffer = Buffer;
var Marker = (function (_super) {
    __extends(Marker, _super);
    function Marker(line) {
        var _this = _super.call(this) || this;
        _this.line = line;
        _this._id = Marker._nextId++;
        _this.isDisposed = false;
        return _this;
    }
    Object.defineProperty(Marker.prototype, "id", {
        get: function () { return this._id; },
        enumerable: true,
        configurable: true
    });
    Marker.prototype.dispose = function () {
        if (this.isDisposed) {
            return;
        }
        this.isDisposed = true;
        this.emit('dispose');
        _super.prototype.dispose.call(this);
    };
    Marker._nextId = 1;
    return Marker;
}(EventEmitter_1.EventEmitter));
exports.Marker = Marker;
var BufferStringIterator = (function () {
    function BufferStringIterator(_buffer, _trimRight, _startIndex, _endIndex, _startOverscan, _endOverscan) {
        if (_startIndex === void 0) { _startIndex = 0; }
        if (_endIndex === void 0) { _endIndex = _buffer.lines.length; }
        if (_startOverscan === void 0) { _startOverscan = 0; }
        if (_endOverscan === void 0) { _endOverscan = 0; }
        this._buffer = _buffer;
        this._trimRight = _trimRight;
        this._startIndex = _startIndex;
        this._endIndex = _endIndex;
        this._startOverscan = _startOverscan;
        this._endOverscan = _endOverscan;
        if (this._startIndex < 0) {
            this._startIndex = 0;
        }
        if (this._endIndex > this._buffer.lines.length) {
            this._endIndex = this._buffer.lines.length;
        }
        this._current = this._startIndex;
    }
    BufferStringIterator.prototype.hasNext = function () {
        return this._current < this._endIndex;
    };
    BufferStringIterator.prototype.next = function () {
        var range = this._buffer.getWrappedRangeForLine(this._current);
        if (range.first < this._startIndex - this._startOverscan) {
            range.first = this._startIndex - this._startOverscan;
        }
        if (range.last > this._endIndex + this._endOverscan) {
            range.last = this._endIndex + this._endOverscan;
        }
        range.first = Math.max(range.first, 0);
        range.last = Math.min(range.last, this._buffer.lines.length);
        var result = '';
        for (var i = range.first; i <= range.last; ++i) {
            result += this._buffer.translateBufferLineToString(i, (this._trimRight) ? i === range.last : false);
        }
        this._current = range.last + 1;
        return { range: range, content: result };
    };
    return BufferStringIterator;
}());
exports.BufferStringIterator = BufferStringIterator;
//# sourceMappingURL=Buffer.js.map