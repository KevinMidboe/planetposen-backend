// import type IProduct from './IProduct';
// import type BadgeType from './BadgeType';
import type ICustomer from "./ICustomer";

export interface IStripePayment {
  amount: number;
  currency: string;
}

export interface IOrderSummary {
  created: Date;
  email: string;
  first_name: string;
  last_name: string;
  order_id: string;
  order_sum: number;
  status: string;
}

export interface IOrder {
  customer: ICustomer;
  lineItems: ILineItem[];
  orderid: string;
  shipping: IShipping;
  status: string;
  updated?: Date;
  created?: Date;
}

export interface ILineItem {
  sku_id: number;
  image: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
}

export interface IShipping {
  company: string;
  tracking_code: string;
  tracking_link: string;
  user_notified: null;
}

export interface IOrdersLineitem {
  orders_lineitem_id: string;
  order_id: string;
  product_no: number;
  product_sku_no: number;
  quantity: number;
  created?: Date;
  updated?: Date;
}

export interface ITracking {
  orderId: string;
  trackingCode: string;
  trackingCompany: string;
  trackingLink: string;
}
