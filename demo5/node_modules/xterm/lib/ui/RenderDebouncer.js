"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RenderDebouncer = (function () {
    function RenderDebouncer(_terminal, _callback) {
        this._terminal = _terminal;
        this._callback = _callback;
        this._animationFrame = null;
    }
    RenderDebouncer.prototype.dispose = function () {
        if (this._animationFrame) {
            window.cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    };
    RenderDebouncer.prototype.refresh = function (rowStart, rowEnd) {
        var _this = this;
        rowStart = rowStart !== null && rowStart !== undefined ? rowStart : 0;
        rowEnd = rowEnd !== null && rowEnd !== undefined ? rowEnd : this._terminal.rows - 1;
        var isRowStartSet = this._rowStart !== undefined && this._rowStart !== null;
        var isRowEndSet = this._rowEnd !== undefined && this._rowEnd !== null;
        this._rowStart = isRowStartSet ? Math.min(this._rowStart, rowStart) : rowStart;
        this._rowEnd = isRowEndSet ? Math.max(this._rowEnd, rowEnd) : rowEnd;
        if (this._animationFrame) {
            return;
        }
        this._animationFrame = window.requestAnimationFrame(function () { return _this._innerRefresh(); });
    };
    RenderDebouncer.prototype._innerRefresh = function () {
        this._rowStart = Math.max(this._rowStart, 0);
        this._rowEnd = Math.min(this._rowEnd, this._terminal.rows - 1);
        this._callback(this._rowStart, this._rowEnd);
        this._rowStart = null;
        this._rowEnd = null;
        this._animationFrame = null;
    };
    return RenderDebouncer;
}());
exports.RenderDebouncer = RenderDebouncer;
//# sourceMappingURL=RenderDebouncer.js.map