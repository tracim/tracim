import React from 'react'
import {expect} from 'chai'
import {shallow, configure} from 'enzyme'
import DisplayState from '../../src/component/DisplayState/DisplayState.jsx'
import PropTypes from "prop-types";

require('../../src/component/DisplayState/DisplayState.styl')

describe('<DisplayState />"', function () {
  const props = {
    msg: 'randomMessage',
    btnType: 'button',
    icon: 'randomIcon',
    btnLabel: 'randomBtnLabel',
    onClickBtn: () => {
      return 1
    }
  }

  const wrapper = shallow(
    <DisplayState
      {...props}
    />
  )

  describe('Static design test', () => {
    it(`should display "${props.msg}"`, () =>
      expect(wrapper.find('.displaystate__msg')).to.have.text().equal(props.msg)
    )

    it(`should display "${props.btnLabel}"`, () =>
      expect(wrapper.find('.displaystate__btn')).to.have.text().equal(props.btnLabel)
    )

    it(`should display the button"`, () => {
      expect(wrapper.find(`.displaystate__btn`)).to.have.lengthOf(1)
    })

    it(`should display 2 icon "${props.icon}"`, () => {
      expect(wrapper.find(`i.fa-${props.icon}`)).to.have.lengthOf(2)
    })

    it(`should not display the button when the btnType is set to link"`, () => {
      wrapper.setProps({btnType: 'link'})
      expect(wrapper.find(`button.displaystate__btn`)).to.have.lengthOf(0)
    })

    it(`should display 1 icon when the btnType is set to link"${props.icon}"`, () => {
      wrapper.setProps({btnType: 'link'})
      expect(wrapper.find(`.fa-${props.icon}`)).to.have.lengthOf(1)
    })
  })

  describe('Handlers test', () => {
    it(`onClick handler should call the proper handler`, () =>
      expect(wrapper.find(`.displaystate__btn`).prop('onClick')()).to.equal(props.onClickBtn())
    )
  })
})
