"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CHAR_DATA_CODE_INDEX = 3;
var NULL_CELL_CODE = 32;
function winptyCompatInit(terminal) {
    var addonTerminal = terminal;
    var isWindows = ['Windows', 'Win16', 'Win32', 'WinCE'].indexOf(navigator.platform) >= 0;
    if (!isWindows) {
        return;
    }
    addonTerminal.on('linefeed', function () {
        var line = addonTerminal._core.buffer.lines.get(addonTerminal._core.buffer.ybase + addonTerminal._core.buffer.y - 1);
        var lastChar = line.get(addonTerminal.cols - 1);
        if (lastChar[CHAR_DATA_CODE_INDEX] !== NULL_CELL_CODE) {
            var nextLine = addonTerminal._core.buffer.lines.get(addonTerminal._core.buffer.ybase + addonTerminal._core.buffer.y);
            nextLine.isWrapped = true;
        }
    });
}
exports.winptyCompatInit = winptyCompatInit;
function apply(terminalConstructor) {
    terminalConstructor.prototype.winptyCompatInit = function () {
        winptyCompatInit(this);
    };
}
exports.apply = apply;
//# sourceMappingURL=winptyCompat.js.map