declare module 'rotating-file-stream' {
  import { Writable } from 'stream';

  interface Options {
    path?: string;
    size?: string;
    interval?: string;
    maxFiles?: number;
    maxSize?: string;
    compress?: boolean | 'gzip';
    immutable?: boolean;
    history?: string;
    rotate?: number;
  }

  export function createStream(
    filename: string | ((time: Date | number, index?: number) => string),
    options?: Options
  ): Writable;
}
