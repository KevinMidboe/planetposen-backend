const WAGO_ERROR_STATUS_CODES = {
  CONFLICTING_ORDER_RESERVATION: {
    status: "CONFLICTING_ORDER_RESERVATION",
    message:
      "An order for this product has been already reserved, before this order that is being processed.",
  },
  UNKNOWN_ERROR: {
    status: "UNKNOWN_ERROR",
    message: "An unknown error has occured",
  },
  NO_CAPTURED_PAYMENTS: {
    status: "NO_CAPTURED_PAYMENTS",
    message: "No captured payments has been found for this order.",
  },
};

class WagoError extends Error {
  constructor(error = WAGO_ERROR_STATUS_CODES.UNKNOWN_ERROR) {
    super(error.message);

    this.error = error;
  }
}

module.exports = {
  WagoError,
  WAGO_ERROR_STATUS_CODES,
};
