/**
 * API型定義
 * バックエンドAPIのレスポンス型を定義する
 */

export interface Store {
  id: string
  name: string
  area: string
  open_time: string
  close_time: string
  url: string
  is_active: boolean
  girls_count: number
  last_updated?: string
}

export interface Girl {
  id: number
  name: string
  store_id: string
  image_url?: string
  status: 'active' | 'new' | 'left'
  first_seen: string
  last_seen: string
}

export interface GirlDetail extends Girl {
  recent_shifts: Shift[]
  work_days_count: number
  favorite_time_slots: string[]
}

export interface Shift {
  id: number
  store_id: string
  girl_id: number
  girl_name: string
  girl_image_url?: string
  date: string
  start_time: string
  end_time: string
  shift_type: string
  notes?: string
}

export interface DayShifts {
  date: string
  total_girls: number
  stores: StoreShifts[]
}

export interface StoreShifts {
  store_id: string
  store_name: string
  shifts: Shift[]
}

export interface StoreShiftsDetail {
  store: Store
  shifts: Shift[]
  date_range: {
    start_date: string
    end_date: string
    days: number
  }
}

export interface AdminStats {
  total_stores: number
  total_girls: number
  total_shifts: number
  active_girls: number
  new_girls_today: number
  scraping_status: ScrapingStatus[]
  cloudflare_usage?: CloudflareUsage
}

export interface ScrapingStatus {
  store_id: string
  store_name: string
  status: string
  last_run?: string
  girls_found: number
  shifts_found: number
  error_message?: string
}

export interface CloudflareUsage {
  total_images: number
  storage_used: string
  bandwidth_used: string
  free_tier_limit: string
}

export type ShiftTimeSlot = 'morning' | 'afternoon' | 'evening'

export interface FilterOptions {
  selectedStores: string[]
  selectedDate: string
  searchQuery: string
  statusFilter: Girl['status'] | 'all'
}