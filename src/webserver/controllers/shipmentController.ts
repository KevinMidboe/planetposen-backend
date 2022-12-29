import logger from "../../logger";
import ShippingRepository from "../../shipping";
import {
  genericFailedResponse,
  postenApiFailedResponse,
} from "../controllerResponses";
import type { Request, Response } from "express";

const shippingRepository = new ShippingRepository();

async function create(req: Request, res: Response) {
  const { order_id } = req.params;
  logger.info("Creating shipment for order", { order_id });

  try {
    const { shipment_id } = await shippingRepository.create(order_id);
    logger.info("Shipment created", { shipment_id, order_id });

    const shipment = await shippingRepository.get(shipment_id);

    res.send({
      success: true,
      message: "Successfully created shipment on order",
      shipment,
    });
  } catch (error) {
    genericFailedResponse(
      res,
      "Unexpected error creating shipment on order",
      error
    );
  }
}

async function update(req: Request, res: Response) {
  const { shipment_id } = req.params;
  const { courier_id, tracking_code, tracking_link } = req.body;
  logger.info("Updating shipment", {
    shipment_id,
    courier_id,
    tracking_code,
    tracking_link,
  });

  try {
    const shipment = await shippingRepository.get(shipment_id);
    if (!shipment) {
      return genericFailedResponse(
        res,
        "Shipment not found, unable to update",
        null,
        404,
        { shipment_id }
      );
    }

    const courier = await shippingRepository.getCourier(courier_id);
    if (!courier) {
      return genericFailedResponse(
        res,
        "Unable to update shipment, selected courier not found",
        null,
        404,
        { shipment_id }
      );
    }

    await shippingRepository.update(
      shipment_id,
      courier_id,
      tracking_code,
      tracking_link
    );
    const newShipment = await shippingRepository.get(shipment_id);

    return res.send({
      success: true,
      message: "Successfully updated shipment",
      shipment: newShipment,
    });
  } catch (error) {
    genericFailedResponse(
      res,
      "Unexpected error while updating shipment",
      error,
      null,
      { shipment_id }
    );
  }
}

async function get(req, res) {
  const { shipment_id } = req.params;
  logger.info("Getting shipment by id", { shipment_id });

  // get a shipment
  let shipment = null;
  try {
    shipment = await shippingRepository.get(shipment_id);
    logger.info("Found shipment", { shipment });

    if (shipment === undefined) {
      return genericFailedResponse(
        res,
        `No shipment with id ${shipment_id} found`,
        null,
        404,
        { shipment_id }
      );
    }

    res.send({
      success: true,
      shipment,
    });
  } catch (error) {
    genericFailedResponse(
      res,
      `Unexpected error while looking for shipment`,
      error,
      500,
      { shipment_id }
    );
  }
}

async function track(req, res) {
  const { shipment_id } = req.params;
  logger.info("Tracking shipment by id", { shipment_id });

  if (isNaN(Number(shipment_id))) {
    return genericFailedResponse(
      res,
      "Shipment id must be a number",
      null,
      400
    );
  }

  // get a shipment
  let shipment = null;
  let trackedShipment = null;
  try {
    shipment = await shippingRepository.get(shipment_id);

    if (!shipment?.tracking_code) {
      return genericFailedResponse(
        res,
        "No tracking code registered on shipment",
        null,
        404,
        { shipment_id }
      );
    }

    logger.info("Found tracking code", {
      tracking_code: shipment.tracking_code,
    });
    try {
      trackedShipment = await shippingRepository.track(shipment?.tracking_code);
      logger.info("Found tracked shipment", {
        tracked_shipment: trackedShipment,
      });
    } catch (error) {
      return postenApiFailedResponse(
        res,
        "Unexpected error from posten API while tracking shipment",
        error,
        500,
        { shipment_id }
      );
    }

    res.send({
      success: true,
      shipment: trackedShipment,
    });
  } catch (error) {
    genericFailedResponse(
      res,
      "Unexpected error while tracking shipment",
      error,
      500,
      { shipment_id }
    );
  }
}

function allCouriers(req: Request, res: Response) {
  return shippingRepository.getAllCouriers().then((couriers) =>
    res.send({
      success: true,
      message: "All registered shipment couriers",
      couriers,
    })
  );
}

function getCourier(req: Request, res: Response) {
  const { courier_id } = req.params;

  if (isNaN(Number(courier_id))) {
    return genericFailedResponse(res, "Courier id must be a number", null, 400);
  }

  return shippingRepository
    .getCourier(courier_id)
    .then((courier) => {
      if (courier === undefined) {
        return genericFailedResponse(
          res,
          `No courier with that id found`,
          null,
          404,
          { courier_id }
        );
      }

      res.send({
        success: true,
        courier,
      });
    })
    .catch((error) => {
      genericFailedResponse(
        res,
        "Unexpected error happend while trying to get courier by id",
        error,
        500,
        { courier_id }
      );
    });
}

export default {
  create,
  update,
  get,
  track,
  allCouriers,
  getCourier,
};
