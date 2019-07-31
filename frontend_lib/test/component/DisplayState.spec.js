import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import DisplayState from '../../src/component/DisplayState/DisplayState.jsx'
import PropTypes from "prop-types";
require('../../src/component/DisplayState/DisplayState.styl')

describe('<DisplayState />', () => {
  describe('<DisplayState /> with btnType="button"', () => {
    const props = {
      msg: 'randomMessage',
      btnType: 'button',
      icon: 'randomIcon',
      btnLabel: 'randomBtnLabel',
      onClickBtn: () => {}
    }

    const wrapper = shallow(
      <DisplayState
        msg={props.msg}
        btnType={props.btnType}
        icon={props.icon}
        btnLabel={props.btnLabel}
        onClickBtn={props.onClickBtn}
      />
    )

    it(`should display "${props.msg}"`, () =>
      expect(wrapper.find('.displaystate__msg')).to.have.text().equal(props.msg)
    )

    it(`should display the button"`, () =>
      expect(wrapper.find(`.displaystate__btn`)).to.have.lengthOf(1)
    )

    it(`should have the good onClick function`, () =>
      expect(wrapper.find(`.displaystate__btn`).prop('onClick')).to.have.equal(props.onClickBtn)
    )

    it(`should display 2 icon "${props.icon}"`, () =>
      expect(wrapper.find(`.fa-${props.icon}`)).to.have.lengthOf(2)
    )

    it(`should display "${props.btnLabel}"`, () =>
      expect(wrapper.find('.displaystate__btn')).to.have.text().equal(props.btnLabel)
    )
  })
  describe('<DisplayState /> with btnType="link"', () => {
    const props = {
      msg: 'randomMessage',
      btnType: 'link',
      icon: 'randomIcon',
      btnLabel: 'randomBtnLabel',
      onClickBtn: () => {}
    }

    const wrapper = shallow(
      <DisplayState
        msg={props.msg}
        btnType={props.btnType}
        icon={props.icon}
        btnLabel={props.btnLabel}
        onClickBtn={props.onClickBtn}
      />
    )

    it(`should display "${props.msg}"`, () =>
      expect(wrapper.find('.displaystate__msg')).to.have.text().equal(props.msg)
    )

    it(`should not display the button"`, () =>
      expect(wrapper.find(`button.displaystate__btn`)).to.have.lengthOf(0)
    )

    it(`should have the good onClick function`, () =>
      expect(wrapper.find(`.displaystate__btn.link`).prop('onClick')).to.have.equal(props.onClickBtn)
    )

    it(`should display 1 icon "${props.icon}"`, () =>
      expect(wrapper.find(`.fa-${props.icon}`)).to.have.lengthOf(1)
    )

    it(`should display "${props.btnLabel}"`, () =>
      expect(wrapper.find('.displaystate__btn')).to.have.text().equal(props.btnLabel)
    )
  })
})
