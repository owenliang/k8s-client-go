"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Terminal_1 = require("../Terminal");
var Strings = require("../Strings");
var Terminal = (function () {
    function Terminal(options) {
        this._core = new Terminal_1.Terminal(options);
    }
    Object.defineProperty(Terminal.prototype, "element", {
        get: function () { return this._core.element; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "textarea", {
        get: function () { return this._core.textarea; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "rows", {
        get: function () { return this._core.rows; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "cols", {
        get: function () { return this._core.cols; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Terminal.prototype, "markers", {
        get: function () { return this._core.markers; },
        enumerable: true,
        configurable: true
    });
    Terminal.prototype.blur = function () {
        this._core.blur();
    };
    Terminal.prototype.focus = function () {
        this._core.focus();
    };
    Terminal.prototype.on = function (type, listener) {
        this._core.on(type, listener);
    };
    Terminal.prototype.off = function (type, listener) {
        this._core.off(type, listener);
    };
    Terminal.prototype.emit = function (type, data) {
        this._core.emit(type, data);
    };
    Terminal.prototype.addDisposableListener = function (type, handler) {
        return this._core.addDisposableListener(type, handler);
    };
    Terminal.prototype.resize = function (columns, rows) {
        this._core.resize(columns, rows);
    };
    Terminal.prototype.writeln = function (data) {
        this._core.writeln(data);
    };
    Terminal.prototype.open = function (parent) {
        this._core.open(parent);
    };
    Terminal.prototype.attachCustomKeyEventHandler = function (customKeyEventHandler) {
        this._core.attachCustomKeyEventHandler(customKeyEventHandler);
    };
    Terminal.prototype.registerLinkMatcher = function (regex, handler, options) {
        return this._core.registerLinkMatcher(regex, handler, options);
    };
    Terminal.prototype.deregisterLinkMatcher = function (matcherId) {
        this._core.deregisterLinkMatcher(matcherId);
    };
    Terminal.prototype.registerCharacterJoiner = function (handler) {
        return this._core.registerCharacterJoiner(handler);
    };
    Terminal.prototype.deregisterCharacterJoiner = function (joinerId) {
        this._core.deregisterCharacterJoiner(joinerId);
    };
    Terminal.prototype.addMarker = function (cursorYOffset) {
        return this._core.addMarker(cursorYOffset);
    };
    Terminal.prototype.hasSelection = function () {
        return this._core.hasSelection();
    };
    Terminal.prototype.getSelection = function () {
        return this._core.getSelection();
    };
    Terminal.prototype.clearSelection = function () {
        this._core.clearSelection();
    };
    Terminal.prototype.selectAll = function () {
        this._core.selectAll();
    };
    Terminal.prototype.selectLines = function (start, end) {
        this._core.selectLines(start, end);
    };
    Terminal.prototype.dispose = function () {
        this._core.dispose();
    };
    Terminal.prototype.destroy = function () {
        this._core.destroy();
    };
    Terminal.prototype.scrollLines = function (amount) {
        this._core.scrollLines(amount);
    };
    Terminal.prototype.scrollPages = function (pageCount) {
        this._core.scrollPages(pageCount);
    };
    Terminal.prototype.scrollToTop = function () {
        this._core.scrollToTop();
    };
    Terminal.prototype.scrollToBottom = function () {
        this._core.scrollToBottom();
    };
    Terminal.prototype.scrollToLine = function (line) {
        this._core.scrollToLine(line);
    };
    Terminal.prototype.clear = function () {
        this._core.clear();
    };
    Terminal.prototype.write = function (data) {
        this._core.write(data);
    };
    Terminal.prototype.getOption = function (key) {
        return this._core.getOption(key);
    };
    Terminal.prototype.setOption = function (key, value) {
        this._core.setOption(key, value);
    };
    Terminal.prototype.refresh = function (start, end) {
        this._core.refresh(start, end);
    };
    Terminal.prototype.reset = function () {
        this._core.reset();
    };
    Terminal.applyAddon = function (addon) {
        addon.apply(Terminal);
    };
    Object.defineProperty(Terminal, "strings", {
        get: function () {
            return Strings;
        },
        enumerable: true,
        configurable: true
    });
    return Terminal;
}());
exports.Terminal = Terminal;
//# sourceMappingURL=Terminal.js.map