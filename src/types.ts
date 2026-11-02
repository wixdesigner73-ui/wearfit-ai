export type Gender = 'men' | 'women'

export type CategoryName =
  | 'T-Shirts'
  | 'Polos'
  | 'Shirts'
  | 'Hoodies & Sweatshirts'
  | 'Jeans'
  | 'Trousers'
  | 'Jackets'
  | 'Tops'
  | 'Dresses'
  | 'Kurtis'
  | 'Co-ord Sets'
  | 'Casual Wear'

/** Garment categories understood by FASHN VTON v1.5. */
export type TryOnCategory = 'tops' | 'bottoms' | 'one-pieces'

/** What the garment image shows: a garment alone/hanging, or a person wearing it. */
export type GarmentPhotoType = 'flat-lay' | 'model'

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface ColorOption {
  name: string
  hex: string
  /** True only for the colour actually shown in the product photograph. */
  pictured?: boolean
}

export interface Product {
  id: string
  name: string
  gender: Gender
  category: CategoryName
  /** Specific product type, e.g. "Oversized T-shirt". */
  productType: string
  /** Base price in USD; displayed via config (currency is configurable). */
  price: number
  description: string
  details: string[]
  sizes: string[]
  colors: ColorOption[]
  stock: StockStatus
  /** Sizes that are sold out even if the product is in stock. */
  soldOutSizes?: string[]
  badge?: 'New' | 'Bestseller' | 'Limited'
  /** Listing photograph (4:5), path relative to /public. */
  image: string
  /** Garment photograph used as AI input (original framing), path relative to /public. */
  garmentImage: string
  garmentPhotoType: GarmentPhotoType
  tryOnCategory: TryOnCategory
  /** Pexels photo id — used for the credits list. */
  pexelsId: number
}

export interface CartItem {
  productId: string
  size: string
  color: string
  qty: number
}
