import Stripe from "stripe";

import logger from "../../logger";
import Configuration from "../../config/configuration";
import StripeApi from "../../stripe/stripeApi";
import StripeRepository from "../../stripe/stripeRepository";
import OrderRepository from "../../order";
import CustomerRepository from "../../customer";
import EmailRepository from "../../email";

import type { Request, Response, NextFunction } from "express";
import type { IOrder, ILineItem } from "../../interfaces/IOrder";
import type ICustomer from "../../interfaces/ICustomer";

const configuration = Configuration.getInstance();
const stripePublicKey = configuration.get("stripe", "publicKey");
const stripeSecretKey = configuration.get("stripe", "secretKey");
const stripeApi = new StripeApi(stripePublicKey, stripeSecretKey);
const stripeRepository = new StripeRepository();
const orderRepository = new OrderRepository();
const customerRepository = new CustomerRepository();
const emailRepository = new EmailRepository();

async function create(req, res) {
  const planet_id = req?.planet_id;
  const { order_id, customer_no } = req.body;

  logger.info("Creating stripe payment intent", {
    planet_id,
    order_id,
    customer_no,
  });

  if (!order_id || !customer_no) {
    logger.warning("Missing order_id and/or customer_id");

    return res.status(400).send({
      success: false,
      message: "Missing order_id and/or customer_id",
    });
  }

  try {
    const order: IOrder = await orderRepository.getOrder(order_id);
    const customer: ICustomer = await customerRepository.getCustomer(
      customer_no
    );

    const sum = order.lineItems?.reduce(
      (total, lineItem: ILineItem) =>
        total + lineItem.quantity * lineItem.price,
      0
    );

    stripeRepository
      .createPayment(planet_id, sum, order_id, customer)
      .then((clientSecret) => {
        logger.info("New stripe payment", {
          planet_id,
          client_secret: clientSecret,
        });

        res.send({
          success: true,
          clientSecret,
        });
      });
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    logger.error("Error creating stripe payment intent", {
      error,
      planet_id,
      customer_no,
      order_id,
    });

    res.send({
      success: false,
      message:
        error?.message ||
        "Unexcepted error while creating stripe payment intent",
    });
  }
}

async function updatePayment(req: Request, res: Response) {
  const { type, data } = req.body;
  const { object } = data;
  const { orderId } = object?.metadata;

  if (!data) {
    console.log("no data found in webhook, nothing to do");
    return res.status(200).send("ok");
  }

  if (!orderId) {
    logger.warning("no order_id found in webhook from stripe, nothing to do", {
      stripe_webhook_type: type,
      [type]: object,
    });
    return res.status(200).send("ok");
  }

  if (type === "payment_intent.created") {
    console.log("handle payment intent created... doing nothing");
  } else if (type === "payment_intent.succeeded") {
    await stripeRepository.updatePaymentIntent(object);
    await orderRepository.confirmOrder(orderId);
    const { customer, lineItems } = await orderRepository.getOrderDetailed(
      orderId
    );
    await emailRepository.sendConfirmation(orderId, customer, lineItems);
  } else if (type === "payment_intent.payment_failed") {
    console.log("handle payment failed", object);
    await stripeRepository.updatePaymentIntent(object);
    await orderRepository.cancelOrder(orderId);
  } else if (type === "charge.succeeded") {
    await stripeRepository.updatePaymentCharge(object);
  } else if (type === "charge.refunded") {
    await stripeRepository.updatePaymentCharge(object);
    await orderRepository.refundOrder(orderId);
  } else {
    logger.warning("unhandled webhook from stripe", {
      stripe_webhook_type: type,
      [type]: object,
    });
    console.log(`webhook for ${type}, not setup yet`);
  }

  // should always return 200 but should try catch and log error
  return res.status(200).send("ok");
}

export default {
  create,
  updatePayment,
};
