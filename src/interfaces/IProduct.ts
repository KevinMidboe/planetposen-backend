export interface IProduct {
  product_no: number;
  name: string;
  subtext?: string;
  description?: string;
  image?: string;
  variation_count?: string;
  sum_stock?: number;
  updated?: Date;
  created?: Date;
}

export interface IProductSku {
  sku_id: number;
  price: number;
  size: number;
  stock: number;
  default_price: boolean;
  updated?: Date;
  created?: Date;
}

export interface IProductWithSkus extends IProduct {
  variations: IProductSku[] | number;
}
