import logger from "../logger";
import establishedDatabase from "../database";
import PostenRepository from "./posten";

const posten = new PostenRepository();

class ShippingRepository {
  database: typeof establishedDatabase;

  constructor(database = establishedDatabase) {
    this.database = database || establishedDatabase;
  }

  async track(trackingCode: string) {
    const trackResponse = await posten.track(trackingCode);
    console.log("trackResponse:", trackResponse);

    return trackResponse;
  }

  async create(orderId: string) {
    const query = `
      INSERT INTO shipment (order_id, courier_id)
      VALUES ($1, NULL)
      RETURNING shipment_id`;

    return this.database.get(query, [orderId]);
  }

  async update(
    shipmentId: string,
    courierId: string,
    trackingCode: string,
    trackingLink: string
  ) {
    const query = `
      UPDATE shipment
      SET courier_id = $1, tracking_code = $2, tracking_link = $3
      WHERE shipment_id = $4
      RETURNING shipment_id`;

    return this.database.get(query, [
      courierId,
      trackingCode,
      trackingLink,
      shipmentId,
    ]);
  }

  async get(shipmentId: string) {
    const query = `
      SELECT shipment_id, order_id, shipment_courier.name as courier, shipment_courier.has_api, shipment_courier.shipment_courier_id as courier_id, tracking_code, tracking_link, user_notified
      FROM shipment
      LEFT JOIN shipment_courier
      ON shipment.courier_id = shipment_courier.shipment_courier_id
      WHERE shipment_id = $1`;

    return this.database.get(query, [shipmentId]);
  }

  async getByOrderId(orderId: string) {
    const query = `
      SELECT shipment_id, order_id, shipment_courier.name as courier, shipment_courier.has_api, shipment_courier.shipment_courier_id as courier_id, tracking_code, tracking_link, user_notified
      FROM shipment
      INNER JOIN shipment_courier
      ON shipment.courier_id = shipment_courier.shipment_courier_id
      WHERE order_id = $1`;

    return this.database.get(query, [orderId]);
  }

  getCourier(courierId: string) {
    const query = `
      SELECT shipment_courier_id AS courier_id, name, website, has_api
      FROM shipment_courier
      WHERE shipment_courier_id = $1`;

    return this.database.get(query, [courierId]);
  }

  getAllCouriers() {
    const query = `
      SELECT shipment_courier_id AS courier_id, name, website, has_api
      FROM shipment_courier`;

    return this.database.all(query, []);
  }
}

export default ShippingRepository;
