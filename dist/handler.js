"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scan = void 0;
const index_js_1 = __importDefault(require("./scanner/index.js"));
const scan = async (event) => {
    let url;
    try {
        url = new URL(event.url);
    }
    catch (error) {
        console.error('Invalid URL:', event.url);
        return;
    }
    const email = event.email;
    const urlReachable = await fetch(url.origin, { method: 'HEAD' })
        .then(response => response.ok)
        .catch(() => false);
    if (!urlReachable) {
        return;
    }
    const results = await (0, index_js_1.default)(url);
    console.log(results);
    return await fetch('http://localhost:5173/scan/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            url: url.origin,
            results,
        }),
    }).catch(error => {
        console.error('Error submitting scan results:', error);
    });
};
exports.scan = scan;
