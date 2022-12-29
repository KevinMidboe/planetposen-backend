import Stripe from "stripe";
import type ICustomer from "../interfaces/ICustomer";

/**
 * Does calls to stripe API
 */

class StripeApi {
  publicKey: string;
  secretKey: string;
  stripe: Stripe;

  constructor(publicKey: string, secretKey: string) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
    this.stripe = new Stripe(this.secretKey, {
      apiVersion: "2022-08-01",
    });
  }

  async createPaymentIntent(
    planet_id: string,
    total: number,
    orderId: string,
    customer: ICustomer
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const stripeCustomer = await this.createCustomer(planet_id, customer);
    const paymentIntent = await this.stripe.paymentIntents.create({
      customer: stripeCustomer?.id,
      amount: total * 100,
      currency: "NOK",
      shipping: {
        name: stripeCustomer.name,
        address: stripeCustomer.address,
      },
      metadata: {
        planet_id,
        orderId,
      },
    });

    return paymentIntent;
  }

  async createCustomer(planet_id: string, customer: ICustomer) {
    return await this.stripe.customers.create({
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`,
      address: {
        city: customer.city,
        line1: customer.street_address,
        postal_code: String(customer.zip_code),
      },
      metadata: {
        planet_id,
      },
    });
  }

  createProduct() {
    return;
  }

  async createShipping() {
    return;
  }
}

export default StripeApi;
