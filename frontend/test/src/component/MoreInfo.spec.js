import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import MoreInfo from '../../../src/component/Dashboard/MoreInfo.jsx'
import sinon from 'sinon'

describe('<MoreInfo />', () => {
  const onClickToggleWebdavCallBack = sinon.spy()
  const onClickToggleCalendarCallBack = sinon.spy()

  const props = {
    onClickToggleWebdav: onClickToggleWebdavCallBack,
    onClickToggleCalendar: onClickToggleCalendarCallBack,
    displayWebdavBtn: true,
    displayCalendarBtn: true
  }

  const wrapper = shallow(<MoreInfo {...props} t={key => key} />)

  describe('static design', () => {
    it('should display the calendar information when displayCalendarBtn is true', () =>
      expect(wrapper.find('div.moreinfo__calendar__information').length).to.equal(1)
    )

    it('should not display the calendar information when displayCalendarBtn is false', () => {
      wrapper.setProps({ displayCalendarBtn: false })
      expect(wrapper.find('div.moreinfo__calendar__information').length).to.equal(0)
      wrapper.setProps({ displayCalendarBtn: props.displayCalendarBtn })
    })

    it('should display the webDav information when displayWebdavBtn is true', () =>
      expect(wrapper.find('div.moreinfo__webdav__information').length).to.equal(1)
    )

    it('should not display the webDav information when displayWebdavBtn is false', () => {
      wrapper.setProps({ displayWebdavBtn: false })
      expect(wrapper.find('div.moreinfo__webdav__information').length).to.equal(0)
      wrapper.setProps({ displayWebdavBtn: props.displayWebdavBtn })
    })
  })

  describe('handlers', () => {
    it('onClickToggleWebdav should be called when webdav btn is clicked', () => {
      wrapper.find('div.moreinfo__webdav__btn').simulate('click')
      expect(onClickToggleWebdavCallBack.called).to.equal(true)
    })

    it('onClickToggleCalendar should be called when calendar btn is clicked', () => {
      wrapper.find('div.moreinfo__calendar__btn').simulate('click')
      expect(onClickToggleCalendarCallBack.called).to.equal(true)
    })
  })
})
