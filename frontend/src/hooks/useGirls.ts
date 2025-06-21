/**
 * 嬢データ管理フック
 * React Queryを使用した嬢情報の取得と管理
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
// Mock API for demo purposes (replaced @/lib/api)
const girlApi = {
  getAll: async (params?: any): Promise<Girl[]> => {
    // Mock data for demo
    return [
      {
        id: 1,
        name: 'アリス',
        image_url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#ff69b4"/><circle cx="200" cy="150" r="80" fill="#ffffff" opacity="0.8"/><text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">アリス</text></svg>`),
        status: 'active' as const,
        store_id: 'store1',
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      },
      {
        id: 2,
        name: 'ベル',
        image_url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#9370db"/><circle cx="200" cy="150" r="80" fill="#ffffff" opacity="0.8"/><text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">ベル</text></svg>`),
        status: 'new' as const,
        store_id: 'store1',
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      },
      {
        id: 3,
        name: 'シンデレラ',
        image_url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#ff1493"/><circle cx="200" cy="150" r="80" fill="#ffffff" opacity="0.8"/><text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">シンデレラ</text></svg>`),
        status: 'active' as const,
        store_id: 'store2',
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }
    ]
  },
  getDetail: async (girlId: number): Promise<GirlDetail> => {
    return {
      id: girlId,
      name: 'デモ嬢',
      image_url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#00bfff"/><circle cx="200" cy="150" r="80" fill="#ffffff" opacity="0.8"/><text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">デモ嬢</text></svg>`),
      status: 'active' as const,
      store_id: 'store1',
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      work_days_count: 15,
      favorite_time_slots: ['夜間', '午後'],
      recent_shifts: [
        { 
          id: 1, 
          store_id: 'store1',
          girl_id: girlId,
          girl_name: 'デモ嬢',
          date: '2024-01-15', 
          start_time: '18:00', 
          end_time: '22:00',
          shift_type: 'normal'
        },
        { 
          id: 2, 
          store_id: 'store1',
          girl_id: girlId,
          girl_name: 'デモ嬢',
          date: '2024-01-14', 
          start_time: '19:00', 
          end_time: '23:00',
          shift_type: 'normal'
        }
      ]
    }
  },
  search: async (params: any): Promise<Girl[]> => {
    // Return filtered mock data
    return [
      {
        id: 1,
        name: '検索結果',
        image_url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#32cd32"/><circle cx="200" cy="150" r="80" fill="#ffffff" opacity="0.8"/><text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">検索結果</text></svg>`),
        status: 'active' as const,
        store_id: 'store1',
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }
    ]
  },
  getNewToday: async (): Promise<Girl[]> => {
    return [
      {
        id: 4,
        name: '新人ちゃん',
        image_url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#ffa500"/><circle cx="200" cy="150" r="80" fill="#ffffff" opacity="0.8"/><text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">新人ちゃん</text></svg>`),
        status: 'new' as const,
        store_id: 'store1',
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }
    ]
  }
}
import type { Girl, GirlDetail } from '@/types/api'

/**
 * 嬢一覧取得フック
 */
export const useGirls = (params?: {
  store_id?: string
  status?: string
  limit?: number
  offset?: number
}) => {
  return useQuery<Girl[], Error>({
    queryKey: ['girls', params],
    queryFn: () => girlApi.getAll(params),
    staleTime: 3 * 60 * 1000, // 3分間はキャッシュを利用
    gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
    refetchOnWindowFocus: false,
    retry: 2
  })
}

/**
 * 嬢詳細取得フック
 */
export const useGirlDetail = (girlId: number) => {
  return useQuery<GirlDetail, Error>({
    queryKey: ['girl', 'detail', girlId],
    queryFn: () => girlApi.getDetail(girlId),
    enabled: !!girlId && girlId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2
  })
}

/**
 * 嬢検索フック
 */
export const useGirlSearch = (searchParams: {
  name?: string
  store_id?: string
  status?: string
  limit?: number
}) => {
  const hasSearchParams = searchParams.name || searchParams.store_id || searchParams.status
  
  return useQuery<Girl[], Error>({
    queryKey: ['girls', 'search', searchParams],
    queryFn: () => girlApi.search(searchParams),
    enabled: !!hasSearchParams,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1
  })
}

/**
 * 本日新規嬢取得フック
 */
export const useNewGirlsToday = () => {
  return useQuery<Girl[], Error>({
    queryKey: ['girls', 'new-today'],
    queryFn: girlApi.getNewToday,
    staleTime: 30 * 60 * 1000, // 30分間はキャッシュを利用
    gcTime: 60 * 60 * 1000, // 1時間キャッシュを保持
    refetchInterval: 5 * 60 * 1000, // 5分ごとに自動更新
    retry: 2
  })
}

/**
 * 無限スクロール用嬢一覧取得フック
 */
export const useInfiniteGirls = (params: {
  store_id?: string
  status?: string
  limit?: number
}) => {
  const limit = params.limit || 20
  
  return useInfiniteQuery({
    queryKey: ['girls', 'infinite', params],
    queryFn: async ({ pageParam = 0 }) => {
      const girls = await girlApi.getAll({
        ...params,
        limit,
        offset: pageParam * limit
      })
      
      return {
        girls,
        nextOffset: girls.length === limit ? pageParam + 1 : undefined
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

/**
 * 嬢フィルタリング用ヘルパー
 */
export const useFilteredGirls = (
  girls: Girl[] | undefined,
  filters: {
    searchQuery?: string
    storeId?: string
    status?: 'active' | 'new' | 'left' | 'all'
  }
) => {
  if (!girls) return []
  
  return girls.filter(girl => {
    const matchesSearch = !filters.searchQuery || 
      girl.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
    
    const matchesStore = !filters.storeId || girl.store_id === filters.storeId
    
    const matchesStatus = !filters.status || 
      filters.status === 'all' || 
      girl.status === filters.status
    
    return matchesSearch && matchesStore && matchesStatus
  })
}

/**
 * 嬢統計計算ヘルパー
 */
export const useGirlStats = (girls: Girl[] | undefined) => {
  if (!girls) {
    return {
      total: 0,
      active: 0,
      new: 0,
      left: 0,
      storeDistribution: {}
    }
  }
  
  const stats = girls.reduce((acc, girl) => {
    acc.total++
    acc[girl.status]++
    
    if (!acc.storeDistribution[girl.store_id]) {
      acc.storeDistribution[girl.store_id] = 0
    }
    acc.storeDistribution[girl.store_id]++
    
    return acc
  }, {
    total: 0,
    active: 0,
    new: 0,
    left: 0,
    storeDistribution: {} as Record<string, number>
  })
  
  return stats
}

/**
 * 最近見た嬢の履歴管理フック
 */
export const useRecentlyViewedGirls = () => {
  const STORAGE_KEY = 'recentlyViewedGirls'
  const MAX_ITEMS = 10
  
  const getRecentlyViewed = (): number[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }
  
  const addToRecentlyViewed = (girlId: number) => {
    if (typeof window === 'undefined') return
    
    try {
      const current = getRecentlyViewed()
      const filtered = current.filter(id => id !== girlId)
      const updated = [girlId, ...filtered].slice(0, MAX_ITEMS)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }
  
  const clearRecentlyViewed = () => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }
  
  return {
    recentlyViewedIds: getRecentlyViewed(),
    addToRecentlyViewed,
    clearRecentlyViewed
  }
}