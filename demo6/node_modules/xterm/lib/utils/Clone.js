"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = function (val, depth) {
    if (depth === void 0) { depth = 5; }
    if (typeof val !== 'object') {
        return val;
    }
    if (val === null) {
        return null;
    }
    var clonedObject = Array.isArray(val) ? [] : {};
    for (var key in val) {
        clonedObject[key] = depth <= 1 ? val[key] : exports.clone(val[key], depth - 1);
    }
    return clonedObject;
};
//# sourceMappingURL=Clone.js.map