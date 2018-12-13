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
var EscapeSequences_1 = require("./common/data/EscapeSequences");
var Charsets_1 = require("./core/data/Charsets");
var Buffer_1 = require("./Buffer");
var CharWidth_1 = require("./CharWidth");
var EscapeSequenceParser_1 = require("./EscapeSequenceParser");
var Lifecycle_1 = require("./common/Lifecycle");
var GLEVEL = { '(': 0, ')': 1, '*': 2, '+': 3, '-': 1, '.': 2 };
var RequestTerminfo = (function () {
    function RequestTerminfo(_terminal) {
        this._terminal = _terminal;
    }
    RequestTerminfo.prototype.hook = function (collect, params, flag) {
        this._data = '';
    };
    RequestTerminfo.prototype.put = function (data, start, end) {
        this._data += data.substring(start, end);
    };
    RequestTerminfo.prototype.unhook = function () {
        this._terminal.handler(EscapeSequences_1.C0.ESC + "P0+r" + this._data + EscapeSequences_1.C0.ESC + "\\");
    };
    return RequestTerminfo;
}());
var DECRQSS = (function () {
    function DECRQSS(_terminal) {
        this._terminal = _terminal;
    }
    DECRQSS.prototype.hook = function (collect, params, flag) {
        this._data = '';
    };
    DECRQSS.prototype.put = function (data, start, end) {
        this._data += data.substring(start, end);
    };
    DECRQSS.prototype.unhook = function () {
        switch (this._data) {
            case '"q':
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r0\"q" + EscapeSequences_1.C0.ESC + "\\");
            case '"p':
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r61\"p" + EscapeSequences_1.C0.ESC + "\\");
            case 'r':
                var pt = '' + (this._terminal.buffer.scrollTop + 1) +
                    ';' + (this._terminal.buffer.scrollBottom + 1) + 'r';
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r" + pt + EscapeSequences_1.C0.ESC + "\\");
            case 'm':
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r0m" + EscapeSequences_1.C0.ESC + "\\");
            case ' q':
                var STYLES = { 'block': 2, 'underline': 4, 'bar': 6 };
                var style = STYLES[this._terminal.getOption('cursorStyle')];
                style -= this._terminal.getOption('cursorBlink');
                return this._terminal.handler(EscapeSequences_1.C0.ESC + "P1$r" + style + " q" + EscapeSequences_1.C0.ESC + "\\");
            default:
                this._terminal.error('Unknown DCS $q %s', this._data);
                this._terminal.handler(EscapeSequences_1.C0.ESC + "P0$r" + this._data + EscapeSequences_1.C0.ESC + "\\");
        }
    };
    return DECRQSS;
}());
var InputHandler = (function (_super) {
    __extends(InputHandler, _super);
    function InputHandler(_terminal, _parser) {
        if (_parser === void 0) { _parser = new EscapeSequenceParser_1.EscapeSequenceParser(); }
        var _this = _super.call(this) || this;
        _this._terminal = _terminal;
        _this._parser = _parser;
        _this.register(_this._parser);
        _this._surrogateFirst = '';
        _this._parser.setCsiHandlerFallback(function (collect, params, flag) {
            _this._terminal.error('Unknown CSI code: ', { collect: collect, params: params, flag: String.fromCharCode(flag) });
        });
        _this._parser.setEscHandlerFallback(function (collect, flag) {
            _this._terminal.error('Unknown ESC code: ', { collect: collect, flag: String.fromCharCode(flag) });
        });
        _this._parser.setExecuteHandlerFallback(function (code) {
            _this._terminal.error('Unknown EXECUTE code: ', { code: code });
        });
        _this._parser.setOscHandlerFallback(function (identifier, data) {
            _this._terminal.error('Unknown OSC code: ', { identifier: identifier, data: data });
        });
        _this._parser.setPrintHandler(function (data, start, end) { return _this.print(data, start, end); });
        _this._parser.setCsiHandler('@', function (params, collect) { return _this.insertChars(params); });
        _this._parser.setCsiHandler('A', function (params, collect) { return _this.cursorUp(params); });
        _this._parser.setCsiHandler('B', function (params, collect) { return _this.cursorDown(params); });
        _this._parser.setCsiHandler('C', function (params, collect) { return _this.cursorForward(params); });
        _this._parser.setCsiHandler('D', function (params, collect) { return _this.cursorBackward(params); });
        _this._parser.setCsiHandler('E', function (params, collect) { return _this.cursorNextLine(params); });
        _this._parser.setCsiHandler('F', function (params, collect) { return _this.cursorPrecedingLine(params); });
        _this._parser.setCsiHandler('G', function (params, collect) { return _this.cursorCharAbsolute(params); });
        _this._parser.setCsiHandler('H', function (params, collect) { return _this.cursorPosition(params); });
        _this._parser.setCsiHandler('I', function (params, collect) { return _this.cursorForwardTab(params); });
        _this._parser.setCsiHandler('J', function (params, collect) { return _this.eraseInDisplay(params); });
        _this._parser.setCsiHandler('K', function (params, collect) { return _this.eraseInLine(params); });
        _this._parser.setCsiHandler('L', function (params, collect) { return _this.insertLines(params); });
        _this._parser.setCsiHandler('M', function (params, collect) { return _this.deleteLines(params); });
        _this._parser.setCsiHandler('P', function (params, collect) { return _this.deleteChars(params); });
        _this._parser.setCsiHandler('S', function (params, collect) { return _this.scrollUp(params); });
        _this._parser.setCsiHandler('T', function (params, collect) { return _this.scrollDown(params, collect); });
        _this._parser.setCsiHandler('X', function (params, collect) { return _this.eraseChars(params); });
        _this._parser.setCsiHandler('Z', function (params, collect) { return _this.cursorBackwardTab(params); });
        _this._parser.setCsiHandler('`', function (params, collect) { return _this.charPosAbsolute(params); });
        _this._parser.setCsiHandler('a', function (params, collect) { return _this.hPositionRelative(params); });
        _this._parser.setCsiHandler('b', function (params, collect) { return _this.repeatPrecedingCharacter(params); });
        _this._parser.setCsiHandler('c', function (params, collect) { return _this.sendDeviceAttributes(params, collect); });
        _this._parser.setCsiHandler('d', function (params, collect) { return _this.linePosAbsolute(params); });
        _this._parser.setCsiHandler('e', function (params, collect) { return _this.vPositionRelative(params); });
        _this._parser.setCsiHandler('f', function (params, collect) { return _this.hVPosition(params); });
        _this._parser.setCsiHandler('g', function (params, collect) { return _this.tabClear(params); });
        _this._parser.setCsiHandler('h', function (params, collect) { return _this.setMode(params, collect); });
        _this._parser.setCsiHandler('l', function (params, collect) { return _this.resetMode(params, collect); });
        _this._parser.setCsiHandler('m', function (params, collect) { return _this.charAttributes(params); });
        _this._parser.setCsiHandler('n', function (params, collect) { return _this.deviceStatus(params, collect); });
        _this._parser.setCsiHandler('p', function (params, collect) { return _this.softReset(params, collect); });
        _this._parser.setCsiHandler('q', function (params, collect) { return _this.setCursorStyle(params, collect); });
        _this._parser.setCsiHandler('r', function (params, collect) { return _this.setScrollRegion(params, collect); });
        _this._parser.setCsiHandler('s', function (params, collect) { return _this.saveCursor(params); });
        _this._parser.setCsiHandler('u', function (params, collect) { return _this.restoreCursor(params); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.BEL, function () { return _this.bell(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.LF, function () { return _this.lineFeed(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.VT, function () { return _this.lineFeed(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.FF, function () { return _this.lineFeed(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.CR, function () { return _this.carriageReturn(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.BS, function () { return _this.backspace(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.HT, function () { return _this.tab(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.SO, function () { return _this.shiftOut(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C0.SI, function () { return _this.shiftIn(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C1.IND, function () { return _this.index(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C1.NEL, function () { return _this.nextLine(); });
        _this._parser.setExecuteHandler(EscapeSequences_1.C1.HTS, function () { return _this.tabSet(); });
        _this._parser.setOscHandler(0, function (data) { return _this.setTitle(data); });
        _this._parser.setOscHandler(2, function (data) { return _this.setTitle(data); });
        _this._parser.setEscHandler('7', function () { return _this.saveCursor([]); });
        _this._parser.setEscHandler('8', function () { return _this.restoreCursor([]); });
        _this._parser.setEscHandler('D', function () { return _this.index(); });
        _this._parser.setEscHandler('E', function () { return _this.nextLine(); });
        _this._parser.setEscHandler('H', function () { return _this.tabSet(); });
        _this._parser.setEscHandler('M', function () { return _this.reverseIndex(); });
        _this._parser.setEscHandler('=', function () { return _this.keypadApplicationMode(); });
        _this._parser.setEscHandler('>', function () { return _this.keypadNumericMode(); });
        _this._parser.setEscHandler('c', function () { return _this.reset(); });
        _this._parser.setEscHandler('n', function () { return _this.setgLevel(2); });
        _this._parser.setEscHandler('o', function () { return _this.setgLevel(3); });
        _this._parser.setEscHandler('|', function () { return _this.setgLevel(3); });
        _this._parser.setEscHandler('}', function () { return _this.setgLevel(2); });
        _this._parser.setEscHandler('~', function () { return _this.setgLevel(1); });
        _this._parser.setEscHandler('%@', function () { return _this.selectDefaultCharset(); });
        _this._parser.setEscHandler('%G', function () { return _this.selectDefaultCharset(); });
        var _loop_1 = function (flag) {
            this_1._parser.setEscHandler('(' + flag, function () { return _this.selectCharset('(' + flag); });
            this_1._parser.setEscHandler(')' + flag, function () { return _this.selectCharset(')' + flag); });
            this_1._parser.setEscHandler('*' + flag, function () { return _this.selectCharset('*' + flag); });
            this_1._parser.setEscHandler('+' + flag, function () { return _this.selectCharset('+' + flag); });
            this_1._parser.setEscHandler('-' + flag, function () { return _this.selectCharset('-' + flag); });
            this_1._parser.setEscHandler('.' + flag, function () { return _this.selectCharset('.' + flag); });
            this_1._parser.setEscHandler('/' + flag, function () { return _this.selectCharset('/' + flag); });
        };
        var this_1 = this;
        for (var flag in Charsets_1.CHARSETS) {
            _loop_1(flag);
        }
        _this._parser.setErrorHandler(function (state) {
            _this._terminal.error('Parsing error: ', state);
            return state;
        });
        _this._parser.setDcsHandler('$q', new DECRQSS(_this._terminal));
        _this._parser.setDcsHandler('+q', new RequestTerminfo(_this._terminal));
        return _this;
    }
    InputHandler.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._terminal = null;
    };
    InputHandler.prototype.parse = function (data) {
        if (!this._terminal) {
            return;
        }
        var buffer = this._terminal.buffer;
        var cursorStartX = buffer.x;
        var cursorStartY = buffer.y;
        if (this._terminal.debug) {
            this._terminal.log('data: ' + data);
        }
        if (this._surrogateFirst) {
            data = this._surrogateFirst + data;
            this._surrogateFirst = '';
        }
        this._parser.parse(data);
        buffer = this._terminal.buffer;
        if (buffer.x !== cursorStartX || buffer.y !== cursorStartY) {
            this._terminal.emit('cursormove');
        }
    };
    InputHandler.prototype.print = function (data, start, end) {
        var char;
        var code;
        var chWidth;
        var buffer = this._terminal.buffer;
        var charset = this._terminal.charset;
        var screenReaderMode = this._terminal.options.screenReaderMode;
        var cols = this._terminal.cols;
        var wraparoundMode = this._terminal.wraparoundMode;
        var insertMode = this._terminal.insertMode;
        var curAttr = this._terminal.curAttr;
        var bufferRow = buffer.lines.get(buffer.y + buffer.ybase);
        this._terminal.updateRange(buffer.y);
        for (var stringPosition = start; stringPosition < end; ++stringPosition) {
            char = data.charAt(stringPosition);
            code = data.charCodeAt(stringPosition);
            if (0xD800 <= code && code <= 0xDBFF) {
                if (++stringPosition >= end) {
                    this._surrogateFirst = char;
                    continue;
                }
                var second = data.charCodeAt(stringPosition);
                if (0xDC00 <= second && second <= 0xDFFF) {
                    code = (code - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
                    char += data.charAt(stringPosition);
                }
                else {
                    stringPosition--;
                }
            }
            chWidth = CharWidth_1.wcwidth(code);
            if (charset) {
                char = charset[char] || char;
                code = char.charCodeAt(0);
            }
            if (screenReaderMode) {
                this._terminal.emit('a11y.char', char);
            }
            if (!chWidth && buffer.x) {
                var chMinusOne = bufferRow.get(buffer.x - 1);
                if (chMinusOne) {
                    if (!chMinusOne[Buffer_1.CHAR_DATA_WIDTH_INDEX]) {
                        var chMinusTwo = bufferRow.get(buffer.x - 2);
                        if (chMinusTwo) {
                            chMinusTwo[Buffer_1.CHAR_DATA_CHAR_INDEX] += char;
                            chMinusTwo[Buffer_1.CHAR_DATA_CODE_INDEX] = code;
                            bufferRow.set(buffer.x - 2, chMinusTwo);
                        }
                    }
                    else {
                        chMinusOne[Buffer_1.CHAR_DATA_CHAR_INDEX] += char;
                        chMinusOne[Buffer_1.CHAR_DATA_CODE_INDEX] = code;
                        bufferRow.set(buffer.x - 1, chMinusOne);
                    }
                }
                continue;
            }
            if (buffer.x + chWidth - 1 >= cols) {
                if (wraparoundMode) {
                    buffer.x = 0;
                    buffer.y++;
                    if (buffer.y > buffer.scrollBottom) {
                        buffer.y--;
                        this._terminal.scroll(true);
                    }
                    else {
                        buffer.lines.get(buffer.y).isWrapped = true;
                    }
                    bufferRow = buffer.lines.get(buffer.y + buffer.ybase);
                }
                else {
                    if (chWidth === 2) {
                        continue;
                    }
                }
            }
            if (insertMode) {
                bufferRow.insertCells(buffer.x, chWidth, [curAttr, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
                var lastCell = bufferRow.get(cols - 1);
                if (lastCell[Buffer_1.CHAR_DATA_WIDTH_INDEX] === 2) {
                    bufferRow.set(cols - 1, [curAttr, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
                }
            }
            bufferRow.set(buffer.x++, [curAttr, char, chWidth, code]);
            if (chWidth > 0) {
                while (--chWidth) {
                    bufferRow.set(buffer.x++, [curAttr, '', 0, undefined]);
                }
            }
        }
        this._terminal.updateRange(buffer.y);
    };
    InputHandler.prototype.bell = function () {
        this._terminal.bell();
    };
    InputHandler.prototype.lineFeed = function () {
        var buffer = this._terminal.buffer;
        if (this._terminal.options.convertEol) {
            buffer.x = 0;
        }
        buffer.y++;
        if (buffer.y > buffer.scrollBottom) {
            buffer.y--;
            this._terminal.scroll();
        }
        if (buffer.x >= this._terminal.cols) {
            buffer.x--;
        }
        this._terminal.emit('linefeed');
    };
    InputHandler.prototype.carriageReturn = function () {
        this._terminal.buffer.x = 0;
    };
    InputHandler.prototype.backspace = function () {
        if (this._terminal.buffer.x > 0) {
            this._terminal.buffer.x--;
        }
    };
    InputHandler.prototype.tab = function () {
        var originalX = this._terminal.buffer.x;
        this._terminal.buffer.x = this._terminal.buffer.nextStop();
        if (this._terminal.options.screenReaderMode) {
            this._terminal.emit('a11y.tab', this._terminal.buffer.x - originalX);
        }
    };
    InputHandler.prototype.shiftOut = function () {
        this._terminal.setgLevel(1);
    };
    InputHandler.prototype.shiftIn = function () {
        this._terminal.setgLevel(0);
    };
    InputHandler.prototype.insertChars = function (params) {
        this._terminal.buffer.lines.get(this._terminal.buffer.y + this._terminal.buffer.ybase).insertCells(this._terminal.buffer.x, params[0] || 1, [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
        this._terminal.updateRange(this._terminal.buffer.y);
    };
    InputHandler.prototype.cursorUp = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y -= param;
        if (this._terminal.buffer.y < 0) {
            this._terminal.buffer.y = 0;
        }
    };
    InputHandler.prototype.cursorDown = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y += param;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x--;
        }
    };
    InputHandler.prototype.cursorForward = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x += param;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.cursorBackward = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x--;
        }
        this._terminal.buffer.x -= param;
        if (this._terminal.buffer.x < 0) {
            this._terminal.buffer.x = 0;
        }
    };
    InputHandler.prototype.cursorNextLine = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y += param;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        this._terminal.buffer.x = 0;
    };
    InputHandler.prototype.cursorPrecedingLine = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y -= param;
        if (this._terminal.buffer.y < 0) {
            this._terminal.buffer.y = 0;
        }
        this._terminal.buffer.x = 0;
    };
    InputHandler.prototype.cursorCharAbsolute = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x = param - 1;
    };
    InputHandler.prototype.cursorPosition = function (params) {
        var col;
        var row = params[0] - 1;
        if (params.length >= 2) {
            col = params[1] - 1;
        }
        else {
            col = 0;
        }
        if (row < 0) {
            row = 0;
        }
        else if (row >= this._terminal.rows) {
            row = this._terminal.rows - 1;
        }
        if (col < 0) {
            col = 0;
        }
        else if (col >= this._terminal.cols) {
            col = this._terminal.cols - 1;
        }
        this._terminal.buffer.x = col;
        this._terminal.buffer.y = row;
    };
    InputHandler.prototype.cursorForwardTab = function (params) {
        var param = params[0] || 1;
        while (param--) {
            this._terminal.buffer.x = this._terminal.buffer.nextStop();
        }
    };
    InputHandler.prototype._eraseInBufferLine = function (y, start, end, clearWrap) {
        if (clearWrap === void 0) { clearWrap = false; }
        var line = this._terminal.buffer.lines.get(this._terminal.buffer.ybase + y);
        line.replaceCells(start, end, [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
        if (clearWrap) {
            line.isWrapped = false;
        }
    };
    InputHandler.prototype._resetBufferLine = function (y) {
        this._eraseInBufferLine(y, 0, this._terminal.cols, true);
    };
    InputHandler.prototype.eraseInDisplay = function (params) {
        var j;
        switch (params[0]) {
            case 0:
                j = this._terminal.buffer.y;
                this._terminal.updateRange(j);
                this._eraseInBufferLine(j++, this._terminal.buffer.x, this._terminal.cols, this._terminal.buffer.x === 0);
                for (; j < this._terminal.rows; j++) {
                    this._resetBufferLine(j);
                }
                this._terminal.updateRange(j);
                break;
            case 1:
                j = this._terminal.buffer.y;
                this._terminal.updateRange(j);
                this._eraseInBufferLine(j, 0, this._terminal.buffer.x + 1, true);
                if (this._terminal.buffer.x + 1 >= this._terminal.cols) {
                    this._terminal.buffer.lines.get(j + 1).isWrapped = false;
                }
                while (j--) {
                    this._resetBufferLine(j);
                }
                this._terminal.updateRange(0);
                break;
            case 2:
                j = this._terminal.rows;
                this._terminal.updateRange(j - 1);
                while (j--) {
                    this._resetBufferLine(j);
                }
                this._terminal.updateRange(0);
                break;
            case 3:
                var scrollBackSize = this._terminal.buffer.lines.length - this._terminal.rows;
                if (scrollBackSize > 0) {
                    this._terminal.buffer.lines.trimStart(scrollBackSize);
                    this._terminal.buffer.ybase = Math.max(this._terminal.buffer.ybase - scrollBackSize, 0);
                    this._terminal.buffer.ydisp = Math.max(this._terminal.buffer.ydisp - scrollBackSize, 0);
                    this._terminal.emit('scroll', 0);
                }
                break;
        }
    };
    InputHandler.prototype.eraseInLine = function (params) {
        switch (params[0]) {
            case 0:
                this._eraseInBufferLine(this._terminal.buffer.y, this._terminal.buffer.x, this._terminal.cols);
                break;
            case 1:
                this._eraseInBufferLine(this._terminal.buffer.y, 0, this._terminal.buffer.x + 1);
                break;
            case 2:
                this._eraseInBufferLine(this._terminal.buffer.y, 0, this._terminal.cols);
                break;
        }
        this._terminal.updateRange(this._terminal.buffer.y);
    };
    InputHandler.prototype.insertLines = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        var buffer = this._terminal.buffer;
        var row = buffer.y + buffer.ybase;
        var scrollBottomRowsOffset = this._terminal.rows - 1 - buffer.scrollBottom;
        var scrollBottomAbsolute = this._terminal.rows - 1 + buffer.ybase - scrollBottomRowsOffset + 1;
        while (param--) {
            buffer.lines.splice(scrollBottomAbsolute - 1, 1);
            buffer.lines.splice(row, 0, buffer.getBlankLine(this._terminal.eraseAttr()));
        }
        this._terminal.updateRange(buffer.y);
        this._terminal.updateRange(buffer.scrollBottom);
    };
    InputHandler.prototype.deleteLines = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        var buffer = this._terminal.buffer;
        var row = buffer.y + buffer.ybase;
        var j;
        j = this._terminal.rows - 1 - buffer.scrollBottom;
        j = this._terminal.rows - 1 + buffer.ybase - j;
        while (param--) {
            buffer.lines.splice(row, 1);
            buffer.lines.splice(j, 0, buffer.getBlankLine(this._terminal.eraseAttr()));
        }
        this._terminal.updateRange(buffer.y);
        this._terminal.updateRange(buffer.scrollBottom);
    };
    InputHandler.prototype.deleteChars = function (params) {
        this._terminal.buffer.lines.get(this._terminal.buffer.y + this._terminal.buffer.ybase).deleteCells(this._terminal.buffer.x, params[0] || 1, [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
        this._terminal.updateRange(this._terminal.buffer.y);
    };
    InputHandler.prototype.scrollUp = function (params) {
        var param = params[0] || 1;
        var buffer = this._terminal.buffer;
        while (param--) {
            buffer.lines.splice(buffer.ybase + buffer.scrollTop, 1);
            buffer.lines.splice(buffer.ybase + buffer.scrollBottom, 0, buffer.getBlankLine(Buffer_1.DEFAULT_ATTR));
        }
        this._terminal.updateRange(buffer.scrollTop);
        this._terminal.updateRange(buffer.scrollBottom);
    };
    InputHandler.prototype.scrollDown = function (params, collect) {
        if (params.length < 2 && !collect) {
            var param = params[0] || 1;
            var buffer = this._terminal.buffer;
            while (param--) {
                buffer.lines.splice(buffer.ybase + buffer.scrollBottom, 1);
                buffer.lines.splice(buffer.ybase + buffer.scrollBottom, 0, buffer.getBlankLine(Buffer_1.DEFAULT_ATTR));
            }
            this._terminal.updateRange(buffer.scrollTop);
            this._terminal.updateRange(buffer.scrollBottom);
        }
    };
    InputHandler.prototype.eraseChars = function (params) {
        this._terminal.buffer.lines.get(this._terminal.buffer.y + this._terminal.buffer.ybase).replaceCells(this._terminal.buffer.x, this._terminal.buffer.x + (params[0] || 1), [this._terminal.eraseAttr(), Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
    };
    InputHandler.prototype.cursorBackwardTab = function (params) {
        var param = params[0] || 1;
        var buffer = this._terminal.buffer;
        while (param--) {
            buffer.x = buffer.prevStop();
        }
    };
    InputHandler.prototype.charPosAbsolute = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x = param - 1;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.hPositionRelative = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.x += param;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.repeatPrecedingCharacter = function (params) {
        var buffer = this._terminal.buffer;
        var line = buffer.lines.get(buffer.ybase + buffer.y);
        line.replaceCells(buffer.x, buffer.x + (params[0] || 1), line.get(buffer.x - 1) || [Buffer_1.DEFAULT_ATTR, Buffer_1.NULL_CELL_CHAR, Buffer_1.NULL_CELL_WIDTH, Buffer_1.NULL_CELL_CODE]);
    };
    InputHandler.prototype.sendDeviceAttributes = function (params, collect) {
        if (params[0] > 0) {
            return;
        }
        if (!collect) {
            if (this._terminal.is('xterm') || this._terminal.is('rxvt-unicode') || this._terminal.is('screen')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[?1;2c');
            }
            else if (this._terminal.is('linux')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[?6c');
            }
        }
        else if (collect === '>') {
            if (this._terminal.is('xterm')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[>0;276;0c');
            }
            else if (this._terminal.is('rxvt-unicode')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[>85;95;0c');
            }
            else if (this._terminal.is('linux')) {
                this._terminal.handler(params[0] + 'c');
            }
            else if (this._terminal.is('screen')) {
                this._terminal.handler(EscapeSequences_1.C0.ESC + '[>83;40003;0c');
            }
        }
    };
    InputHandler.prototype.linePosAbsolute = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y = param - 1;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
    };
    InputHandler.prototype.vPositionRelative = function (params) {
        var param = params[0];
        if (param < 1) {
            param = 1;
        }
        this._terminal.buffer.y += param;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x--;
        }
    };
    InputHandler.prototype.hVPosition = function (params) {
        if (params[0] < 1)
            params[0] = 1;
        if (params[1] < 1)
            params[1] = 1;
        this._terminal.buffer.y = params[0] - 1;
        if (this._terminal.buffer.y >= this._terminal.rows) {
            this._terminal.buffer.y = this._terminal.rows - 1;
        }
        this._terminal.buffer.x = params[1] - 1;
        if (this._terminal.buffer.x >= this._terminal.cols) {
            this._terminal.buffer.x = this._terminal.cols - 1;
        }
    };
    InputHandler.prototype.tabClear = function (params) {
        var param = params[0];
        if (param <= 0) {
            delete this._terminal.buffer.tabs[this._terminal.buffer.x];
        }
        else if (param === 3) {
            this._terminal.buffer.tabs = {};
        }
    };
    InputHandler.prototype.setMode = function (params, collect) {
        if (params.length > 1) {
            for (var i = 0; i < params.length; i++) {
                this.setMode([params[i]]);
            }
            return;
        }
        if (!collect) {
            switch (params[0]) {
                case 4:
                    this._terminal.insertMode = true;
                    break;
                case 20:
                    break;
            }
        }
        else if (collect === '?') {
            switch (params[0]) {
                case 1:
                    this._terminal.applicationCursor = true;
                    break;
                case 2:
                    this._terminal.setgCharset(0, Charsets_1.DEFAULT_CHARSET);
                    this._terminal.setgCharset(1, Charsets_1.DEFAULT_CHARSET);
                    this._terminal.setgCharset(2, Charsets_1.DEFAULT_CHARSET);
                    this._terminal.setgCharset(3, Charsets_1.DEFAULT_CHARSET);
                    break;
                case 3:
                    this._terminal.savedCols = this._terminal.cols;
                    this._terminal.resize(132, this._terminal.rows);
                    break;
                case 6:
                    this._terminal.originMode = true;
                    break;
                case 7:
                    this._terminal.wraparoundMode = true;
                    break;
                case 12:
                    break;
                case 66:
                    this._terminal.log('Serial port requested application keypad.');
                    this._terminal.applicationKeypad = true;
                    if (this._terminal.viewport) {
                        this._terminal.viewport.syncScrollArea();
                    }
                    break;
                case 9:
                case 1000:
                case 1002:
                case 1003:
                    this._terminal.x10Mouse = params[0] === 9;
                    this._terminal.vt200Mouse = params[0] === 1000;
                    this._terminal.normalMouse = params[0] > 1000;
                    this._terminal.mouseEvents = true;
                    this._terminal.element.classList.add('enable-mouse-events');
                    this._terminal.selectionManager.disable();
                    this._terminal.log('Binding to mouse events.');
                    break;
                case 1004:
                    this._terminal.sendFocus = true;
                    break;
                case 1005:
                    this._terminal.utfMouse = true;
                    break;
                case 1006:
                    this._terminal.sgrMouse = true;
                    break;
                case 1015:
                    this._terminal.urxvtMouse = true;
                    break;
                case 25:
                    this._terminal.cursorHidden = false;
                    break;
                case 1048:
                    this.saveCursor(params);
                    break;
                case 1049:
                    this.saveCursor(params);
                case 47:
                case 1047:
                    this._terminal.buffers.activateAltBuffer(this._terminal.eraseAttr());
                    this._terminal.refresh(0, this._terminal.rows - 1);
                    if (this._terminal.viewport) {
                        this._terminal.viewport.syncScrollArea();
                    }
                    this._terminal.showCursor();
                    break;
                case 2004:
                    this._terminal.bracketedPasteMode = true;
                    break;
            }
        }
    };
    InputHandler.prototype.resetMode = function (params, collect) {
        if (params.length > 1) {
            for (var i = 0; i < params.length; i++) {
                this.resetMode([params[i]]);
            }
            return;
        }
        if (!collect) {
            switch (params[0]) {
                case 4:
                    this._terminal.insertMode = false;
                    break;
                case 20:
                    break;
            }
        }
        else if (collect === '?') {
            switch (params[0]) {
                case 1:
                    this._terminal.applicationCursor = false;
                    break;
                case 3:
                    if (this._terminal.cols === 132 && this._terminal.savedCols) {
                        this._terminal.resize(this._terminal.savedCols, this._terminal.rows);
                    }
                    delete this._terminal.savedCols;
                    break;
                case 6:
                    this._terminal.originMode = false;
                    break;
                case 7:
                    this._terminal.wraparoundMode = false;
                    break;
                case 12:
                    break;
                case 66:
                    this._terminal.log('Switching back to normal keypad.');
                    this._terminal.applicationKeypad = false;
                    if (this._terminal.viewport) {
                        this._terminal.viewport.syncScrollArea();
                    }
                    break;
                case 9:
                case 1000:
                case 1002:
                case 1003:
                    this._terminal.x10Mouse = false;
                    this._terminal.vt200Mouse = false;
                    this._terminal.normalMouse = false;
                    this._terminal.mouseEvents = false;
                    this._terminal.element.classList.remove('enable-mouse-events');
                    this._terminal.selectionManager.enable();
                    break;
                case 1004:
                    this._terminal.sendFocus = false;
                    break;
                case 1005:
                    this._terminal.utfMouse = false;
                    break;
                case 1006:
                    this._terminal.sgrMouse = false;
                    break;
                case 1015:
                    this._terminal.urxvtMouse = false;
                    break;
                case 25:
                    this._terminal.cursorHidden = true;
                    break;
                case 1048:
                    this.restoreCursor(params);
                    break;
                case 1049:
                case 47:
                case 1047:
                    this._terminal.buffers.activateNormalBuffer();
                    if (params[0] === 1049) {
                        this.restoreCursor(params);
                    }
                    this._terminal.refresh(0, this._terminal.rows - 1);
                    if (this._terminal.viewport) {
                        this._terminal.viewport.syncScrollArea();
                    }
                    this._terminal.showCursor();
                    break;
                case 2004:
                    this._terminal.bracketedPasteMode = false;
                    break;
            }
        }
    };
    InputHandler.prototype.charAttributes = function (params) {
        if (params.length === 1 && params[0] === 0) {
            this._terminal.curAttr = Buffer_1.DEFAULT_ATTR;
            return;
        }
        var l = params.length;
        var flags = this._terminal.curAttr >> 18;
        var fg = (this._terminal.curAttr >> 9) & 0x1ff;
        var bg = this._terminal.curAttr & 0x1ff;
        var p;
        for (var i = 0; i < l; i++) {
            p = params[i];
            if (p >= 30 && p <= 37) {
                fg = p - 30;
            }
            else if (p >= 40 && p <= 47) {
                bg = p - 40;
            }
            else if (p >= 90 && p <= 97) {
                p += 8;
                fg = p - 90;
            }
            else if (p >= 100 && p <= 107) {
                p += 8;
                bg = p - 100;
            }
            else if (p === 0) {
                flags = Buffer_1.DEFAULT_ATTR >> 18;
                fg = (Buffer_1.DEFAULT_ATTR >> 9) & 0x1ff;
                bg = Buffer_1.DEFAULT_ATTR & 0x1ff;
            }
            else if (p === 1) {
                flags |= 1;
            }
            else if (p === 3) {
                flags |= 64;
            }
            else if (p === 4) {
                flags |= 2;
            }
            else if (p === 5) {
                flags |= 4;
            }
            else if (p === 7) {
                flags |= 8;
            }
            else if (p === 8) {
                flags |= 16;
            }
            else if (p === 2) {
                flags |= 32;
            }
            else if (p === 22) {
                flags &= ~1;
                flags &= ~32;
            }
            else if (p === 23) {
                flags &= ~64;
            }
            else if (p === 24) {
                flags &= ~2;
            }
            else if (p === 25) {
                flags &= ~4;
            }
            else if (p === 27) {
                flags &= ~8;
            }
            else if (p === 28) {
                flags &= ~16;
            }
            else if (p === 39) {
                fg = (Buffer_1.DEFAULT_ATTR >> 9) & 0x1ff;
            }
            else if (p === 49) {
                bg = Buffer_1.DEFAULT_ATTR & 0x1ff;
            }
            else if (p === 38) {
                if (params[i + 1] === 2) {
                    i += 2;
                    fg = this._terminal.matchColor(params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff);
                    if (fg === -1)
                        fg = 0x1ff;
                    i += 2;
                }
                else if (params[i + 1] === 5) {
                    i += 2;
                    p = params[i] & 0xff;
                    fg = p;
                }
            }
            else if (p === 48) {
                if (params[i + 1] === 2) {
                    i += 2;
                    bg = this._terminal.matchColor(params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff);
                    if (bg === -1)
                        bg = 0x1ff;
                    i += 2;
                }
                else if (params[i + 1] === 5) {
                    i += 2;
                    p = params[i] & 0xff;
                    bg = p;
                }
            }
            else if (p === 100) {
                fg = (Buffer_1.DEFAULT_ATTR >> 9) & 0x1ff;
                bg = Buffer_1.DEFAULT_ATTR & 0x1ff;
            }
            else {
                this._terminal.error('Unknown SGR attribute: %d.', p);
            }
        }
        this._terminal.curAttr = (flags << 18) | (fg << 9) | bg;
    };
    InputHandler.prototype.deviceStatus = function (params, collect) {
        if (!collect) {
            switch (params[0]) {
                case 5:
                    this._terminal.emit('data', EscapeSequences_1.C0.ESC + "[0n");
                    break;
                case 6:
                    var y = this._terminal.buffer.y + 1;
                    var x = this._terminal.buffer.x + 1;
                    this._terminal.emit('data', EscapeSequences_1.C0.ESC + "[" + y + ";" + x + "R");
                    break;
            }
        }
        else if (collect === '?') {
            switch (params[0]) {
                case 6:
                    var y = this._terminal.buffer.y + 1;
                    var x = this._terminal.buffer.x + 1;
                    this._terminal.emit('data', EscapeSequences_1.C0.ESC + "[?" + y + ";" + x + "R");
                    break;
                case 15:
                    break;
                case 25:
                    break;
                case 26:
                    break;
                case 53:
                    break;
            }
        }
    };
    InputHandler.prototype.softReset = function (params, collect) {
        if (collect === '!') {
            this._terminal.cursorHidden = false;
            this._terminal.insertMode = false;
            this._terminal.originMode = false;
            this._terminal.wraparoundMode = true;
            this._terminal.applicationKeypad = false;
            if (this._terminal.viewport) {
                this._terminal.viewport.syncScrollArea();
            }
            this._terminal.applicationCursor = false;
            this._terminal.buffer.scrollTop = 0;
            this._terminal.buffer.scrollBottom = this._terminal.rows - 1;
            this._terminal.curAttr = Buffer_1.DEFAULT_ATTR;
            this._terminal.buffer.x = this._terminal.buffer.y = 0;
            this._terminal.charset = null;
            this._terminal.glevel = 0;
            this._terminal.charsets = [null];
        }
    };
    InputHandler.prototype.setCursorStyle = function (params, collect) {
        if (collect === ' ') {
            var param = params[0] < 1 ? 1 : params[0];
            switch (param) {
                case 1:
                case 2:
                    this._terminal.setOption('cursorStyle', 'block');
                    break;
                case 3:
                case 4:
                    this._terminal.setOption('cursorStyle', 'underline');
                    break;
                case 5:
                case 6:
                    this._terminal.setOption('cursorStyle', 'bar');
                    break;
            }
            var isBlinking = param % 2 === 1;
            this._terminal.setOption('cursorBlink', isBlinking);
        }
    };
    InputHandler.prototype.setScrollRegion = function (params, collect) {
        if (collect)
            return;
        this._terminal.buffer.scrollTop = (params[0] || 1) - 1;
        this._terminal.buffer.scrollBottom = (params[1] && params[1] <= this._terminal.rows ? params[1] : this._terminal.rows) - 1;
        this._terminal.buffer.x = 0;
        this._terminal.buffer.y = 0;
    };
    InputHandler.prototype.saveCursor = function (params) {
        this._terminal.buffer.savedX = this._terminal.buffer.x;
        this._terminal.buffer.savedY = this._terminal.buffer.y;
        this._terminal.buffer.savedCurAttr = this._terminal.curAttr;
    };
    InputHandler.prototype.restoreCursor = function (params) {
        this._terminal.buffer.x = this._terminal.buffer.savedX || 0;
        this._terminal.buffer.y = this._terminal.buffer.savedY || 0;
        this._terminal.curAttr = this._terminal.buffer.savedCurAttr || Buffer_1.DEFAULT_ATTR;
    };
    InputHandler.prototype.setTitle = function (data) {
        this._terminal.handleTitle(data);
    };
    InputHandler.prototype.nextLine = function () {
        this._terminal.buffer.x = 0;
        this.index();
    };
    InputHandler.prototype.keypadApplicationMode = function () {
        this._terminal.log('Serial port requested application keypad.');
        this._terminal.applicationKeypad = true;
        if (this._terminal.viewport) {
            this._terminal.viewport.syncScrollArea();
        }
    };
    InputHandler.prototype.keypadNumericMode = function () {
        this._terminal.log('Switching back to normal keypad.');
        this._terminal.applicationKeypad = false;
        if (this._terminal.viewport) {
            this._terminal.viewport.syncScrollArea();
        }
    };
    InputHandler.prototype.selectDefaultCharset = function () {
        this._terminal.setgLevel(0);
        this._terminal.setgCharset(0, Charsets_1.DEFAULT_CHARSET);
    };
    InputHandler.prototype.selectCharset = function (collectAndFlag) {
        if (collectAndFlag.length !== 2)
            return this.selectDefaultCharset();
        if (collectAndFlag[0] === '/')
            return;
        this._terminal.setgCharset(GLEVEL[collectAndFlag[0]], Charsets_1.CHARSETS[collectAndFlag[1]] || Charsets_1.DEFAULT_CHARSET);
    };
    InputHandler.prototype.index = function () {
        this._terminal.index();
    };
    InputHandler.prototype.tabSet = function () {
        this._terminal.tabSet();
    };
    InputHandler.prototype.reverseIndex = function () {
        this._terminal.reverseIndex();
    };
    InputHandler.prototype.reset = function () {
        this._parser.reset();
        this._terminal.reset();
    };
    InputHandler.prototype.setgLevel = function (level) {
        this._terminal.setgLevel(level);
    };
    return InputHandler;
}(Lifecycle_1.Disposable));
exports.InputHandler = InputHandler;
//# sourceMappingURL=InputHandler.js.map