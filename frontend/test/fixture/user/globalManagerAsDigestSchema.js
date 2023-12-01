import { globalManagerFromApi } from './globalManagerFromApi.js'
export const globalManagerAsDigestSchemaFromApi = {
  user_id: globalManagerFromApi.user_id,
  has_avatar: globalManagerFromApi.has_avatar,
  has_cover: globalManagerFromApi.has_cover,
  public_name: globalManagerFromApi.public_name,
  username: globalManagerFromApi.username,
  workspace_ids: [1, 2, 5]
}
