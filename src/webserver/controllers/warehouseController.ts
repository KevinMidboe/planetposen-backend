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
  const { product_id } = req.params;
  logger.info("Fetching warehouse product", { product_id });

  return warehouseRepository
    .getProduct(product_id)
    .then((product) => {
      logger.info("Found warehouse product", {
        product,
        product_id,
      });

      res.send({
        success: true,
        product: product,
      });
    })
    .catch((error) => {
      logger.error("Error fetching warehouse product:", {
        error,
        product_id,
      });
      res.statusCode = error.statusCode || 500;

      res.send({
        success: false,
        message:
          error?.message ||
          `Unexpected error while fetching product with id: ${product_id}`,
      });
    });
}

function getProductAudit(req: Request, res: Response) {
  const { product_id } = req.params;
  logger.info("Fetching audit logs for product", { product_id });

  return warehouseRepository
    .getProductAudit(product_id)
    .then((auditLogs) =>
      res.send({
        success: true,
        logs: auditLogs,
      })
    )
    .catch((error) => {
      logger.error("Unexpected error while fetching product audit log", error);

      res.status(error?.statusCode || 500).send({
        success: false,
        message: "Unexpected error while fetching product audit log",
      });
    });
}

export default { getAll, getProduct, getProductAudit };
