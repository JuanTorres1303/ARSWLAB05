import apiClient from './apiClient.js'
import apiMock from './apimock.js'

const blueprintsService = import.meta.env.VITE_USE_MOCK === 'true' ? apiMock : apiClient

export default blueprintsService
