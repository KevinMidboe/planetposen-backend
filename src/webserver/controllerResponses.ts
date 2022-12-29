import logger from "../logger";

export function genericFailedResponse(
  res,
  message,
  error,
  status = 500,
  attributes = {}
) {
  logger.error(message, {
    controller_error: error?.message,
    controller_stack: error?.stack,
    status_code: error?.statusCode || status,
    ...attributes,
  });

  console.log("we have this:", {
    controller_error: error?.message,
    controller_stack: error?.stack,
    status_code: error?.statusCode || status,
    ...attributes,
  });

  return res.status(error?.statusCode || status).send({
    success: false,
    message,
  });
}

export function postenApiFailedResponse(
  res,
  message,
  error,
  status = 500,
  attributes = {}
) {
  logger.error(message, {
    controller_error: error?.message,
    controller_stack: error?.stack,
    posten_error: error?.apiError,
    status_code: error?.statusCode || status,
    ...attributes,
  });

  return res.status(error?.statusCode || status).send({
    success: false,
    message: error?.message || message,
    reason: error?.reason,
  });
}
