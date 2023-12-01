import { expect } from 'chai'
import knownMemberReducer from '../../../src/reducer/knownMemberList.js'
import {
  addWorkspaceMember, removeWorkspaceMember,
  // ADD_WORKSPACE_MEMBER,
  // REMOVE_WORKSPACE_MEMBER,
  // SET_KNOWN_MEMBER_LIST,
  setKnownMemberList
  // UPDATE_USER
} from '../../../src/action-creator.sync'
import { globalManagerAsDigestSchemaFromApi } from '../../fixture/user/globalManagerAsDigestSchema'
// import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi'
import { globalManagerWorkspaceSettingFromApi } from '../../fixture/workspaceSetting/globalManagerWorkspaceSetting'
describe('reducer knownMemberList.js', () => {
  it('should return the default state', () => {
    expect(knownMemberReducer([{ something: 1 }], {})).to.deep.equal([{ something: 1 }])
  })

  it('should handle SET_KNOWN_MEMBER_LIST action', () => {
    const fakeAction = setKnownMemberList([globalManagerAsDigestSchemaFromApi])
    expect(knownMemberReducer([], fakeAction)).to.deep.equal([{
      username: globalManagerAsDigestSchemaFromApi.username,
      hasCover: globalManagerAsDigestSchemaFromApi.has_cover,
      userId: globalManagerAsDigestSchemaFromApi.user_id,
      publicName: globalManagerAsDigestSchemaFromApi.public_name,
      hasAvatar: globalManagerAsDigestSchemaFromApi.has_avatar,
      spaceList: globalManagerAsDigestSchemaFromApi.workspace_ids
    }])
  })

  // INFO - CH - 2023-11-23 - Skipping tests bellow until refactor for member and workspace setting
  // naming is done
  it.skip('should handle ADD_WORKSPACE_MEMBER action', () => {
    const fakeAction = addWorkspaceMember(
      globalManagerAsDigestSchemaFromApi, 1, globalManagerWorkspaceSettingFromApi
    )
    console.log('fakeAction')
    console.log(fakeAction)
    expect(knownMemberReducer([], fakeAction)).to.deep.equal([{
      username: globalManagerAsDigestSchemaFromApi.username,
      hasCover: globalManagerAsDigestSchemaFromApi.has_cover,
      userId: globalManagerAsDigestSchemaFromApi.user_id,
      publicName: globalManagerAsDigestSchemaFromApi.public_name,
      hasAvatar: globalManagerAsDigestSchemaFromApi.has_avatar,
      spaceList: [1]
    }])
  })

  it.skip('should handle REMOVE_WORKSPACE_MEMBER action', () => {
    const fakeAction = removeWorkspaceMember(1, 1)
    expect(knownMemberReducer([globalManagerAsDigestSchemaFromApi], fakeAction)).to.deep.equal([])
  })

  it.skip('should handle UPDATE_USER action', () => {

  })
})
