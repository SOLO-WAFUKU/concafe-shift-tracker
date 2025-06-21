/**
 * 店舗データ管理フック
 * React Queryを使用した店舗情報の取得と管理
 */

import { useQuery } from '@tanstack/react-query'
// Mock API for demo purposes (replaced @/lib/api)
const storeApi = {
  getAll: async () => {
    // Mock data for demo
    return [
      {
        id: 'store1',
        name: 'コンカフェ　ハート',
        area: '東京',
        address: '東京都渋谷区',
        phone: '03-1234-5678',
        is_active: true
      },
      {
        id: 'store2',
        name: 'コンカフェ　スマイル',
        area: '大阪',
        address: '大阪市中央区',
        phone: '06-1234-5678',
        is_active: true
      },
      {
        id: 'store3',
        name: 'コンカフェ　ドリーム',
        area: '神奈川',
        address: '横浜市西区',
        phone: '045-1234-5678',
        is_active: true
      }
    ]
  },
  getById: async (storeId: string) => {
    return {
      id: storeId,
      name: 'デモ店舗',
      area: '東京',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      is_active: true
    }
  }
}
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