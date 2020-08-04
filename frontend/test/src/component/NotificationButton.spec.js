import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { NotificationButton as NotificationWithoutHOC } from '../../../src/component/Header/MenuActionListItem/NotificationButton.jsx'

describe('<NotificationButton />', () => {
  const onClickNotificationSpy = sinon.spy()

  const props = {
    notificationCount: 5,
    onClickNotification: onClickNotificationSpy
  }

  const wrapper = shallow(<NotificationWithoutHOC {...props} t={key => key} />)

  describe('Notification counter', () => {
    describe('when there are 0 notifications', () => {
      before(() => {
        wrapper.setProps({ notificationNotReadCount: 0 })
      })

      it('should not display the notification counter bubble', () => {
        expect(wrapper.find('.notificationButton__count').length).to.equal(0)
      })
    })
    describe('when there are 5 notifications', () => {
      before(() => {
        wrapper.setProps({ notificationNotReadCount: 5 })
      })

      it('should display 5 in the notification counter bubble', () => {
        expect(wrapper.find('.notificationButton__count').text()).to.equal('5')
      })
    })
    describe('when there are more than 99 notifications', () => {
      before(() => {
        wrapper.setProps({ notificationNotReadCount: 100 })
      })

      it('should display 99+ in the notification counter bubble', () => {
        expect(wrapper.find('.notificationButton__count').text()).to.equal('99+')
      })
    })
  })
})
