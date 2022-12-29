import type ICustomer from "./interfaces/ICustomer";
import type { IProduct } from "./interfaces/IProduct";
import logger from "./logger";

class Email {
  baseUrl: string;

  constructor() {
    this.baseUrl = "http://localhost:8005/api/v1";
  }

  sendConfirmation(orderId: string, customer: ICustomer, products: IProduct[]) {
    const url = this.baseUrl + "/send-confirmation";
    let sum = 75; // shipping
    let options = {};

    try {
      products.forEach(
        (product: IProduct) => (sum = sum + product.price * product.quantity)
      );

      options = {
        method: "POST",
        body: JSON.stringify({
          email: customer?.email,
          orderId,
          customer: {
            FirstName: customer.first_name,
            LastName: customer.last_name,
            StreetAddress: customer.street_address,
            ZipCode: String(customer.zip_code),
            city: customer.city,
          },
          products,
          sum,
        }),
      };
    } catch (error) {
      logger.error("Unable to parse send confirmation input data", {
        error,
        orderId,
      });
      // throw error
      return;
    }

    return fetch(url, options)
      .then((resp) => resp.json())
      .catch((error) => {
        logger.error("Unexpected error from send confirmation", { error });
        // throw error
      });
  }
}

export default Email;
