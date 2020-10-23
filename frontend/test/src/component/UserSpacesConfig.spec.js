import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { UserSpacesConfig as UserSpacesConfigWithoutHOC } from '../../../src/component/Account/UserSpacesConfig.jsx'

describe('<UserSpacesConfig />', () => {
  const onChangeSubscriptionNotifCallBack = sinon.spy()

  const props = {
    userToEditId: 0,
    workspaceList: [{
      memberList: [{
        id: 0,
        role: 'content-manager',
        doNotify: true
      }],
      id: 1,
      label: 'randomLabel1'
    }, {
      memberList: [{
        id: 1,
        role: 'workspace-manager',
        doNotify: true
      }, {
        id: 0,
        role: 'content-manager',
        doNotify: true
      }],
      id: 2,
      label: 'randomLabel2'
    }],
    onChangeSubscriptionNotif: onChangeSubscriptionNotifCallBack
  }

  const wrapper = shallow(<UserSpacesConfigWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it(`should display ${props.workspaceList.length} space`, () => {
      expect(wrapper.find('div.spaceconfig__table__role').length).to.equal(props.workspaceList.length)
    })

    it('should display labels of spaces', () => {
      for (let i = 0; i < props.workspaceList.length; i++) {
        expect(wrapper.find('div.spaceconfig__table__spacename').at(i)).to.text().equal(props.workspaceList[i].label)
      }
    })
  })
})
