/**
 * シフトデータ管理フック
 * React Queryを使用したシフト情報の取得と管理
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
// Mock API for demo purposes (replaced @/lib/api)
const shiftApi = {
  getByDate: async (date: string, storeId?: string) => {
    // Mock data for demo - matching DayShifts interface
    return {
      date,
      total_girls: 6,
      stores: [
        {
          store_id: 'store1',
          store_name: 'めいどりーみん 秋葉原店',
          shifts: [
            {
              id: 1,
              girl_id: 1,
              girl_name: 'みこち',
              girl_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b9997c74?w=400&h=500&fit=crop&crop=face',
              start_time: '18:00',
              end_time: '22:00',
              shift_type: 'normal',
              notes: '',
              store_id: 'store1',
              date
            },
            {
              id: 2,
              girl_id: 2,
              girl_name: 'ぺこら',
              girl_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face',
              start_time: '19:00',
              end_time: '23:00',
              shift_type: 'special',
              notes: '特別シフト',
              store_id: 'store1',
              date
            }
          ]
        },
        {
          store_id: 'store2',
          store_name: '@ほぉ〜むカフェ 本店',
          shifts: [
            {
              id: 3,
              girl_id: 3,
              girl_name: 'あくあ',
              girl_image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face',
              start_time: '17:00',
              end_time: '21:00',
              shift_type: 'normal',
              notes: '',
              store_id: 'store2',
              date
            },
            {
              id: 4,
              girl_id: 4,
              girl_name: 'まりん',
              girl_image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face',
              start_time: '20:00',
              end_time: '24:00',
              shift_type: 'normal',
              notes: '',
              store_id: 'store2',
              date
            }
          ]
        },
        {
          store_id: 'store3',
          store_name: 'Cafe Mai:lish',
          shifts: [
            {
              id: 5,
              girl_id: 5,
              girl_name: 'のえる',
              girl_image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face',
              start_time: '16:00',
              end_time: '20:00',
              shift_type: 'normal',
              notes: '',
              store_id: 'store3',
              date
            },
            {
              id: 6,
              girl_id: 6,
              girl_name: 'ふぶき',
              girl_image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop&crop=face',
              start_time: '21:00',
              end_time: '25:00',
              shift_type: 'special',
              notes: '深夜シフト',
              store_id: 'store3',
              date
            }
          ]
        }
      ]
    }
  },
  getStoreShifts: async (storeId: string, days: number = 7, startDate?: string): Promise<StoreShiftsDetail> => {
    const today = startDate ? new Date(startDate) : new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + days - 1)
    
    // Generate all shifts for the date range
    const allShifts: Shift[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      allShifts.push({
        id: i + 1,
        store_id: storeId,
        girl_id: 1,
        girl_name: 'アリス',
        girl_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b9997c74?w=400&h=500&fit=crop&crop=face',
        date: dateStr,
        start_time: '18:00',
        end_time: '22:00',
        shift_type: 'normal',
        notes: ''
      })
    }
    
    return {
      store: {
        id: storeId,
        name: 'デモ店舗',
        area: '秋葉原',
        open_time: '12:00',
        close_time: '22:00',
        url: 'https://example.com/',
        is_active: true,
        girls_count: 5,
        last_updated: new Date().toISOString()
      },
      shifts: allShifts,
      date_range: {
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        days
      }
    }
  },
  search: async (params: any): Promise<Shift[]> => {
    return [
      {
        id: 1,
        store_id: 'store1',
        girl_id: 1,
        girl_name: '検索結果',
        girl_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face',
        date: '2024-01-15',
        start_time: '18:00',
        end_time: '22:00',
        shift_type: 'normal',
        notes: ''
      }
    ]
  }
}
import type { DayShifts, StoreShiftsDetail, Shift } from '@/types/api'

/**
 * 日別シフト取得フック
 */
export const useDayShifts = (date: string, storeId?: string) => {
  return useQuery<DayShifts, Error>({
    queryKey: ['shifts', 'day', date, storeId],
    queryFn: () => shiftApi.getByDate(date, storeId),
    enabled: !!date,
    staleTime: 2 * 60 * 1000, // 2分間はキャッシュを利用
    gcTime: 5 * 60 * 1000, // 5分間キャッシュを保持
    refetchOnWindowFocus: false,
    retry: 2
  })
}

/**
 * 店舗別シフト取得フック
 */
export const useStoreShifts = (
  storeId: string,
  days: number = 7,
  startDate?: string
) => {
  return useQuery<StoreShiftsDetail, Error>({
    queryKey: ['shifts', 'store', storeId, days, startDate],
    queryFn: () => shiftApi.getStoreShifts(storeId, days, startDate),
    enabled: !!storeId,
    staleTime: 3 * 60 * 1000, // 3分間はキャッシュを利用
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  })
}

/**
 * シフト検索フック
 */
export const useShiftSearch = (searchParams: {
  girl_name?: string
  store_name?: string
  date_from?: string
  date_to?: string
  limit?: number
}) => {
  const hasSearchParams = Object.values(searchParams).some(value => value !== undefined && value !== '')
  
  return useQuery<Shift[], Error>({
    queryKey: ['shifts', 'search', searchParams],
    queryFn: () => shiftApi.search(searchParams),
    enabled: hasSearchParams,
    staleTime: 1 * 60 * 1000, // 1分間はキャッシュを利用
    gcTime: 5 * 60 * 1000,
    retry: 1
  })
}

/**
 * 複数日のシフトを一括取得するフック
 */
export const useMultipleDayShifts = (dates: string[], storeId?: string) => {
  const queryClient = useQueryClient()
  
  // 各日付のクエリを個別に実行
  const queries = dates.map(date => 
    useQuery<DayShifts, Error>({
      queryKey: ['shifts', 'day', date, storeId],
      queryFn: () => shiftApi.getByDate(date, storeId),
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2
    })
  )
  
  // すべてのクエリの結果をまとめる
  const isLoading = queries.some(query => query.isLoading)
  const isError = queries.some(query => query.isError)
  const data = queries.map(query => query.data).filter(Boolean) as DayShifts[]
  const errors = queries.map(query => query.error).filter(Boolean)
  
  return {
    data,
    isLoading,
    isError,
    errors,
    refetch: () => {
      queries.forEach(query => query.refetch())
    }
  }
}

/**
 * シフトデータのプリフェッチヘルパー
 */
export const usePrefetchShifts = () => {
  const queryClient = useQueryClient()
  
  const prefetchDayShifts = (date: string, storeId?: string) => {
    queryClient.prefetchQuery({
      queryKey: ['shifts', 'day', date, storeId],
      queryFn: () => shiftApi.getByDate(date, storeId),
      staleTime: 2 * 60 * 1000
    })
  }
  
  const prefetchStoreShifts = (storeId: string, days: number = 7) => {
    queryClient.prefetchQuery({
      queryKey: ['shifts', 'store', storeId, days],
      queryFn: () => shiftApi.getStoreShifts(storeId, days),
      staleTime: 3 * 60 * 1000
    })
  }
  
  return {
    prefetchDayShifts,
    prefetchStoreShifts
  }
}

/**
 * シフト統計計算ヘルパー
 */
export const useShiftStats = (shifts: Shift[] | undefined) => {
  if (!shifts) {
    return {
      totalShifts: 0,
      uniqueGirls: 0,
      timeSlotDistribution: {},
      storeDistribution: {}
    }
  }
  
  const uniqueGirls = new Set(shifts.map(shift => shift.girl_id)).size
  
  const timeSlotDistribution = shifts.reduce((acc, shift) => {
    const hour = parseInt(shift.start_time.split(':')[0])
    let slot: string
    
    if (hour < 12) {
      slot = '午前'
    } else if (hour < 17) {
      slot = '午後'
    } else {
      slot = '夜間'
    }
    
    acc[slot] = (acc[slot] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const storeDistribution = shifts.reduce((acc, shift) => {
    acc[shift.store_id] = (acc[shift.store_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    totalShifts: shifts.length,
    uniqueGirls,
    timeSlotDistribution,
    storeDistribution
  }
}