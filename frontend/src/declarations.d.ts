declare module 'mammoth' {
  interface ConvertResult {
    value: string;
    messages: unknown[];
  }
  interface Options {
    arrayBuffer: ArrayBuffer;
  }
  export function convertToHtml(options: Options): Promise<ConvertResult>;
}
