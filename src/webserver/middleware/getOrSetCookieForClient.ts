import cookie from "cookie";
import generateUUID from "../../utils/generateUUID";
import httpContext from "express-http-context";
import type { Request, Response, NextFunction } from "express";

const cookieClientKey = "planet_id";
const cookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

function setplanet_idCookieHeader(res: Response, value: string) {
  const setCookie = cookie.serialize("planet_id", value, cookieOptions);
  return res.setHeader("Set-Cookie", setCookie);
}

const getOrSetCookieForClient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  let planet_id = cookies[cookieClientKey];

  if (planet_id) {
    req.planet_id = planet_id;
    httpContext.set("planet_id", planet_id);
    return next();
  }

  planet_id = generateUUID();
  setplanet_idCookieHeader(res, planet_id);

  next();
};

export default getOrSetCookieForClient;
