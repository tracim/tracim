import { expect } from 'chai'
import {
  sortContentList,
  findUserRoleIdInWorkspace,
  getUserProfile
} from '../../src/util/helper.js'
import {
  ROLE,
  ROLE_LIST,
  PROFILE
} from 'tracim_frontend_lib'

describe('In file helper.js', () => {
  describe('Function sortContentList()', () => {
    it('should sort the array of content by folder and file, and then naturally', () => {
      // INFO - CH - 2019-08-08 - on the list bellow, contents only have the properties that matter for the sort

      const contentList = [
        { id: 1, label: 'content 0', type: 'html-document' },
        { id: 2, label: 'content 0', type: 'folder' },
        { id: 3, label: 'content 1', type: 'html-document' },
        { id: 4, label: 'content 1', type: 'folder' },
        { id: 21, label: 'content 10', type: 'html-document' },
        { id: 22, label: 'content 10', type: 'folder' },
        { id: 23, label: 'content 11', type: 'file' },
        { id: 24, label: 'content 11', type: 'folder' },
        { id: 25, label: 'content 12', type: 'html-document' },
        { id: 26, label: 'content 12', type: 'folder' },
        { id: 27, label: 'content 13', type: 'html-document' },
        { id: 28, label: 'content 13', type: 'folder' },
        { id: 29, label: 'content 14', type: 'thread' },
        { id: 30, label: 'content 14', type: 'folder' },
        { id: 31, label: 'content 15', type: 'html-document' },
        { id: 32, label: 'content 15', type: 'folder' },
        { id: 33, label: 'content 16', type: 'thread' },
        { id: 34, label: 'content 16', type: 'folder' },
        { id: 35, label: 'content 17', type: 'html-document' },
        { id: 36, label: 'content 17', type: 'folder' },
        { id: 37, label: 'content 18', type: 'html-document' },
        { id: 38, label: 'content 18', type: 'folder' },
        { id: 39, label: 'content 19', type: 'html-document' },
        { id: 40, label: 'content 19', type: 'folder' },
        { id: 5, label: 'content 2', type: 'file' },
        { id: 6, label: 'content 2', type: 'folder' },
        { id: 41, label: 'content 20', type: 'html-document' },
        { id: 42, label: 'content 20', type: 'folder' },
        { id: 7, label: 'content 3', type: 'html-document' },
        { id: 8, label: 'content 3', type: 'folder' },
        { id: 9, label: 'content 4', type: 'html-document' },
        { id: 10, label: 'content 4', type: 'folder' },
        { id: 11, label: 'content 5', type: 'file' },
        { id: 12, label: 'content 5', type: 'folder' },
        { id: 13, label: 'content 6', type: 'html-document' },
        { id: 14, label: 'content 6', type: 'folder' },
        { id: 15, label: 'content 7', type: 'file' },
        { id: 16, label: 'content 7', type: 'folder' },
        { id: 17, label: 'content 8', type: 'thread' },
        { id: 18, label: 'content 8', type: 'folder' },
        { id: 19, label: 'content 9', type: 'html-document' },
        { id: 36, label: 'content 9b', type: 'html-document' },
        { id: 43, label: 'content 9a', type: 'html-document' },
        { id: 20, label: 'content 9', type: 'folder' }
      ]

      const contentListSortedByFolderAndNaturally = [
        { id: 2, label: 'content 0', type: 'folder' },
        { id: 4, label: 'content 1', type: 'folder' },
        { id: 6, label: 'content 2', type: 'folder' },
        { id: 8, label: 'content 3', type: 'folder' },
        { id: 10, label: 'content 4', type: 'folder' },
        { id: 12, label: 'content 5', type: 'folder' },
        { id: 14, label: 'content 6', type: 'folder' },
        { id: 16, label: 'content 7', type: 'folder' },
        { id: 18, label: 'content 8', type: 'folder' },
        { id: 20, label: 'content 9', type: 'folder' },
        { id: 22, label: 'content 10', type: 'folder' },
        { id: 24, label: 'content 11', type: 'folder' },
        { id: 26, label: 'content 12', type: 'folder' },
        { id: 28, label: 'content 13', type: 'folder' },
        { id: 30, label: 'content 14', type: 'folder' },
        { id: 32, label: 'content 15', type: 'folder' },
        { id: 34, label: 'content 16', type: 'folder' },
        { id: 36, label: 'content 17', type: 'folder' },
        { id: 38, label: 'content 18', type: 'folder' },
        { id: 40, label: 'content 19', type: 'folder' },
        { id: 42, label: 'content 20', type: 'folder' },
        { id: 1, label: 'content 0', type: 'html-document' },
        { id: 3, label: 'content 1', type: 'html-document' },
        { id: 5, label: 'content 2', type: 'file' },
        { id: 7, label: 'content 3', type: 'html-document' },
        { id: 9, label: 'content 4', type: 'html-document' },
        { id: 11, label: 'content 5', type: 'file' },
        { id: 13, label: 'content 6', type: 'html-document' },
        { id: 15, label: 'content 7', type: 'file' },
        { id: 17, label: 'content 8', type: 'thread' },
        { id: 19, label: 'content 9', type: 'html-document' },
        { id: 43, label: 'content 9a', type: 'html-document' },
        { id: 36, label: 'content 9b', type: 'html-document' },
        { id: 21, label: 'content 10', type: 'html-document' },
        { id: 23, label: 'content 11', type: 'file' },
        { id: 25, label: 'content 12', type: 'html-document' },
        { id: 27, label: 'content 13', type: 'html-document' },
        { id: 29, label: 'content 14', type: 'thread' },
        { id: 31, label: 'content 15', type: 'html-document' },
        { id: 33, label: 'content 16', type: 'thread' },
        { id: 35, label: 'content 17', type: 'html-document' },
        { id: 37, label: 'content 18', type: 'html-document' },
        { id: 39, label: 'content 19', type: 'html-document' },
        { id: 41, label: 'content 20', type: 'html-document' }
      ]

      sortContentList(contentList, 'en')
      expect(contentList).to.deep.equal(contentListSortedByFolderAndNaturally)
    })
  })

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
