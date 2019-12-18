"use strict";

import pinyin from "./core";
import patcher56L from "./patchers/56l";

// Patch dict for icudt56l.dat related env, such as safari|node v4.
if (pinyin.isSupported() && patcher56L.shouldPatch(pinyin.genToken)) {
  pinyin.patchDict(patcher56L);
}

export default pinyin;
