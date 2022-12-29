import logger from "../../logger";
import OrderRepository from "../../order";
import CustomerRepository from "../../customer";
import ProductRepository from "../../product";
import WarehouseRepository from "../../warehouse";

import ICustomer from "../../interfaces/ICustomer";

import { validEmail } from "../../utils/formValidation";
import type ICart from "../../interfaces/ICart";

const orderRepository = new OrderRepository();
const customerRepository = new CustomerRepository();
const productRepository = new ProductRepository();
const warehouseRepository = new WarehouseRepository();

async function validateCart(cart: ICart[]) {
  const validationErrors = [];

  for (let i = 0; i < cart.length; i++) {
    const { sku_id, quantity, name, lineitem_id } = cart[i];
    const product = await productRepository.get(sku_id);
    if (!product) {
      validationErrors.push({
        type: "order-summary",
        field: `lineitem-${lineitem_id}`,
        message: `Fant ikke produktet ${name}.`,
      });
    }

    // check if in stock
    const leftInStockResponse = await warehouseRepository.checkSkuStock(sku_id);
    if (!leftInStockResponse || quantity > leftInStockResponse?.stock) {
      validationErrors.push({
        type: "order-summary",
        field: `lineitem-${lineitem_id}`,
        message: `Det er bare ${leftInStockResponse?.stock} igjen av denne varen på lager.`,
      });
    }
  }

  return validationErrors;
}

function validateCustomer(customer: ICustomer) {
  const {
    email,
    first_name,
    last_name,
    street_address,
    zip_code,
    city,
  } = customer;
  const validationErrors = [];

  if (!email?.length) {
    validationErrors.push({
      type: "customer",
      field: "email",
      message: "Epost adresse er påkrevd",
    });
  }

  if (!validEmail(email)) {
    validationErrors.push({
      type: "customer",
      field: "email",
      message: "Epost addressen er ikke gyldig",
    });
  }

  if (!first_name.length) {
    validationErrors.push({
      type: "customer",
      field: "first_name",
      message: "Fornavn er påkrevd",
    });
  }

  if (!last_name.length) {
    validationErrors.push({
      type: "customer",
      field: "last_name",
      message: "Etternavn er påkrevd",
    });
  }

  if (!street_address.length) {
    validationErrors.push({
      type: "customer",
      field: "street_address",
      message: "Gateadresse er påkrevd",
    });
  }

  const _zipcode = String(zip_code || "");
  if (!_zipcode.length) {
    validationErrors.push({
      type: "customer",
      field: "zip_code",
      message: "Postnummer er påkrevd",
    });
  } else if (_zipcode.length !== 3 && _zipcode.length !== 4) {
    validationErrors.push({
      type: "customer",
      field: "zip_code",
      message: "Postnummer må være 4 siffer",
    });
  }

  if (!city.length) {
    validationErrors.push({
      type: "customer",
      field: "city",
      message: "By er påkrevd",
    });
  }

  return validationErrors;
}

async function getAll(req, res) {
  logger.info("Getting all orders");
  try {
    const orders = await orderRepository.getAll();
    res.send({
      success: true,
      orders,
    });
  } catch (error) {
    logger.error("Error while getting all orders", { error });
    res.statusCode = error?.statusCode || 500;

    res.send({
      success: false,
      message: "Unexpected error while getting all orders",
    });
  }
}

// interface IOrderFormError {
//   type: string (enum)
//   field: string (enum) // the field is linked to html form name
//   message: string
// }

async function createOrder(req, res) {
  const cart: ICart[] = req.body?.cart;
  const customer: ICustomer = req.body?.customer;

  logger.info("Submitting new order", { customer, cart });

  // check if product exists
  let validationErrors = [];
  try {
    validationErrors = validationErrors.concat(validateCustomer(customer));
    validationErrors = validationErrors.concat(await validateCart(cart));
  } catch (error) {
    logger.error("Error while validation order", { error });
    res.statusCode = error?.statusCode || 500;

    return res.send({
      success: false,
      form_input: null,
      message: error?.message || "Unable to validate order",
    });
  }

  if (validationErrors.length) {
    logger.error("Validation error when submitting order", {
      validationErrors,
    });
    res.statusCode = 400;

    return res.send({
      success: false,
      validationErrors,
    });
  }

  try {
    const { customer_no } = await customerRepository.newCustomer(customer);
    const { order_id } = await orderRepository.newOrder(customer_no);
    await Promise.all(
      cart.map((lineItem) =>
        orderRepository.addOrderLineItem(
          order_id,
          lineItem.product_no,
          lineItem.sku_id,
          lineItem.price,
          lineItem.quantity
        )
      )
    );

    logger.info("Sucessfully created order", { order_id, customer_no });
    return res.send({
      success: true,
      message: "Sucessfull created order!",
      order_id,
      customer_no,
    });
  } catch (error) {
    logger.error("Error while creating customer or order", { error });
    res.statusCode = error?.statusCode || 500;

    return res.send({
      success: false,
      message: error?.message || "Unexpected error while creating order",
    });
  }
}

async function get(req, res) {
  const { order_id } = req.params;
  logger.info("Getting order by id", { order_id });

  // get a order
  let order = null;
  try {
    order = await orderRepository.getOrderDetailed(order_id);
    logger.info("Found order", { order });

    res.send({
      success: true,
      order,
    });
  } catch (error) {
    logger.error("Error while looking for order", { order_id, error });
    res.statusCode = error.statusCode || 500;

    res.send({
      success: false,
      message: error?.message || "Unexpected error while getting order",
    });
  }
}

async function getOrderStatus(req, res) {
  const { order_id } = req.params;
  logger.info("Getting order status by id", { order_id });

  return await orderRepository.getOrderStatus(order_id).then((orderStatus) => {
    logger.info("Found order status", { order_id, orderStatus });

    if (orderStatus) {
      res.send({
        status: orderStatus?.status,
        order_id,
        success: true,
      });
    } else {
      logger.error("Error while getting order status", { order_id });

      res.status(500).send({
        initiated: null,
        confirmed: null,
        message: "Unexpeted error! Unable to get order status",
        success: false,
      });
    }
  });
}

// async function cancelOrder(req, res) {
//   const { id } = req.params;
//   let orderId = id;
//   const vippsId = id;
//   await vippsRepository.getOrder(id).then((order) => {
//     if (order && order.parent_order_id) {
//       orderId = order.parent_order_id;
//     }
//   });
//   return vippsRepository
//     .cancelOrRefundPartialOrder(vippsId, req.id)
//     .then((order) => PlsController.turnOff(order))
//     .then((_) =>
//       orderRepository.cancelOrder(orderId).then((canceled) =>
//         res.send({
//           success: true,
//           canceled: canceled,
//         })
//       )
//     )
//     .catch((error) => {
//       throw error;
//     });
// }

// function verifyNoCollidingOrders(id) {
//   return orderRepository
//     .getOrder(id)
//     .then((order) => orderRepository.getConflictingProductOrders(order))
//     .then(({ order, conflicting }) => checkForConflicting(order, conflicting));
// }

// function checkForConflicting(order, conflicting) {
//   const thisOrderCreated = new Date(order.created);
//   for (var i = 0; i < conflicting.length; i++) {
//     const thisConflictinCreated = new Date(conflicting[i].created);
//     // if we are anywhere with a conflict, we need to cancel/refund this
//     if (thisOrderCreated > thisConflictinCreated) {
//       throw new WagoError(
//         WAGO_ERROR_STATUS_CODES.CONFLICTING_ORDER_RESERVATION
//       );
//     }
//   }
//   return order;
// }

// async function extendOrder(req, res) {
//   let { amount } = req.body;
//   let extendeeOrderId = req.params.id;
//   let extendedTimes = 1;
//   const previousExtendedAndPreviousOrder = await vippsRepository
//     .getOrder(extendeeOrderId)
//     .then((order) => {
//       if (order.parent_order_id) {
//         extendeeOrderId = order.parent_order_id;
//       }
//       return orderRepository.getExtendedOrders(extendeeOrderId);
//     });

//   let orderId = `${extendeeOrderId}-ext-`;
//   if (!previousExtendedAndPreviousOrder || amount < 0) {
//     res.status(404).send({ success: false });
//     return;
//   }

//   for (let i = 0; i < previousExtendedAndPreviousOrder.length; i++) {
//     const currentElement = previousExtendedAndPreviousOrder[i];
//     if (currentElement.order_id !== extendeeOrderId) {
//       extendedTimes += 1;
//     }
//   }

//   orderId += extendedTimes;
//   const orderWithProductData = await orderRepository.getOrderWithProduct(
//     extendeeOrderId
//   );

//   try {
//     amount = parseFloat(amount);
//   } catch (e) {}
//   const moneyToPay = orderWithProductData.price * 100 * amount;

//   return vippsRepository
//     .newExtendedPayment(
//       orderId,
//       extendeeOrderId,
//       moneyToPay,
//       amount,
//       orderWithProductData
//     )
//     .then((resp) => {
//       res.send({
//         success: true,
//         ...resp,
//       });
//     })
//     .catch((error) => {
//       res.statusCode = error.statusCode || 500;

//       res.send({
//         success: false,
//         ...error,
//       });
//     });
// }

export default {
  createOrder,
  get,
  getAll,
  getOrderStatus,
  // cancelOrder,
  extendOrder: () => {},
  checkForConflicting: () => {},
  verifyNoCollidingOrders: () => {},
};
