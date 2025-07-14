"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.ToastProvider = exports.useToast = void 0;
var react_1 = require("react");
var ToastContext = react_1.createContext(undefined);
exports.useToast = function () {
    var ctx = react_1.useContext(ToastContext);
    if (!ctx)
        throw new Error("useToast must be used within ToastProvider");
    return ctx;
};
exports.ToastProvider = function (_a) {
    var children = _a.children;
    var _b = react_1.useState([]), toasts = _b[0], setToasts = _b[1];
    var showToast = function (message, type) {
        if (type === void 0) { type = "info"; }
        var id = Date.now() + Math.random();
        setToasts(function (prev) { return __spreadArrays(prev, [{ message: message, type: type, id: id }]); });
        setTimeout(function () { return setToasts(function (prev) { return prev.filter(function (t) { return t.id !== id; }); }); }, 3500);
    };
    return (React.createElement(ToastContext.Provider, { value: { showToast: showToast } },
        children,
        React.createElement("div", { className: "fixed bottom-[4px] right-[4px] z-[9999] flex flex-col gap-[2px] border-2 border-[#030124] p-[4px] rounded-[10px]" }, toasts.map(function (toast) { return (React.createElement("div", { key: toast.id, className: "px-[4px] py-[2px] rounded-[6px] shadow-[10px] text-[#030121] font-bold\n              " + (toast.type === "success"
                ? "bg-[#00f10f]"
                : toast.type === "error"
                    ? "bg-[#ff0000]"
                    : "bg-gray-800") + "\n            " }, toast.message)); }))));
};
