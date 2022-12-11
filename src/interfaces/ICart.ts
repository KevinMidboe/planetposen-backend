export default interface ICart {
  client_id: string;
  cart_id: number;
  lineitem_id: number;
  quantity: number;
  sku_id: number;
  size: string;
  price: number;
  product_no: number;
  name: string;
  description: string;
  subtext: string;
  image: string;
  primary_color: string;
}
