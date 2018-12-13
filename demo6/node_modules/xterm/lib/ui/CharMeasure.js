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
var EventEmitter_1 = require("../common/EventEmitter");
var CharMeasure = (function (_super) {
    __extends(CharMeasure, _super);
    function CharMeasure(document, parentElement) {
        var _this = _super.call(this) || this;
        _this._document = document;
        _this._parentElement = parentElement;
        _this._measureElement = _this._document.createElement('span');
        _this._measureElement.classList.add('xterm-char-measure-element');
        _this._measureElement.textContent = 'W';
        _this._measureElement.setAttribute('aria-hidden', 'true');
        _this._parentElement.appendChild(_this._measureElement);
        return _this;
    }
    Object.defineProperty(CharMeasure.prototype, "width", {
        get: function () {
            return this._width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CharMeasure.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: true,
        configurable: true
    });
    CharMeasure.prototype.measure = function (options) {
        this._measureElement.style.fontFamily = options.fontFamily;
        this._measureElement.style.fontSize = options.fontSize + "px";
        var geometry = this._measureElement.getBoundingClientRect();
        if (geometry.width === 0 || geometry.height === 0) {
            return;
        }
        if (this._width !== geometry.width || this._height !== geometry.height) {
            this._width = geometry.width;
            this._height = Math.ceil(geometry.height);
            this.emit('charsizechanged');
        }
    };
    return CharMeasure;
}(EventEmitter_1.EventEmitter));
exports.CharMeasure = CharMeasure;
//# sourceMappingURL=CharMeasure.js.map