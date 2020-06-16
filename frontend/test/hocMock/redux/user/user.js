import { serializeUserProps } from '../../../../src/reducer/user.js'
import { globalManagerFromApi } from '../../../fixture/user/globalManagerFromApi.js'
import { serialize } from 'tracim_frontend_lib'

export const userFromApi = globalManagerFromApi
export const user = serialize(globalManagerFromApi, serializeUserProps)
