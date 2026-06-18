declare namespace Express {
  export interface Multer {
    File: any;
  }

  export interface Request {
    file?: any;
    files?: any;
  }
}