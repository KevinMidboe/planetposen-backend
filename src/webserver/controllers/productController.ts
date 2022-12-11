import logger from "../../logger";
import ProductRepository from "../../product";
const productRepository = new ProductRepository();
import type { Request, Response } from "express";

async function add(req: Request, res: Response) {
  logger.info("Adding new product");
  try {
    const productId = await productRepository.add();
    const product = await productRepository.get(productId);
    logger.info("New product", { product });

    return res.send({
      success: true,
      product,
    });
  } catch (error) {
    logger.error("Error while adding product", { error });
    res.statusCode = error.statusCode || 500;

    return res.send({
      success: false,
      message: error?.message || "Unexpected error while adding product",
    });
  }
}

function update(req: Request, res: Response) {
  const { product_id } = req.params;
  logger.info("Updating product", { product_id });

  return productRepository
    .get(product_id)
    .then((product) => {
      logger.info("Updated product", { product, product_id });

      res.send({
        success: true,
        product: product,
      });
    })
    .catch((error) => {
      logger.error("Error while updating product", { error, product_id });
      res.statusCode = error.statusCode || 500;
      return res.send({
        success: false,
        message: error?.message || "Unexpected error while updating product",
      });
    });
}

function getAll(req: Request, res: Response) {
  logger.info("Getting all products");

  return productRepository
    .getAllProducts()
    .then((products) => {
      logger.info("Found products", { products });

      res.send({
        success: true,
        products: products,
      });
    })
    .catch((error) => {
      logger.error("Error while getting all products", { error });
      res.statusCode = error.statusCode || 500;

      res.send({
        success: false,
        message:
          error?.message || "Unexpected error while getting all products",
      });
    });
}

function getById(req: Request, res: Response) {
  const { product_id } = req.params;
  logger.info("Getting product", { product_id });

  return productRepository
    .get(product_id)
    .then((product) => {
      logger.info("Found product", { product, product_id });

      res.send({
        success: true,
        product: product,
      });
    })
    .catch((error) => {
      logger.error("Error while getting product by id", { product_id });
      res.statusCode = error.statusCode || 500;

      res.send({
        success: false,
        message:
          error?.message || "Unexpected error while getting product by id",
      });
    });
}

async function addSku(req: Request, res: Response) {
  const { product_id } = req.params;
  logger.info("Adding new sku", { product_id });

  try {
    await productRepository.addSku(product_id);
    const skus = await productRepository.getSkus(product_id);

    if (!skus.find((sku) => sku.default_price === true)) {
      const setDefaultResponse = await productRepository.setSkuDefaultPrice(
        product_id,
        skus[skus.length - 1].sku_id
      );

      skus[skus.length - 1].default_price = true;
    }
    logger.info("New skus after add", { skus, product_id });

    res.send({
      success: true,
      skus,
    });
  } catch (error) {
    logger.error("Error adding sku", { error, product_id });
    res.statusCode = error?.statusCode || 500;
    res.send({
      success: false,
      message: error?.message || "Unexpected error while adding new sku",
    });
  }
}

async function getSkus(req: Request, res: Response) {
  const { product_id } = req.params;
  const skus = await productRepository.getSkus(product_id);

  return res.send({
    success: true,
    skus,
  });
}

async function updateSku(req: Request, res: Response) {
  const { product_id, sku_id } = req.params;
  const { stock, size, price } = req.body;
  logger.info("Updating sku", { product_id, sku_id, stock, price, size });

  try {
    await productRepository.updateSku(product_id, sku_id, stock, size, price);
    const skus = await productRepository.getSkus(product_id);
    logger.info("New skus after update", { skus, product_id, sku_id });

    res.send({
      success: true,
      skus,
    });
  } catch (error) {
    logger.error("Error updating sku", { product_id, sku_id, error });
    res.statusCode = error?.statusCode || 500;

    res.send({
      success: false,
      message: error?.message || "Unexpected error while updating sku",
    });
  }
}

async function deleteSku(req: Request, res: Response) {
  const { product_id, sku_id } = req.params;

  try {
    await productRepository.deleteSku(product_id, sku_id);
    const skus = await productRepository.getSkus(product_id);
    logger.info("New skus after delete", { skus, product_id, sku_id });

    res.send({
      success: true,
      skus,
    });
  } catch (error) {
    logger.error("Error deleting sku", { product_id, sku_id, error });
    res.statusCode = error?.statusCode || 500;

    res.send({
      success: false,
      message: error?.message || "Unexpected error while deleting sku",
    });
  }
}

async function setSkuDefaultPrice(req: Request, res: Response) {
  const { product_id, sku_id } = req.params;
  logger.info("Updating sku default price", { product_id, sku_id });

  try {
    await productRepository.setSkuDefaultPrice(product_id, sku_id);
    const skus = await productRepository.getSkus(product_id);
    logger.info("New skus after update default price", {
      skus,
      product_id,
      sku_id,
    });

    res.send({
      success: true,
      skus,
    });
  } catch (error) {
    logger.error("Error while updating sku default price", {
      product_id,
      sku_id,
      error,
    });
    res.statusCode = error?.statusCode || 500;

    res.send({
      success: false,
      message:
        error?.message ||
        "Unexpected error while updating default price for sku",
    });
  }
}

export default {
  add,
  update,
  getAll,
  getById,
  addSku,
  getSkus,
  updateSku,
  deleteSku,
  setSkuDefaultPrice,
};
