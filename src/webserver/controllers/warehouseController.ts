import logger from "../../logger";
import WarehouseRepository from "../../warehouse";
const warehouseRepository = new WarehouseRepository();
import type { Request, Response } from "express";

function getAll(req: Request, res: Response) {
  logger.info("Fething all warehouse products");

  return warehouseRepository
    .all()
    .then((warehouseProucts) => {
      logger.info("Found warehouse products", { products: warehouseProucts });

      res.send({
        success: true,
        warehouse: warehouseProucts,
      });
    })
    .catch((error) => {
      logger.error("Error fetching warehouse products", { error });
      res.statusCode = error.statusCode || 500;

      res.send({
        success: false,
        message:
          error?.message ||
          "Unexpected error while fetching all warehouse products",
      });
    });
}

function getProduct(req: Request, res: Response) {
  const { productId } = req.params;
  logger.info("Fetching warehouse product", { product_id: productId });

  return warehouseRepository
    .getProduct(productId)
    .then((product) => {
      logger.info("Found warehouse product", {
        product,
        product_id: productId,
      });

      res.send({
        success: true,
        product: product,
      });
    })
    .catch((error) => {
      logger.error("Error fetching warehouse product:", {
        error,
        product_id: productId,
      });
      res.statusCode = error.statusCode || 500;

      res.send({
        success: false,
        message:
          error?.message ||
          `Unexpected error while fetching product with id: ${productId}`,
      });
    });
}

export default { getAll, getProduct };
