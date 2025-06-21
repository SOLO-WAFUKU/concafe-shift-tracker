/**
 * シフトデータ管理フック
 * React Queryを使用したシフト情報の取得と管理
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { shiftApi } from '@/lib/api'
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