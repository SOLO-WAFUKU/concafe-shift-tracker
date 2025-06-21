/**
 * 店舗データ管理フック
 * React Queryを使用した店舗情報の取得と管理
 */

import { useQuery } from '@tanstack/react-query'
// Mock API for demo purposes (replaced @/lib/api)
const storeApi = {
  getAll: async (): Promise<Store[]> => {
    // Mock data for demo
    return [
      {
        id: 'store1',
        name: 'めいどりーみん 秋葉原店',
        area: '秋葉原',
        open_time: '12:00',
        close_time: '22:00',
        url: 'https://www.maidramin.com/',
        is_active: true,
        girls_count: 8,
        last_updated: new Date().toISOString()
      },
      {
        id: 'store2',
        name: '@ほぉ〜むカフェ 本店',
        area: '秋葉原',
        open_time: '11:30',
        close_time: '22:30',
        url: 'https://www.cafe-athome.com/',
        is_active: true,
        girls_count: 12,
        last_updated: new Date().toISOString()
      },
      {
        id: 'store3',
        name: 'Cafe Mai:lish',
        area: '秋葉原',
        open_time: '12:00',
        close_time: '20:00',
        url: 'https://maid-cafe.net/',
        is_active: true,
        girls_count: 6,
        last_updated: new Date().toISOString()
      }
    ]
  },
  getById: async (storeId: string): Promise<Store> => {
    return {
      id: storeId,
      name: 'デモ店舗',
      area: '秋葉原',
      open_time: '12:00',
      close_time: '22:00',
      url: 'https://example.com/',
      is_active: true,
      girls_count: 5,
      last_updated: new Date().toISOString()
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
  
  const areas = Array.from(new Set(stores.map(store => store.area)))
  return areas.sort()
}