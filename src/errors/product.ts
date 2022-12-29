export class ProductNotFoundError extends Error {
  statusCode: number;

  constructor() {
    const message = "Could not find a product with that id";
    super(message);

    this.statusCode = 404;
  }
}
