export {};

declare global {
  namespace Express {
    export interface Request {
      planetId?: string;
    }
  }
}
