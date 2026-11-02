export type GarmentType = 'tee' | 'hoodie' | 'jacket' | 'dress' | 'pants' | 'shorts'

export type CategoryId = 'tops' | 'outerwear' | 'dresses' | 'bottoms'

/** Which part of the body a garment covers — used to place the fitting-room overlay. */
export type FitZone = 'top' | 'bottom' | 'full'

export interface ColorOption {
  name: string
  hex: string
}

export interface Product {
  id: string
  name: string
  price: number
  category: CategoryId
  garment: GarmentType
  fitZone: FitZone
  colors: ColorOption[]
  sizes: string[]
  description: string
  details: string[]
  badge?: 'New' | 'Bestseller' | 'Limited'
  rating: number
  reviews: number
}

export interface CartItem {
  productId: string
  size: string
  color: string
  qty: number
}
