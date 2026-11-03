window.__ModuleLoader__.load({id:"dsh-session-chat-tools",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.jsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  writeClipboard: () => writeClipboard
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "dsh-session-chat-tools";
var STYLE_ID = "dsh-session-chat-tools-style";
var zh = {
  "copy.aria": "\u590D\u5236\u5BF9\u8BDD ID\uFF1A{id}",
  "copy.title": "\u590D\u5236\u5BF9\u8BDD ID",
  "copy.copied": "\u5DF2\u590D\u5236\u5BF9\u8BDD ID",
  "copy.failed": "\u590D\u5236\u5931\u8D25"
};
var en = {
  "copy.aria": "Copy session ID: {id}",
  "copy.title": "Copy session ID",
  "copy.copied": "Session ID copied",
  "copy.failed": "Copy failed"
};
var inject = ["slots", "locale"];
async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  const exec = typeof document.execCommand === "function" ? document.execCommand.bind(document) : void 0;
  if (exec === void 0) return false;
  const element = document.createElement("textarea");
  element.value = text;
  element.setAttribute("readonly", "");
  element.style.position = "fixed";
  element.style.left = "-9999px";
  document.body.appendChild(element);
  element.select();
  try {
    return exec("copy");
  } catch {
    return false;
  } finally {
    element.remove();
  }
}
function CopyIcon({ copied }) {
  return copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m3.5 8.2 2.8 2.8 6.2-6.2" }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "5.1", y: "5.1", width: "7.4", height: "7.4", rx: "1.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.7 5.1V4.2a1.7 1.7 0 0 0-1.7-1.7H4.2a1.7 1.7 0 0 0-1.7 1.7V9A1.7 1.7 0 0 0 4.2 10.7h.9" })
  ] });
}
function CopySessionId({ sessionId, t }) {
  const [status, setStatus] = (0, import_react.useState)("idle");
  const timer = (0, import_react.useRef)();
  (0, import_react.useEffect)(() => () => {
    clearTimeout(timer.current);
  }, []);
  const copy = async () => {
    const accepted = await writeClipboard(String(sessionId));
    setStatus(accepted ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("idle");
    }, 1600);
  };
  const title = status === "copied" ? t("copy.copied") : status === "failed" ? t("copy.failed") : t("copy.title");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      type: "button",
      className: "dsh-session-chat-tools-copy",
      "data-status": status,
      "aria-label": status === "idle" ? t("copy.aria", { id: String(sessionId) }) : title,
      title,
      onClick: () => {
        void copy();
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ID" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyIcon, { copied: status === "copied" })
      ]
    }
  );
}
function installStyles() {
  if (document.querySelector(`#${STYLE_ID}`) !== null) return () => {
  };
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.dsh-session-chat-tools-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 56px;
  padding: 6px 12px;
  gap: 5px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 18px;
  color: var(--dsw-alias-label-primary);
  background: transparent;
  font: 400 13px/20px var(--dsw-font-family);
  cursor: pointer;
}
.dsh-session-chat-tools-copy:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-session-chat-tools-copy:focus-visible { outline: 2px solid var(--dsw-alias-label-primary-bluish); outline-offset: 2px; }
.dsh-session-chat-tools-copy[data-status="copied"] { color: var(--dsw-alias-label-primary-bluish); }
.dsh-session-chat-tools-copy[data-status="failed"] { color: var(--dsw-alias-label-error); }
.dsh-session-chat-tools-copy span { white-space: nowrap; }
.dsh-session-chat-tools-copy svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
`;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}
function apply(ctx) {
  ctx.effect(installStyles);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }));
  ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
    name: "conversation.session.header.utilities",
    id: "copy-session-id",
    locale: NS
  }, CopySessionId));
}
return module.exports;}});
