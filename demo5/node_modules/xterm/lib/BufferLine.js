"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("./Buffer");
var BufferLineJSArray = (function () {
    function BufferLineJSArray(cols, fillCharData, isWrapped) {
        this.isWrapped = false;
        this._data = [];
        if (!fillCharData) {
            fillCharData = [0, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE];
        }
        for (var i = 0; i < cols; i++) {
            this._push(fillCharData);
        }
        if (isWrapped) {
            this.isWrapped = true;
        }
        this.length = this._data.length;
    }
    BufferLineJSArray.prototype._pop = function () {
        var data = this._data.pop();
        this.length = this._data.length;
        return data;
    };
    BufferLineJSArray.prototype._push = function (data) {
        this._data.push(data);
        this.length = this._data.length;
    };
    BufferLineJSArray.prototype._splice = function (start, deleteCount) {
        var items = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            items[_i - 2] = arguments[_i];
        }
        var _a;
        var removed = (_a = this._data).splice.apply(_a, [start, deleteCount].concat(items));
        this.length = this._data.length;
        return removed;
    };
    BufferLineJSArray.prototype.get = function (index) {
        return this._data[index];
    };
    BufferLineJSArray.prototype.set = function (index, data) {
        this._data[index] = data;
    };
    BufferLineJSArray.prototype.insertCells = function (pos, n, ch) {
        while (n--) {
            this._splice(pos, 0, ch);
            this._pop();
        }
    };
    BufferLineJSArray.prototype.deleteCells = function (pos, n, fillCharData) {
        while (n--) {
            this._splice(pos, 1);
            this._push(fillCharData);
        }
    };
    BufferLineJSArray.prototype.replaceCells = function (start, end, fillCharData) {
        while (start < end && start < this.length) {
            this.set(start++, fillCharData);
        }
    };
    BufferLineJSArray.prototype.resize = function (cols, fillCharData, shrink) {
        if (shrink === void 0) { shrink = false; }
        while (this._data.length < cols) {
            this._data.push(fillCharData);
        }
        if (shrink) {
            while (this._data.length > cols) {
                this._data.pop();
            }
        }
        this.length = this._data.length;
    };
    BufferLineJSArray.prototype.fill = function (fillCharData) {
        for (var i = 0; i < this.length; ++i) {
            this.set(i, fillCharData);
        }
    };
    BufferLineJSArray.prototype.copyFrom = function (line) {
        this._data = line._data.slice(0);
        this.length = line.length;
        this.isWrapped = line.isWrapped;
    };
    BufferLineJSArray.prototype.clone = function () {
        var newLine = new BufferLineJSArray(0);
        newLine.copyFrom(this);
        return newLine;
    };
    return BufferLineJSArray;
}());
exports.BufferLineJSArray = BufferLineJSArray;
var CELL_SIZE = 3;
var BufferLine = (function () {
    function BufferLine(cols, fillCharData, isWrapped) {
        if (isWrapped === void 0) { isWrapped = false; }
        this.isWrapped = isWrapped;
        this._data = null;
        this._combined = {};
        if (!fillCharData) {
            fillCharData = [0, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE];
        }
        if (cols) {
            this._data = new Uint32Array(cols * CELL_SIZE);
            for (var i = 0; i < cols; ++i) {
                this.set(i, fillCharData);
            }
        }
        this.length = cols;
    }
    BufferLine.prototype.get = function (index) {
        var stringData = this._data[index * CELL_SIZE + 1];
        return [
            this._data[index * CELL_SIZE + 0],
            (stringData & 0x80000000)
                ? this._combined[index]
                : (stringData) ? String.fromCharCode(stringData) : '',
            this._data[index * CELL_SIZE + 2],
            (stringData & 0x80000000)
                ? this._combined[index].charCodeAt(this._combined[index].length - 1)
                : stringData
        ];
    };
    BufferLine.prototype.set = function (index, value) {
        this._data[index * CELL_SIZE + 0] = value[0];
        if (value[1].length > 1) {
            this._combined[index] = value[1];
            this._data[index * CELL_SIZE + 1] = index | 0x80000000;
        }
        else {
            this._data[index * CELL_SIZE + 1] = value[1].charCodeAt(0);
        }
        this._data[index * CELL_SIZE + 2] = value[2];
    };
    BufferLine.prototype.insertCells = function (pos, n, fillCharData) {
        pos %= this.length;
        if (n < this.length - pos) {
            for (var i = this.length - pos - n - 1; i >= 0; --i) {
                this.set(pos + n + i, this.get(pos + i));
            }
            for (var i = 0; i < n; ++i) {
                this.set(pos + i, fillCharData);
            }
        }
        else {
            for (var i = pos; i < this.length; ++i) {
                this.set(i, fillCharData);
            }
        }
    };
    BufferLine.prototype.deleteCells = function (pos, n, fillCharData) {
        pos %= this.length;
        if (n < this.length - pos) {
            for (var i = 0; i < this.length - pos - n; ++i) {
                this.set(pos + i, this.get(pos + n + i));
            }
            for (var i = this.length - n; i < this.length; ++i) {
                this.set(i, fillCharData);
            }
        }
        else {
            for (var i = pos; i < this.length; ++i) {
                this.set(i, fillCharData);
            }
        }
    };
    BufferLine.prototype.replaceCells = function (start, end, fillCharData) {
        while (start < end && start < this.length) {
            this.set(start++, fillCharData);
        }
    };
    BufferLine.prototype.resize = function (cols, fillCharData, shrink) {
        if (shrink === void 0) { shrink = false; }
        if (cols === this.length || (!shrink && cols < this.length)) {
            return;
        }
        if (cols > this.length) {
            var data = new Uint32Array(cols * CELL_SIZE);
            if (this.length) {
                if (cols * CELL_SIZE < this._data.length) {
                    data.set(this._data.subarray(0, cols * CELL_SIZE));
                }
                else {
                    data.set(this._data);
                }
            }
            this._data = data;
            for (var i = this.length; i < cols; ++i) {
                this.set(i, fillCharData);
            }
        }
        else if (shrink) {
            if (cols) {
                var data = new Uint32Array(cols * CELL_SIZE);
                data.set(this._data.subarray(0, cols * CELL_SIZE));
                this._data = data;
            }
            else {
                this._data = null;
            }
        }
        this.length = cols;
    };
    BufferLine.prototype.fill = function (fillCharData) {
        this._combined = {};
        for (var i = 0; i < this.length; ++i) {
            this.set(i, fillCharData);
        }
    };
    BufferLine.prototype.copyFrom = function (line) {
        if (this.length !== line.length) {
            this._data = new Uint32Array(line._data);
        }
        else {
            this._data.set(line._data);
        }
        this.length = line.length;
        this._combined = {};
        for (var el in line._combined) {
            this._combined[el] = line._combined[el];
        }
        this.isWrapped = line.isWrapped;
    };
    BufferLine.prototype.clone = function () {
        var newLine = new BufferLine(0);
        newLine._data = new Uint32Array(this._data);
        newLine.length = this.length;
        for (var el in this._combined) {
            newLine._combined[el] = this._combined[el];
        }
        newLine.isWrapped = this.isWrapped;
        return newLine;
    };
    return BufferLine;
}());
exports.BufferLine = BufferLine;
//# sourceMappingURL=BufferLine.js.map