export type OrderStatus = 'received' | 'in_progress' | 'ready' | 'picked_up'
export type ItemStatus = 'pending' | 'in_progress' | 'done'

export type OrderItem = {
  id: string
  order_id: string
  alteration_type: string
  barcode_id: string
  status: ItemStatus
  due_date: string
  completed_at: string | null
  created_at: string
}

export type Order = {
  id: string
  shopify_order_id: string | null
  shopify_order_number: string | null
  customer_name: string
  customer_phone: string
  status: OrderStatus
  tracking_token: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export type Notification = {
  id: string
  order_id: string
  message: string
  sent_to_phone: string
  sent_by: string
  sent_at: string
}