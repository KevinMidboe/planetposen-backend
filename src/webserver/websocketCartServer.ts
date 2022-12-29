import cookie from "cookie";
import { WebSocketServer, Websocket, Request } from "ws";
import WSCart from "../cart/WSCart";
import CartSession from "../cart/CartSession";
import generateUUID from "../utils/generateUUID";

function getCookieValue(cookieString: string, key: string): string | null {
  const cookies = cookie.parse(cookieString || "");
  return cookies[key] || null;
}

function getHeaderValue(url: string, key: string) {
  const urlSegments = url.split("?");
  if (urlSegments?.length < 2) return;

  const query = new URLSearchParams(urlSegments[1]);
  return query.get(key);
}

function setupCartWebsocketServer(server) {
  const WS_OPTIONS = { server };
  const wss = new WebSocketServer(WS_OPTIONS);

  const cartSession = new CartSession();
  // setInterval(() => cartSession.listCarts(), 3000);
  setInterval(() => cartSession.removeIfNotAlive(), 1000);

  wss.on("connection", (ws: Websocket, req: Request) => {
    const sessionId = generateUUID();
    const planet_id =
      getCookieValue(req.headers.cookie, "planet_id") ||
      getHeaderValue(req.url, "planet_id");

    if (planet_id === null) return;

    const wsCart = new WSCart(ws, planet_id);
    wsCart.cartSession = cartSession;
    cartSession.add(sessionId, wsCart);

    ws.on("message", (data, isBinary) => wsCart.handleMessage(data, isBinary));

    ws.on("close", () => {
      cartSession.remove(sessionId);
      console.log("the client has closed the connection");
    });

    ws.onerror = function (error) {
      console.log("unexpected ws error occured:", error);
    };
  });

  console.log("Booted websocket cart");
}

export { setupCartWebsocketServer };
