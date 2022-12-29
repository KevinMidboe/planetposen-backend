export {};

declare global {
  namespace Express {
    export interface Request {
      planet_id?: string;
    }
  }
}
