"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MouseHelper = (function () {
    function MouseHelper(_renderer) {
        this._renderer = _renderer;
    }
    MouseHelper.prototype.setRenderer = function (renderer) {
        this._renderer = renderer;
    };
    MouseHelper.getCoordsRelativeToElement = function (event, element) {
        if (event.pageX === null || event.pageX === undefined) {
            return null;
        }
        var originalElement = element;
        var x = event.pageX;
        var y = event.pageY;
        while (element) {
            x -= element.offsetLeft;
            y -= element.offsetTop;
            element = element.offsetParent;
        }
        element = originalElement;
        while (element && element !== element.ownerDocument.body) {
            x += element.scrollLeft;
            y += element.scrollTop;
            element = element.parentElement;
        }
        return [x, y];
    };
    MouseHelper.prototype.getCoords = function (event, element, charMeasure, colCount, rowCount, isSelection) {
        if (!charMeasure.width || !charMeasure.height) {
            return null;
        }
        var coords = MouseHelper.getCoordsRelativeToElement(event, element);
        if (!coords) {
            return null;
        }
        coords[0] = Math.ceil((coords[0] + (isSelection ? this._renderer.dimensions.actualCellWidth / 2 : 0)) / this._renderer.dimensions.actualCellWidth);
        coords[1] = Math.ceil(coords[1] / this._renderer.dimensions.actualCellHeight);
        coords[0] = Math.min(Math.max(coords[0], 1), colCount + (isSelection ? 1 : 0));
        coords[1] = Math.min(Math.max(coords[1], 1), rowCount);
        return coords;
    };
    MouseHelper.prototype.getRawByteCoords = function (event, element, charMeasure, colCount, rowCount) {
        var coords = this.getCoords(event, element, charMeasure, colCount, rowCount);
        var x = coords[0];
        var y = coords[1];
        x += 32;
        y += 32;
        return { x: x, y: y };
    };
    return MouseHelper;
}());
exports.MouseHelper = MouseHelper;
//# sourceMappingURL=MouseHelper.js.map