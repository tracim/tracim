import { serializeUser } from '../../../../src/reducer/user.js'
import { globalManagerFromApi } from '../../../fixture/user/globalManagerFromApi.js'

export const userFromApi = globalManagerFromApi
export const user = serializeUser(globalManagerFromApi)
