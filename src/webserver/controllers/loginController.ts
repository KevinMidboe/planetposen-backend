import cookie from "cookie";
import type { Request, Response } from "express";

const cookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

function addAdminCookie(res: Response) {
  const adminCookie = cookie.serialize("admin", true, cookieOptions);
  res.setHeader("Set-Cookie", adminCookie);
}

function deleteAdminCookie(res: Response) {
  const adminCookie = cookie.serialize("admin", false, {
    path: "/",
    maxAge: 1,
  });
  res.setHeader("Set-Cookie", adminCookie);
}

function login(req: Request, res: Response) {
  const { username, password } = req.body;

  if (username !== "admin" || password !== "admin") {
    return res.status(403).send({
      success: false,
      message: "Feil brukernavn eller passord",
    });
  }

  addAdminCookie(res);
  res.send({
    success: true,
    message: "Velkommen!",
  });
}

function logout(req: Request, res: Response) {
  deleteAdminCookie(res);
  res.status(200).send("ok");
}

export default { login, logout };
