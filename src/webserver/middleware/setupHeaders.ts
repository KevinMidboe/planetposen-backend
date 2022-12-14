import type { Request, Response, NextFunction } from "express";

const camelToKebabCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter: string) => `-${letter.toLowerCase()}`);

const mapFeaturePolicyToString = (features) => {
  return Object.entries(features)
    .map(([key, value]) => {
      key = camelToKebabCase(key);
      value = value == "*" ? value : `'${value}'`;
      return `${key} ${value}`;
    })
    .join("; ");
};

const setupHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "POST, PATCH, DELETE, PUT");

  // Security
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-XSS-Protection", "1; mode=block");
  res.set("X-Frame-Options", "SAMEORIGIN");
  res.set("X-DNS-Prefetch-Control", "off");
  res.set("X-Download-Options", "noopen");
  res.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");

  // Feature policy
  const features = {
    fullscreen: "*",
    payment: "none",
    microphone: "none",
    camera: "self",
    speaker: "*",
    syncXhr: "self",
  };
  const featureString = mapFeaturePolicyToString(features);
  res.set("Feature-Policy", featureString);

  return next();
};

export default setupHeaders;
