import type { Request, Response, NextFunction } from "express";

const openCORS = (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "*");
  return next();
};

export default openCORS;
