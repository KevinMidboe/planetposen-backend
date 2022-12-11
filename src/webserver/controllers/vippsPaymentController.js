const { VippsApiResourceNotFound } = require(`${__base}/vipps/vippsApiErrors`);
const { WagoError, WAGO_ERROR_STATUS_CODES } = require(`${__base}/errors`);
const { VIPPS_STATUS_CODES } = require(`${__enums}/vipps`);
const OrderRepository = require(`${__base}/order`);
const OrderController = require(`${__controllers}/orderController`);

const orderRepository = new OrderRepository();
const Vipps = require(`${__base}/vipps`);
const VippsRepository = require(`${__base}/vipps/vippsRepository`);

const vipps = new Vipps();
const vippsRepository = new VippsRepository();

function getPaymentDetails(req, res) {
  console.log("hit get details payment");

  const { id } = req.params;
  return vipps
    .getPayment(id)
    .then((payment) =>
      res.send({
        success: true,
        payment,
      })
    )
    .catch((err) => {
      const { statusCode, message } = err;

      return res.status(statusCode || 500).send({
        success: false,
        payment: null,
        message: message,
      });
    });
}

function cancelPayment(req, res) {
  console.log("hit cancelOrder endpoint");
  const { id } = req.params;

  return vippsRepository.cancelPayment(id).then((canceled) =>
    res.send({
      success: true,
      canceled: canceled,
    })
  );
}

function rejectPayment(id, amount) {
  console.log("rejectPayment");
  return vippsRepository
    .cancelPayment(id)
    .then((_) =>
      vippsRepository.updatePaymentStatus(
        id,
        VIPPS_STATUS_CODES.REJECTED,
        amount
      )
    )
    .then((_) => orderRepository.rejectByVippsTimeout(id));
}

function rejectByVippsTimeout(id, amount) {
  console.log("reject-by-timeout");
  return vippsRepository
    .cancelPayment(id)
    .then((_) =>
      vippsRepository.updatePaymentStatus(
        id,
        VIPPS_STATUS_CODES.TIMED_OUT_REJECT,
        amount
      )
    )
    .then((_) => orderRepository.rejectByVippsTimeout(id));
}

function updatePayment(req, res) {
  console.log("updatePayment:", req.body);
  const { id } = req.params;
  const {
    transactionInfo: { status },
    errorInfo,
  } = req.body;

  let statusCode;
  if (status && VIPPS_STATUS_CODES[status]) {
    statusCode = VIPPS_STATUS_CODES[status];
  }

  // TODO: Don't cancel whole order when one new order
  // fails/gets rejected/cancels
  if (status === VIPPS_STATUS_CODES.REJECTED) {
    switch (errorInfo.errorCode) {
      case 45:
      default:
        return vippsRepository
          .cancelOrRefundPartialOrder(id)
          .then((_) => orderRepository.cancelOrder(id));
    }
  } else if (status === VIPPS_STATUS_CODES.CANCELLED) {
    return vippsRepository
      .cancelOrRefundPartialOrder(id)
      .then((_) => orderRepository.cancelOrder(id));
  }

  return vippsRepository
    .getOrder(id)
    .then((order) => extendOrUpdateNewOrder(order, statusCode, req))
    .then((_) => res.status(200).send())
    .catch((error) => {
      console.log("we errored here", error);
      return vippsRepository
        .cancelOrRefundPartialOrder(id)
        .then((_) => orderRepository.cancelOrder(id));
    });
}

function extendOrUpdateNewOrder(order, statusCode, req) {
  const {
    transactionInfo: { transactionId, amount },
  } = req.body;
  const vippsId = order.order_id;
  let orderId = order.order_id;
  if (order.parent_order_id) {
    orderId = order.parent_order_id;
  }
  return vippsRepository
    .updatePaymentStatus(vippsId, statusCode, amount, transactionId)
    .then((_) => {
      if (order.parent_order_id) {
        return getNewTimeToTurnOn(order);
        // return getNewTimeToTurnOn(order).then(hours =>
        //   PlsController.extendTime(hours, order)
        // );
      }

      return OrderController.verifyNoCollidingOrders(orderId);
      // return OrderController.verifyNoCollidingOrders(orderId).then(
      //   async order => await PlsController.sendDuration(order)
      // );
    })
    .then(async (plsResponse) => {
      if (plsResponse.startTime) {
        await orderRepository.updateStartTime(orderId, plsResponse.startTime);
      }
      return orderRepository
        .updateEndTime(orderId, plsResponse.endTime)
        .then((_) =>
          vippsRepository.updateEndTime(vippsId, plsResponse.endTime)
        );
    })
    .then((_) => vipps.captureAmount(vippsId, amount, req.id))
    .then((capture) =>
      vippsRepository.updatePaymentCapture(
        vippsId,
        capture.transactionSummary.capturedAmount
      )
    );
}

async function getNewTimeToTurnOn(order) {
  const previousExtendedAndPreviousOrder = await orderRepository.getExtendedOrders(
    order.parent_order_id
  );
  let hoursToExpandAndSendToPls = 0;
  let currentEndTime;
  const now = new Date();

  for (let i = 0; i < previousExtendedAndPreviousOrder.length; i++) {
    const currentElement = previousExtendedAndPreviousOrder[i];

    if (currentElement.order_id === order.parent_order_id) {
      currentEndTime = new Date(currentElement.end_time);
      if (currentEndTime < now) {
        currentEndTime = now;
      }
    }
  }
  const timeLeft = (currentEndTime.getTime() - now.getTime()) / 36e5;
  hoursToExpandAndSendToPls = order.hours + timeLeft;
  return hoursToExpandAndSendToPls;
}

module.exports = {
  getPaymentDetails,
  cancelPayment,
  extendOrUpdateNewOrder,
  updatePayment,
  getNewTimeToTurnOn,
};
