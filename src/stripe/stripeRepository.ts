import establishedDatabase from "../database";
import Configuration from "../config/configuration";
import StripeApi from "./stripeApi";
import Stripe from "stripe";
import type ICustomer from "../interfaces/ICustomer";

const configuration = Configuration.getInstance();
const stripeApi = new StripeApi(
  configuration.get("stripe", "publicKey"),
  configuration.get("stripe", "secretKey")
);

class StripeRepository {
  database: typeof establishedDatabase;

  constructor(database = establishedDatabase) {
    this.database = database || establishedDatabase;
  }

  commitPaymentToDatabase(
    orderId: string,
    payload: Stripe.Response<Stripe.PaymentIntent>
  ) {
    const query = `
      INSERT INTO stripe_payments
      (order_id, amount, stripe_initiation_response, stripe_transaction_id, stripe_status)
      VALUES ($1,$2,$3,$4,$5)`;

    return this.database.query(query, [
      orderId,
      payload.amount,
      payload,
      payload.id,
      payload.status,
    ]);
  }

  updatePaymentIntent(payload: Stripe.Response<Stripe.PaymentIntent>) {
    const query = `
      UPDATE stripe_payments
      SET stripe_status = $2, amount_received = $3, updated = $4
      WHERE order_id = $1`;

    return this.database.update(query, [
      payload.metadata.orderId,
      payload.status,
      payload.amount_received,
      new Date(),
    ]);
  }

  updatePaymentCharge(payload: Stripe.Response<Stripe.Charge>) {
    const query = `
      UPDATE stripe_payments
      SET stripe_status = $2, amount_captured = $3, amount_refunded = $4, updated = $5
      WHERE order_id = $1
    `;

    return this.database.update(query, [
      payload.metadata.orderId,
      payload.status,
      payload.amount_captured,
      payload.amount_refunded,
      new Date(),
    ]);
  }

  async createPayment(
    clientId: string,
    total: number,
    orderId: string,
    customer: ICustomer
  ) {
    const paymentIntent = await stripeApi.createPaymentIntent(
      clientId,
      total,
      orderId,
      customer
    );

    return this.commitPaymentToDatabase(orderId, paymentIntent).then(
      () => paymentIntent.client_secret
    );
  }
}

export default StripeRepository;
