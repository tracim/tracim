import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import TextAreaApp from '../../src/component/Input/TextAreaApp/TextAreaApp.jsx'
import PropTypes from "prop-types";
require('../../src/component/Input/TextAreaApp/TextAreaApp.styl')

describe('<TextAreaApp />', () => {
  const onChangeText = () => console.log('t')
  const onClickCancelBtn = () => console.log('t')
  const onClickValidateBtn = () => console.log('t')

  const props = {
    text: 'Lorem',
    customClass: 'randomTestClass',
    customColor: '#FFFFFF',
    id: 'MyId',
    onChangeText: onChangeText,
    onClickCancelBtn: onClickCancelBtn,
    onClickValidateBtn: onClickValidateBtn,
    disableValidateBtn: false
  }

  const wrapper = shallow(
    <TextAreaApp
      text={props.text}
      onChangeText={props.onChangeText}
      onClickCancelBtn={props.onClickCancelBtn}
      onClickValidateBtn={props.onClickValidateBtn}
      disableValidateBtn={props.disableValidateBtn}
      id={props.id}
      customClass={props.customClass}
      customColor={props.customColor}
    />
  )

  // it(`should display "${props.text}"`, () =>
  //
  //   expect(wrapper.find(`#${props.id}`)).to.have.text().equal(props.text)
  // )

  // it(`should have the class "${props.customClass}"`, () => {
  //   expect(wrapper.find(`.${props.customClass}`)).to.have.lengthOf(1)
  // })

  // it(`should display its text in color ${props.style.color}`, () =>
  //   // expect(wrapper.find('.badge').prop('style')).to.deep.equal(props.style)
  // )
})
