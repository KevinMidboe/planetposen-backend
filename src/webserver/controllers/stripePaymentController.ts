import Configuration from "../../config/configuration";
import StripeApi from "../../stripe/stripeApi";
import StripeRepository from "../../stripe/stripeRepository";
import OrderRepository from "../../order";
import CustomerRepository from "../../customer";

import Stripe from "stripe";

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

async function create(req, res) {
  const clientId = req?.planetId;
  const { order_id, customer_no } = req.body;

  if (!order_id || !customer_no) {
    return res.status(400).send({
      success: false,
      message: "Missing order_id and/or customer_id",
    });
  }

  const order: IOrder = await orderRepository.getOrder(order_id);
  const customer: ICustomer = await customerRepository.getCustomer(customer_no);

  const sum = order.lineItems?.reduce(
    (total, lineItem: ILineItem) => total + lineItem.quantity * lineItem.price,
    0
  );

  stripeRepository
    .createPayment(clientId, sum, order_id, customer)
    .then((clientSecret) =>
      res.send({
        success: true,
        clientSecret,
      })
    );
}

async function updatePayment(req: Request, res: Response) {
  console.log("STRIPE WEBHOOK body:", req.body);
  const { type, data } = req.body;
  const { object } = data;
  const { orderId } = object?.metadata;

  if (!data) {
    console.log("no data found in webhook, nothing to do");
    return res.status(200).send("ok");
  }

  if (!orderId) {
    console.log("no order_id found in webhook, nothing to do");
    return res.status(200).send("ok");
  }

  if (type === "payment_intent.created") {
    console.log("handle payment intent created... doing nothing");
  } else if (type === "payment_intent.succeeded") {
    console.log("handle payment succeeded", object);
    await stripeRepository.updatePaymentIntent(object);
    orderRepository.confirmOrder(orderId);
  } else if (type === "payment_intent.payment_failed") {
    console.log("handle payment failed", object);
    await stripeRepository.updatePaymentIntent(object);
    orderRepository.cancelOrder(orderId);
  } else if (type === "charge.succeeded") {
    console.log("handle charge succeeded", object);
    await stripeRepository.updatePaymentCharge(object);
  } else if (type === "charge.refunded") {
    console.log("handle charge refunded", object);
    await stripeRepository.updatePaymentCharge(object);
    await orderRepository.refundOrder(orderId);
  } else {
    console.log(`webhook for ${type}, not setup yet`);
  }

  // should always return 200 but should try catch and log error
  return res.status(200).send("ok");
}

export default {
  create,
  updatePayment,
};
