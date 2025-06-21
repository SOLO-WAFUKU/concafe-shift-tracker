/**
 * 店舗データ管理フック
 * React Queryを使用した店舗情報の取得と管理
 */

import { useQuery } from '@tanstack/react-query'
import { storeApi } from '@/lib/api'
import type { Store } from '@/types/api'

/**
 * 全店舗取得フック
 */
export const useStores = () => {
  return useQuery<Store[], Error>({
    queryKey: ['stores'],
    queryFn: storeApi.getAll,
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを利用
    gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

/**
 * 特定店舗取得フック
 */
export const useStore = (storeId: string) => {
  return useQuery<Store, Error>({
    queryKey: ['store', storeId],
    queryFn: () => storeApi.getById(storeId),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2
  })
}

/**
 * 店舗フィルタリング用ヘルパー
 */
export const useFilteredStores = (
  stores: Store[] | undefined,
  searchQuery?: string,
  area?: string
) => {
  if (!stores) return []
  
  return stores.filter(store => {
    const matchesSearch = !searchQuery || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesArea = !area || store.area === area
    
    return matchesSearch && matchesArea && store.is_active
  })
}

/**
 * エリア一覧取得ヘルパー
 */
export const useStoreAreas = (stores: Store[] | undefined) => {
  if (!stores) return []
  
  const areas = [...new Set(stores.map(store => store.area))]
  return areas.sort()
}