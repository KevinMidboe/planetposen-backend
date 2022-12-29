export class PostenNotFoundError extends Error {
  reason: string;
  apiError: object;
  statusCode: number;

  constructor(apiError) {
    const message = "Tracking code not found at Posten BRING";
    super(message);

    this.statusCode = 404;
    this.reason = apiError?.errorMessage;
    this.apiError = apiError;
  }
}

export class PostenInvalidQueryError extends Error {
  reason: string;
  apiError: object;
  statusCode: number;

  constructor(apiError) {
    const message = "Unable to search for tracking code";
    super(message);

    this.statusCode = apiError?.consignmentSet?.[0]?.error?.code || 500;
    this.reason = apiError?.consignmentSet?.[0]?.error?.message;
    this.apiError = apiError;
  }
}
