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
var TextRenderLayer_1 = require("./TextRenderLayer");
var SelectionRenderLayer_1 = require("./SelectionRenderLayer");
var CursorRenderLayer_1 = require("./CursorRenderLayer");
var ColorManager_1 = require("./ColorManager");
var LinkRenderLayer_1 = require("./LinkRenderLayer");
var EventEmitter_1 = require("../common/EventEmitter");
var RenderDebouncer_1 = require("../ui/RenderDebouncer");
var ScreenDprMonitor_1 = require("../ui/ScreenDprMonitor");
var CharacterJoinerRegistry_1 = require("../renderer/CharacterJoinerRegistry");
var Renderer = (function (_super) {
    __extends(Renderer, _super);
    function Renderer(_terminal, theme) {
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._isPaused = false;
        _this._needsFullRefresh = false;
        var allowTransparency = _this._terminal.options.allowTransparency;
        _this.colorManager = new ColorManager_1.ColorManager(document, allowTransparency);
        _this._characterJoinerRegistry = new CharacterJoinerRegistry_1.CharacterJoinerRegistry(_terminal);
        if (theme) {
            _this.colorManager.setTheme(theme);
        }
        _this._renderLayers = [
            new TextRenderLayer_1.TextRenderLayer(_this._terminal.screenElement, 0, _this.colorManager.colors, _this._characterJoinerRegistry, allowTransparency),
            new SelectionRenderLayer_1.SelectionRenderLayer(_this._terminal.screenElement, 1, _this.colorManager.colors),
            new LinkRenderLayer_1.LinkRenderLayer(_this._terminal.screenElement, 2, _this.colorManager.colors, _this._terminal),
            new CursorRenderLayer_1.CursorRenderLayer(_this._terminal.screenElement, 3, _this.colorManager.colors)
        ];
        _this.dimensions = {
            scaledCharWidth: null,
            scaledCharHeight: null,
            scaledCellWidth: null,
            scaledCellHeight: null,
            scaledCharLeft: null,
            scaledCharTop: null,
            scaledCanvasWidth: null,
            scaledCanvasHeight: null,
            canvasWidth: null,
            canvasHeight: null,
            actualCellWidth: null,
            actualCellHeight: null
        };
        _this._devicePixelRatio = window.devicePixelRatio;
        _this._updateDimensions();
        _this.onOptionsChanged();
        _this._renderDebouncer = new RenderDebouncer_1.RenderDebouncer(_this._terminal, _this._renderRows.bind(_this));
        _this._screenDprMonitor = new ScreenDprMonitor_1.ScreenDprMonitor();
        _this._screenDprMonitor.setListener(function () { return _this.onWindowResize(window.devicePixelRatio); });
        _this.register(_this._screenDprMonitor);
        if ('IntersectionObserver' in window) {
            var observer_1 = new IntersectionObserver(function (e) { return _this.onIntersectionChange(e[0]); }, { threshold: 0 });
            observer_1.observe(_this._terminal.element);
            _this.register({ dispose: function () { return observer_1.disconnect(); } });
        }
        return _this;
    }
    Renderer.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._renderLayers.forEach(function (l) { return l.dispose(); });
    };
    Renderer.prototype.onIntersectionChange = function (entry) {
        this._isPaused = entry.intersectionRatio === 0;
        if (!this._isPaused && this._needsFullRefresh) {
            this._terminal.refresh(0, this._terminal.rows - 1);
        }
    };
    Renderer.prototype.onWindowResize = function (devicePixelRatio) {
        if (this._devicePixelRatio !== devicePixelRatio) {
            this._devicePixelRatio = devicePixelRatio;
            this.onResize(this._terminal.cols, this._terminal.rows);
        }
    };
    Renderer.prototype.setTheme = function (theme) {
        var _this = this;
        this.colorManager.setTheme(theme);
        this._renderLayers.forEach(function (l) {
            l.onThemeChanged(_this._terminal, _this.colorManager.colors);
            l.reset(_this._terminal);
        });
        if (this._isPaused) {
            this._needsFullRefresh = true;
        }
        else {
            this._terminal.refresh(0, this._terminal.rows - 1);
        }
        return this.colorManager.colors;
    };
    Renderer.prototype.onResize = function (cols, rows) {
        var _this = this;
        this._updateDimensions();
        this._renderLayers.forEach(function (l) { return l.resize(_this._terminal, _this.dimensions); });
        if (this._isPaused) {
            this._needsFullRefresh = true;
        }
        else {
            this._terminal.refresh(0, this._terminal.rows - 1);
        }
        this._terminal.screenElement.style.width = this.dimensions.canvasWidth + "px";
        this._terminal.screenElement.style.height = this.dimensions.canvasHeight + "px";
        this.emit('resize', {
            width: this.dimensions.canvasWidth,
            height: this.dimensions.canvasHeight
        });
    };
    Renderer.prototype.onCharSizeChanged = function () {
        this.onResize(this._terminal.cols, this._terminal.rows);
    };
    Renderer.prototype.onBlur = function () {
        var _this = this;
        this._runOperation(function (l) { return l.onBlur(_this._terminal); });
    };
    Renderer.prototype.onFocus = function () {
        var _this = this;
        this._runOperation(function (l) { return l.onFocus(_this._terminal); });
    };
    Renderer.prototype.onSelectionChanged = function (start, end, columnSelectMode) {
        var _this = this;
        if (columnSelectMode === void 0) { columnSelectMode = false; }
        this._runOperation(function (l) { return l.onSelectionChanged(_this._terminal, start, end, columnSelectMode); });
    };
    Renderer.prototype.onCursorMove = function () {
        var _this = this;
        this._runOperation(function (l) { return l.onCursorMove(_this._terminal); });
    };
    Renderer.prototype.onOptionsChanged = function () {
        var _this = this;
        this.colorManager.allowTransparency = this._terminal.options.allowTransparency;
        this._runOperation(function (l) { return l.onOptionsChanged(_this._terminal); });
    };
    Renderer.prototype.clear = function () {
        var _this = this;
        this._runOperation(function (l) { return l.reset(_this._terminal); });
    };
    Renderer.prototype._runOperation = function (operation) {
        if (this._isPaused) {
            this._needsFullRefresh = true;
        }
        else {
            this._renderLayers.forEach(function (l) { return operation(l); });
        }
    };
    Renderer.prototype.refreshRows = function (start, end) {
        if (this._isPaused) {
            this._needsFullRefresh = true;
            return;
        }
        this._renderDebouncer.refresh(start, end);
    };
    Renderer.prototype._renderRows = function (start, end) {
        var _this = this;
        this._renderLayers.forEach(function (l) { return l.onGridChanged(_this._terminal, start, end); });
        this._terminal.emit('refresh', { start: start, end: end });
    };
    Renderer.prototype._updateDimensions = function () {
        if (!this._terminal.charMeasure.width || !this._terminal.charMeasure.height) {
            return;
        }
        this.dimensions.scaledCharWidth = Math.floor(this._terminal.charMeasure.width * window.devicePixelRatio);
        this.dimensions.scaledCharHeight = Math.ceil(this._terminal.charMeasure.height * window.devicePixelRatio);
        this.dimensions.scaledCellHeight = Math.floor(this.dimensions.scaledCharHeight * this._terminal.options.lineHeight);
        this.dimensions.scaledCharTop = this._terminal.options.lineHeight === 1 ? 0 : Math.round((this.dimensions.scaledCellHeight - this.dimensions.scaledCharHeight) / 2);
        this.dimensions.scaledCellWidth = this.dimensions.scaledCharWidth + Math.round(this._terminal.options.letterSpacing);
        this.dimensions.scaledCharLeft = Math.floor(this._terminal.options.letterSpacing / 2);
        this.dimensions.scaledCanvasHeight = this._terminal.rows * this.dimensions.scaledCellHeight;
        this.dimensions.scaledCanvasWidth = this._terminal.cols * this.dimensions.scaledCellWidth;
        this.dimensions.canvasHeight = Math.round(this.dimensions.scaledCanvasHeight / window.devicePixelRatio);
        this.dimensions.canvasWidth = Math.round(this.dimensions.scaledCanvasWidth / window.devicePixelRatio);
        this.dimensions.actualCellHeight = this.dimensions.canvasHeight / this._terminal.rows;
        this.dimensions.actualCellWidth = this.dimensions.canvasWidth / this._terminal.cols;
    };
    Renderer.prototype.registerCharacterJoiner = function (handler) {
        return this._characterJoinerRegistry.registerCharacterJoiner(handler);
    };
    Renderer.prototype.deregisterCharacterJoiner = function (joinerId) {
        return this._characterJoinerRegistry.deregisterCharacterJoiner(joinerId);
    };
    return Renderer;
}(EventEmitter_1.EventEmitter));
exports.Renderer = Renderer;
//# sourceMappingURL=Renderer.js.map