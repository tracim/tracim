import { expect } from 'chai'
import {
  findUserRoleIdInWorkspace,
  getUserProfile
} from '../../src/util/helper.js'
import {
  ROLE,
  ROLE_LIST,
  PROFILE
} from 'tracim_frontend_lib'

describe('In file helper.js', () => {
  describe('the function findUserRoleIdInWorkspace()', () => {
    const memberList = [{
      id: 0,
      role: 'reader'
    }, {
      id: 1,
      role: 'contributor'
    }, {
      id: 2,
      role: 'content-manager'
    }, {
      id: 3,
      role: 'workspace-manager'
    }]

    it('the function should return the correct reader id', () => {
      const roleId = findUserRoleIdInWorkspace(0, memberList, ROLE_LIST)
      expect(roleId).to.equal(ROLE.reader.id)
    })

    it('the function should return the correct contributor id', () => {
      const roleId = findUserRoleIdInWorkspace(1, memberList, ROLE_LIST)
      expect(roleId).to.equal(ROLE.contributor.id)
    })

    it('the function should return the correct content-manager id', () => {
      const roleId = findUserRoleIdInWorkspace(2, memberList, ROLE_LIST)
      expect(roleId).to.equal(ROLE.contentManager.id)
    })

    it('the function should return the correct workspace-manager id', () => {
      const roleId = findUserRoleIdInWorkspace(3, memberList, ROLE_LIST)
      expect(roleId).to.equal(ROLE.workspaceManager.id)
    })

    it('the function should return the correct reader id when the user is not in memberList', () => {
      const roleId = findUserRoleIdInWorkspace(4, memberList, ROLE_LIST)
      expect(roleId).to.equal(ROLE.reader.id)
    })
  })

  describe('the getUserProfile() function', () => {
    it('should return the proper profile when the slug is "administrators"', () => {
      expect(getUserProfile('administrators')).to.eql(PROFILE.administrator)
    })

    it('should return the proper profile when the slug is "trusted-users"', () => {
      expect(getUserProfile('trusted-users')).to.eql(PROFILE.manager)
    })

    it('should return the proper profile when the slug is "users"', () => {
      expect(getUserProfile('users')).to.eql(PROFILE.user)
    })

    it('should return an empty object when the slug is empty', () => {
      expect(getUserProfile()).to.eql({})
    })
  })
})
