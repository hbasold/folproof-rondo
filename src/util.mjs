import { getDebugMode, noticeColour } from "./config.mjs";

function debugMessage() {
  if (getDebugMode()) {
    console.log(noticeColour(...Array.prototype.slice.call(arguments)));
  }
}

export { debugMessage };
