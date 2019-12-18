declare namespace TinyPinyin {
  interface DICT {
    PINYINS: string[];
    UNIHANS: string[];
    EXCEPTIONS: {
      [code: string]: string;
    };
  }
  type Patcher = (DICT: DICT) => void;
  export function isSupported(force?: boolean): boolean;
  export function parse(
    str: string,
  ): Array<{
    type: 1 | 2 | 3;
    source: string;
    target: string;
  }>;
  export function convertToPinyin(
    str: string,
    separator?: string,
    lowerCase?: boolean,
  ): string;
  export function patchDict(patcher: Patcher | Patcher[]): void;
}

declare module 'tiny-pinyin' {
  export = TinyPinyin;
}
