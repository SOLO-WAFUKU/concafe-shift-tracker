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
              girl_image_url: '/images/demo-girl-1.jpg',
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
              girl_image_url: '/images/demo-girl-2.jpg',
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
              girl_image_url: '/images/demo-girl-3.jpg',
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
              girl_image_url: '/images/demo-girl-4.jpg',
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
              girl_image_url: '/images/demo-girl-5.jpg',
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
              girl_image_url: '/images/demo-girl-6.jpg',
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
  getStoreShifts: async (storeId: string, days: number = 7, startDate?: string) => {
    return {
      store_id: storeId,
      store_name: 'デモ店舗',
      days_data: Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i)
        return {
          date: date.toISOString().split('T')[0],
          shifts: [
            {
              id: i + 1,
              girl_id: 1,
              girl_name: 'アリス',
              start_time: '18:00',
              end_time: '22:00',
              shift_type: 'normal' as const,
              notes: '',
              store_id: storeId,
              date: date.toISOString().split('T')[0]
            }
          ]
        }
      })
    }
  },
  search: async (params: any) => {
    return [
      {
        id: 1,
        girl_id: 1,
        girl_name: '検索結果',
        start_time: '18:00',
        end_time: '22:00',
        shift_type: 'normal' as const,
        notes: '',
        store_id: 'store1',
        date: '2024-01-15'
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