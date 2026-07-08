declare module "multer" {
  import { RequestHandler } from "express";
  import { Request } from "express";

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
    destination?: string;
    filename?: string;
    path?: string;
  }

  interface Options {
    storage?: StorageEngine;
    dest?: string;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    preservePath?: boolean;
    fileFilter?: (req: Request, file: File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
  }

  interface StorageEngine {}

  interface DiskStorageOptions {
    destination?: string | ((req: Request, file: File, callback: (error: Error | null, destination: string) => void) => void);
    filename?: (req: Request, file: File, callback: (error: Error | null, filename: string) => void) => void;
  }

  interface MemoryStorageOptions {}

  interface Multer {
    (options?: Options): RequestHandler;
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: { name: string; maxCount?: number }[]): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  interface StorageFactory {
    diskStorage(options: DiskStorageOptions): StorageEngine;
    memoryStorage(): StorageEngine;
  }

  interface MulterStatic extends StorageFactory {
    (options?: Options): Multer;
  }

  const multer: MulterStatic;
  export = multer;
}

// Augment Express Request to include file from multer
declare global {
  namespace Express {
    interface Request {
      file?: import("multer").File;
      files?: import("multer").File[] | Record<string, import("multer").File[]>;
    }
  }
}
