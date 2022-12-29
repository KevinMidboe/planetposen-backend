import Cart from "./Cart";
import CartSession from "./CartSession";
import type ICart from "../interfaces/ICart";
import { IProduct } from "../interfaces/IProduct";

const cartSession = new CartSession();

class InvalidLineItemIdError extends Error {
  statusCode: number;

  constructor() {
    const message = "Fant ikke produktet som ble lagt til";
    super(message);

    this.statusCode = 400;
  }
}

function parseDataAsCartPayload(message: string): ICartPayload {
  let json: ICartPayload = null;

  try {
    json = JSON.parse(message);
  } catch {}

  return json;
}

interface ICartPayload {
  command: string;
  message: string;
  product_no?: number;
  product_sku_no?: number;
  quantity?: number;
  lineitem_id?: number;
}

class WSCart {
  ws: WebSocket;
  planet_id: string | null;
  cart: Cart;
  cartSession: CartSession;

  constructor(ws, planet_id) {
    this.ws = ws;
    this.planet_id = planet_id;
    this.cart = new Cart(planet_id);
    this.cartSession;
  }

  get isAlive() {
    return this.ws.readyState === 1;
  }

  /* emitters */
  message(message: string, success = true) {
    this.ws.send(JSON.stringify({ message, success }));
  }

  async emitCart(cart: any[] | null = null) {
    if (cart === null || cart?.length === 0) {
      cart = await this.cart.get();
    }

    this.ws.send(JSON.stringify({ cart, success: true }));
  }

  /* handle known commands */
  async addCartProduct(payload): Promise<boolean> {
    const { product_no, product_sku_no, quantity } = payload;
    if (!product_no || !quantity) {
      // throw here?
      this.message("Missing product_no or quantity", false);
    }

    await this.cart.add(product_no, product_sku_no, quantity);
    return true;
  }

  async removeCartProduct(lineitem_id: number): Promise<boolean> {
    if (isNaN(lineitem_id)) throw new InvalidLineItemIdError();
    await this.cart.remove(lineitem_id);
    return true;
  }

  async decrementProductInCart(lineitem_id: number): Promise<boolean> {
    if (isNaN(lineitem_id)) throw new InvalidLineItemIdError();
    await this.cart.decrement(lineitem_id);
    return true;
  }

  async incrementProductInCart(lineitem_id: number): Promise<boolean> {
    // TODO validate the quantity trying to be added here ??

    if (isNaN(lineitem_id)) throw new InvalidLineItemIdError();
    await this.cart.increment(lineitem_id);
    return true;
  }

  /* main ws data/message handler */
  async handleMessage(data: Buffer | string, isBinary: boolean) {
    const dataMessage = isBinary ? String(data) : data.toString();
    if (dataMessage === "heartbeat") return;

    const payload = parseDataAsCartPayload(dataMessage);
    const { command } = payload;

    try {
      let emitCart = false;

      if (command === "cart") this.emitCart();
      else if (command === "add") {
        emitCart = await this.addCartProduct(payload);
      } else if (command === "rm") {
        emitCart = await this.removeCartProduct(payload?.lineitem_id);
      } else if (command === "decrement") {
        emitCart = await this.decrementProductInCart(payload?.lineitem_id);
      } else if (command === "increment") {
        emitCart = await this.incrementProductInCart(payload?.lineitem_id);
      } else {
        console.log(`client has sent us other/without command: ${dataMessage}`);
      }

      if (emitCart) {
        this.cartSession.emitChangeToClients(this);
      }
    } catch (error) {
      // ????
      if (error.message) this.message(error?.message, false);
      this.cartSession.emitChangeToClients(this);
    }
  }

  handleError() {}

  destroy() {}
}

export default WSCart;
