import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { MoreInfo as MoreInfoWithoutHOC } from '../../src/component/Dashboard/MoreInfo'
import sinon from 'sinon'
import {translateMock} from "../hocMock/translate";

describe('<MoreInfo />', () => {
  const onClickToggleWebdavCallBack = sinon.stub()
  const onClickToggleCalendarCallBack = sinon.stub()

  const props = {
    onClickToggleWebdav: onClickToggleWebdavCallBack,
    onClickToggleCalendar: onClickToggleCalendarCallBack,
    displayWebdavBtn: true,
    displayCalendarBtn: true
  }

  const ComponentWithHoc = translateMock()(MoreInfoWithoutHOC)

  const wrapper = mount(<ComponentWithHoc { ...props } />)

  describe('static design', () => {
    it(`should display the calendar information when displayCalendarBtn is true`, () =>
      expect(wrapper.find(`div.moreinfo__calendar__information`).length).to.equal(1)
    )

    it(`should not display the calendar information when displayCalendarBtn is false`, () => {
      wrapper.setProps({ displayCalendarBtn: false })
      expect(wrapper.find(`div.moreinfo__calendar__information`).length).to.equal(0)
      wrapper.setProps({ displayCalendarBtn: props.displayCalendarBtn })
    })

    it(`should display the webDav information when displayWebdavBtn is true`, () =>
      expect(wrapper.find(`div.moreinfo__webdav__information`).length).to.equal(1)
    )

    it(`should not display the webDav information when displayWebdavBtn is false`, () => {
      wrapper.setProps({ displayWebdavBtn: false })
      expect(wrapper.find(`div.moreinfo__webdav__information`).length).to.equal(0)
      wrapper.setProps({ displayWebdavBtn: props.displayWebdavBtn })
    })
  })

  describe('handlers', () => {
    it(`onClickToggleWebdav should be called when webdav btn is clicked`, () => {
      wrapper.find('div.moreinfo__webdav__btn').simulate('click')
      expect(onClickToggleWebdavCallBack.called).to.equal(true)
    })

    it(`onClickToggleCalendar should be called when calendar btn is clicked`, () => {
      wrapper.find('div.moreinfo__calendar__btn').simulate('click')
      expect(onClickToggleCalendarCallBack.called).to.equal(true)
    })
  })
})
