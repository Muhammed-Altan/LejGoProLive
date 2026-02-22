export interface ServicePoint {
  id: string
  name: string
  address: {
    street: string
    streetNumber: string
    postalCode: string
    city: string
    countryCode: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  openingHours: any[]
  distance: number
}

export interface FetchServicePointsParams {
  postalCode: string
  city?: string
  streetName?: string
  streetNumber?: string
  countryCode?: string
}

export const usePostNord = () => {
  const servicePoints = ref<ServicePoint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchServicePoints = async (params: FetchServicePointsParams) => {
    const { postalCode, city, streetName, streetNumber, countryCode = 'DK' } = params

    if (!postalCode || !/^\d{4}$/.test(postalCode)) {
      error.value = 'Invalid postal code'
      servicePoints.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const queryParams: Record<string, any> = {
        postalCode,
        countryCode,
        numberOfServicePoints: 10
      }

      // Add optional address parameters
      if (city) queryParams.city = city
      if (streetName) queryParams.streetName = streetName
      if (streetNumber) queryParams.streetNumber = streetNumber

      const response = await $fetch<{ success: boolean; data: ServicePoint[] }>('/api/postnord/service-points', {
        method: 'GET',
        query: queryParams
      })

      if (response.success && Array.isArray(response.data)) {
        servicePoints.value = response.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (e: any) {
      console.error('Error fetching service points:', e)
      error.value = e.data?.statusMessage || e.message || 'Failed to fetch service points'
      servicePoints.value = []
    } finally {
      loading.value = false
    }
  }

  const clearServicePoints = () => {
    servicePoints.value = []
    error.value = null
  }

  return {
    servicePoints: readonly(servicePoints),
    loading: readonly(loading),
    error: readonly(error),
    fetchServicePoints,
    clearServicePoints
  }
}
