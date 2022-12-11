import express from "express";
import { createServer } from "http";

// services
import logger from "../logger";
import { setupCartWebsocketServer } from "./websocketCartServer";

// controllers
// const TokenController = require(`${__controllers}/tokenController`);
import OrderController from "./controllers/orderController";
import ProductController from "./controllers/productController";
import WarehouseController from "./controllers/warehouseController";
import StripePaymentController from "./controllers/stripePaymentController";
import LoginController from "./controllers/loginController";

// middleware
import httpContext from "express-http-context";
import setupCORS from "./middleware/setupCORS";
import setupHeaders from "./middleware/setupHeaders";
import getOrSetCookieForClient from "./middleware/getOrSetCookieForClient";

const app = express();
const port = process.env.PORT || 30010;

app.use(httpContext.middleware);
app.use(setupCORS);
app.use(setupHeaders);
app.use(getOrSetCookieForClient);

const router = express.Router();
router.use(express.json());

router.post("/login", LoginController.login);
router.post("/logout", LoginController.logout);

router.get("/products", ProductController.getAll);
router.post("/product", ProductController.add);
router.get("/product/:product_id", ProductController.getById);
router.post("/product/:product_id/sku", ProductController.addSku);
router.patch("/product/:product_id/sku/:sku_id", ProductController.updateSku);
router.delete("/product/:product_id/sku/:sku_id", ProductController.deleteSku);
router.post(
  "/product/:product_id/sku/:sku_id/default_price",
  ProductController.setSkuDefaultPrice
);

router.get("/orders", OrderController.getAll);
router.post("/order", OrderController.createOrder);
router.get("/order/:order_id", OrderController.get);
router.get("/order/:order_id/status", OrderController.getOrderStatus);

router.get("/warehouse", WarehouseController.getAll);
router.get("/warehouse/:productId", WarehouseController.getProduct);
// router.get("/api/order/:id", OrderController.getOrderById);
// router.post("/api/order/:id/cancel", OrderController.cancelOrder);
// router.post("/api/order/:id/extend", OrderController.extendOrder);

router.post("/payment/stripe", StripePaymentController.create);
router.post("/webhook/stripe", StripePaymentController.updatePayment);

// router.get("/api/payment/vipps/token", VippsTokenController);
// router.get("/api/payment/:id/details", VippsPaymentController.getPaymentDetails);
// router.post(
//   "/api/payment/callback/v2/payments/:id",
//   VippsPaymentController.updatePayment
// );

router.get("/", (req, res) => res.send("hello"));

app.use("/api", router);

const server = createServer(app);
server.listen(port, () => logger.info(`Server started, listening at :${port}`));

setupCartWebsocketServer(server);
