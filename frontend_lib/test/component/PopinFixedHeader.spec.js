import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PopinFixedHeader from '../../src/component/PopinFixed/PopinFixedHeader'
import sinon from 'sinon'

describe('<PopinFixedHeader />', () => {
  const onClickCloseBtnCallBack = sinon.stub()
  const onValidateChangeTitleCallBack = sinon.stub()

  const props = {
    faIcon: 'randomFaIcon',
    onClickCloseBtn: onClickCloseBtnCallBack,
    customClass: 'randomCustomClass',
    customColor: 'randomCustomColor',
    rawTitle: 'randomRawTitle',
    componentTitle: <h1>Random Element</h1>,
    userRoleIdInWorkspace: 3,
    onValidateChangeTitle: onValidateChangeTitleCallBack,
    disableChangeTitle: false
  }

  const wrapper = shallow(
    <PopinFixedHeader
      {...props}
    />
  ).dive()

  describe('Static design', () => {
    it(`6 elements should have the class : "${(props.customClass)}"`, () => {
      expect(wrapper.find(`div.${(props.customClass)}__header`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${(props.customClass)}__header__icon`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${(props.customClass)}__header__title`)).to.have.lengthOf(1)
      expect(wrapper.find(`button.${(props.customClass)}__header__changetitle`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${(props.customClass)}__header__close`)).to.have.lengthOf(1)
    })

    it(`should display the icon : ${props.faIcon}`, () => {
      expect(wrapper.find(`i.fa.fa-${props.faIcon}`)).to.have.lengthOf(1)
    })
  })

  describe('Intern function', () => {
    it('onChangeTitle() should change the state title', () => {
      const e = { target: { value: 'testTitle' } }
      wrapper.instance().onChangeTitle(e)
      expect(wrapper.state('editTitleValue')).to.equal(e.target.value)
    })

    it('handleClickUndoChangeTitleBtn() should undo the title change', () => {
      wrapper.instance().handleClickChangeTitleBtn()
      const e = { target: { value: 'testTitle' } }
      wrapper.instance().onChangeTitle(e)
      wrapper.instance().handleClickUndoChangeTitleBtn()
      expect(wrapper.state('editTitle')).to.equal(false)
      expect(wrapper.state('editTitleValue')).to.equal(props.rawTitle)
    })

    it('handleClickChangeTitleBtn() should setTitle to true', () => {
      wrapper.instance().handleClickChangeTitleBtn()
      expect(wrapper.state('editTitle')).to.equal(true)
      expect(wrapper.state('editTitleValue')).to.equal(props.rawTitle)
      wrapper.instance().handleClickChangeTitleBtn()
      expect(wrapper.state('editTitle')).to.equal(false)
    })

    it('handleInputKeyPress() should call handleClickChangeTitleBtn if the key is "Enter"', () => {
      wrapper.instance().handleInputKeyPress({ key: 'Enter' })
      expect(wrapper.state('editTitle')).to.equal(true)
      expect(wrapper.state('editTitleValue')).to.equal(props.rawTitle)
    })

    it('handleInputKeyPress() should call handleClickUndoChangeTitleBtn if the key is "Escape"', () => {
      wrapper.instance().handleClickChangeTitleBtn()
      const e = { target: { value: 'testTitle' } }
      wrapper.instance().onChangeTitle(e)
      wrapper.instance().handleInputKeyPress({ key: 'Escape' })
      expect(wrapper.state('editTitle')).to.equal(false)
      expect(wrapper.state('editTitleValue')).to.equal(props.rawTitle)
    })
  })

  describe('Handlers', () => {
    it(`onValidateChangeTitleCallBack should be call when click the undo button`, () => {
      wrapper.find(`button.${(props.customClass)}__header__changetitle`).at(0).simulate('click')
      wrapper.find(`button.${(props.customClass)}__header__changetitle`).at(1).simulate('click')
      expect(onValidateChangeTitleCallBack.called).to.equal(true)
    })

    it(`onClickCloseBtnCallBack should be call when click the close button`, () => {
      wrapper.find(`div.${(props.customClass)}__header__close`).simulate('click')
      expect(onClickCloseBtnCallBack.called).to.equal(true)
    })
  })
})
