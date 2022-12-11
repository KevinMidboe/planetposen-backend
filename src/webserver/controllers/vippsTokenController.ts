const Vipps = require(`${__base}/vipps`);
const vipps = new Vipps();
import type { Request, Response } from "express";

export default function VippsTokenController(req: Request, res: Response) {
  return vipps.token.then((token) =>
    res.send({
      success: true,
      token: token,
    })
  );
}
