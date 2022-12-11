class SkuQuantityNotInStockError extends Error {
  name: string;
  statusCode: number;

  constructor(message) {
    super(message);
    this.name = "SkuQuantityNotInStockError";
    this.statusCode = 200;
  }
}

export default {
  SkuQuantityNotInStockError,
};
