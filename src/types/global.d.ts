declare global {
  interface NodeJS {
    __base: string;
    __dirname: string;
    __enums: string;
    __middleware: string;
    __controllers: string;
  }
}

export {};
