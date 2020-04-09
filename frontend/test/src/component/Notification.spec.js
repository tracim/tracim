import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { Notification as NotificationWithoutHOC } from '../../../src/component/Account/Notification.jsx'

describe('<Notification />', () => {
  const onChangeSubscriptionNotifCallBack = sinon.spy()

  const props = {
    userLoggedId: 0,
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

  const wrapper = shallow(<NotificationWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it(`should display ${props.workspaceList.length} workspace`, () => {
      expect(wrapper.find('div.notification__table__role').length).to.equal(props.workspaceList.length)
    })

    it(`should display labels of workspaces`, () => {
      for (let i = 0; i < props.workspaceList.length; i++) {
        expect(wrapper.find('div.notification__table__wksname').at(i)).to.text().equal(props.workspaceList[i].label)
      }
    })
  })
})
