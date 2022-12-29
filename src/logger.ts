import winston from "winston";
import ecsFormat from "@elastic/ecs-winston-format";
import httpContext from "express-http-context";

const logLevel = "debug";
// const logLevel = 'trace';

const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    trace: "blue",
    debug: "white",
    info: "green",
    warning: "yellow",
    error: "red",
    fatal: "red",
  },
};

const appendPlanetId = winston.format((log) => {
  log.planet_id = httpContext.get("planet_id");
  return log;
});

const appName = winston.format((log) => {
  log.application = "planetposen-backend";
  return log;
});

const logger = winston.createLogger({
  level: logLevel,
  levels: customLevels.levels,
  transports: [
    new winston.transports.File({
      filename: "/var/log/planetposen_logs/planetposen-backend.log",
      maxsize: 100000000, // 100 MB
      tailable: true,
      maxFiles: 3,
      format: winston.format.combine(appendPlanetId(), appName(), ecsFormat()),
    }),
  ],
});

winston.addColors(customLevels.colors);

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
