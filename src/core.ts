import DICT from './dict';

const FIRST_PINYIN_UNIHAN = '\u963F';
const LAST_PINYIN_UNIHAN = '\u9FFF';

const LATIN = 1;
const PINYIN = 2;
const UNKNOWN = 3;

let supported: boolean = false;
let COLLATOR: Intl.Collator;

function patchDict(patchers: any) {
  if (!patchers) {
    return;
  }
  if (typeof patchers === 'function') {
    patchers = [patchers];
  }
  if (patchers.forEach) {
    patchers.forEach((p: any) => {
      if (typeof p === 'function') {
        p(DICT);
      }
    });
  }
}

function isSupported(force?: boolean) {
  if (!force && supported) {
    return supported;
  }
  if (typeof Intl === 'object' && Intl.Collator) {
    COLLATOR = new Intl.Collator(['zh-Hans-CN', 'zh-CN']);
    supported = Intl.Collator.supportedLocalesOf(['zh-CN']).length === 1;
  } else {
    supported = false;
  }
  return supported;
}

function genToken(ch: string) {
  // Access DICT here, give the chance to patch DICT.
  const UNIHANS = DICT.UNIHANS;
  const PINYINS = DICT.PINYINS;
  const EXCEPTIONS = DICT.EXCEPTIONS;
  const token: {
    source: string;
    type?: number;
    target?: string;
  } = {
    source: ch,
  };

  // First check EXCEPTIONS map, then search with UNIHANS table.
  if (ch in EXCEPTIONS) {
    token.type = PINYIN;
    token.target = EXCEPTIONS[ch];
    return token;
  }

  let offset = -1;
  let cmp: number;
  if (ch.charCodeAt(0) < 256) {
    token.type = LATIN;
    token.target = ch;
    return token;
  } else {
    cmp = COLLATOR.compare(ch, FIRST_PINYIN_UNIHAN);
    if (cmp < 0) {
      token.type = UNKNOWN;
      token.target = ch;
      return token;
    } else if (cmp === 0) {
      token.type = PINYIN;
      offset = 0;
    } else {
      cmp = COLLATOR.compare(ch, LAST_PINYIN_UNIHAN);
      if (cmp > 0) {
        token.type = UNKNOWN;
        token.target = ch;
        return token;
      } else if (cmp === 0) {
        token.type = PINYIN;
        offset = UNIHANS.length - 1;
      }
    }
  }

  token.type = PINYIN;
  if (offset < 0) {
    let begin = 0;
    let end = UNIHANS.length - 1;
    while (begin <= end) {
      offset = ~~((begin + end) / 2);
      const unihan = UNIHANS[offset];
      cmp = COLLATOR.compare(ch, unihan);

      // Catch it.
      if (cmp === 0) {
        break;
      } else if (cmp > 0) {
        // Search after offset.
        begin = offset + 1;
      } else {
        // Search before the offset.
        end = offset - 1;
      }
    }
  }

  if (cmp < 0) {
    offset--;
  }

  token.target = PINYINS[offset];
  if (!token.target) {
    token.type = UNKNOWN;
    token.target = token.source;
  }
  return token;
}

function parse(str: string) {
  if (typeof str !== 'string') {
    throw new Error('argument should be string.');
  }
  if (!isSupported()) {
    throw new Error('not support Intl or zh-CN language.');
  }
  return str.split('').map(v => genToken(v));
}

export default {
  isSupported,
  parse,
  patchDict,
  genToken, // inner usage
  convertToPinyin(str: string, separator?: string, lowerCase?: boolean) {
    return parse(str)
      .map((v: any) => {
        if (lowerCase && v.type === PINYIN) {
          return v.target.toLowerCase();
        }
        return v.target;
      })
      .join(separator || '');
  },
};
