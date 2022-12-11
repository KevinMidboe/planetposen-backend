import cookie from "cookie";
import generateUUID from "../../utils/generateUUID";
import httpContext from "express-http-context";
import type { Request, Response, NextFunction } from "express";

const cookieClientKey = "planetId";
const cookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

function setClientIdCookieHeader(res: Response, value: string) {
  const setCookie = cookie.serialize("planetId", value, cookieOptions);
  return res.setHeader("Set-Cookie", setCookie);
}

const getOrSetCookieForClient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const planetId = cookies[cookieClientKey];

  if (planetId) {
    req.planetId = planetId;
    httpContext.set("planetId", planetId);
    return next();
  }

  const clientId = generateUUID();
  setClientIdCookieHeader(res, clientId);

  next();
};

export default getOrSetCookieForClient;
