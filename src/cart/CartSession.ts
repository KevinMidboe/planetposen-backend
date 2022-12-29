import type WSCart from "./WSCart";

let coldLog = 0;

interface IGlobalCart {
  sessionId: string;
  wsCart: WSCart;
}

class CartSession {
  carts: Array<IGlobalCart>;

  constructor() {
    this.carts = [];
  }

  getWSCartByplanet_id(planet_id: string): WSCart {
    const match = this.carts.find(
      (cart) => cart.wsCart?.planet_id === planet_id
    );
    if (!match) return null;
    return match?.wsCart;
  }

  add(sessionId: string, cart: WSCart) {
    console.log(
      `adding session ${sessionId} with cart id: ${cart?.cart?.planet_id}`
    );
    this.carts.push({ wsCart: cart, sessionId });
  }

  remove(sessionId) {
    console.log(`removing session ${sessionId}`);
    this.carts = this.carts.filter((cart) => cart.sessionId !== sessionId);
  }

  removeIfNotAlive() {
    this.carts.forEach((cart) => {
      if (cart.wsCart.isAlive) return;
      this.remove(cart);
    });
  }

  async emitChangeToClients(wsCart: WSCart) {
    const { planet_id } = wsCart;

    const matchingCarts = this.carts.filter(
      (cart) => cart.wsCart.planet_id === planet_id
    );
    console.log(
      `emit change to all carts with id ${planet_id}:`,
      matchingCarts.length
    );

    const cart = await matchingCarts[0]?.wsCart.cart.get();
    matchingCarts.forEach((_cart) => _cart.wsCart.emitCart(cart));
  }

  listCarts() {
    if (this.carts.length === 0) {
      if (coldLog < 4) {
        console.log("No clients");
        coldLog = coldLog + 1;
      }

      return;
    }

    console.log(`Active clients: (${this.carts.length})`);
    this.carts.forEach((cart: IGlobalCart) => {
      console.table({
        isAlive: cart.wsCart?.isAlive,
        planet_id: cart.wsCart?.planet_id,
        sessionId: cart?.sessionId,
        hasCart: cart.wsCart?.cart !== null,
      });
    });

    coldLog = 0;
  }
}

export default CartSession;
