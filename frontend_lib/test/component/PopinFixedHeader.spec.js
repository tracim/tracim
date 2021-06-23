import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import PopinFixedHeader from '../../src/component/PopinFixed/PopinFixedHeader'
import { ROLE } from '../../src/helper.js'
import sinon from 'sinon'

describe('<PopinFixedHeader />', () => {
  const onClickCloseBtnCallBack = sinon.spy()
  const onValidateChangeTitleCallBack = sinon.spy()

  const props = {
    faIcon: 'randomFaIcon',
    onClickCloseBtn: onClickCloseBtnCallBack,
    customClass: 'randomCustomClass',
    customColor: 'randomCustomColor',
    rawTitle: 'randomRawTitle',
    componentTitle: <h1>Random Element</h1>,
    userRoleIdInWorkspace: ROLE.contentManager.id,
    onValidateChangeTitle: onValidateChangeTitleCallBack,
    disableChangeTitle: false,
    showChangeTitleButton: true
  }

  const wrapper = mount(
    <PopinFixedHeader
      {...props}
    />
  )

  describe('Static design', () => {
    it(`4 elements should have the class: "${(props.customClass)}"`, () => {
      expect(wrapper.find(`div.${(props.customClass)}__header`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${(props.customClass)}__header__icon`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${(props.customClass)}__header__title`)).to.have.lengthOf(1)
      expect(wrapper.find(`div.${(props.customClass)}__header__close`)).to.have.lengthOf(1)
    })

    it(`should display the icon: ${props.faIcon}`, () => {
      expect(wrapper.find(`i.${props.faIcon}`)).to.have.lengthOf(1)
    })

    it('should hide the edittitle button when the prop showChangeTitleButton is set to false', () => {
      wrapper.setProps({ showChangeTitleButton: false })
      expect(wrapper.find(`button.${(props.customClass)}__header__changetitle`)).to.have.lengthOf(0)
      wrapper.setProps({ showChangeTitleButton: props.showChangeTitleButton })
    })
  })

  describe('Intern function', () => {
    const wrapperWithoutHoc = mount(
      <PopinFixedHeader.WrappedComponent
        {...props}
        t={key => key}
      />
    )

    it('handleChangeTitle() should change the state title', () => {
      const e = { target: { value: 'testTitle' } }
      wrapperWithoutHoc.instance().handleChangeTitle(e)
      expect(wrapperWithoutHoc.state('editTitleValue')).to.equal(e.target.value)
    })

    it('handleClickUndoChangeTitleBtn() should undo the title change', () => {
      wrapperWithoutHoc.instance().handleClickChangeTitleBtn()
      const e = { target: { value: 'testTitle' } }
      wrapperWithoutHoc.instance().handleChangeTitle(e)
      wrapperWithoutHoc.instance().handleClickUndoChangeTitleBtn()
      expect(wrapperWithoutHoc.state('editTitle')).to.equal(false)
      expect(wrapperWithoutHoc.state('editTitleValue')).to.equal(props.rawTitle)
    })

    it('handleClickChangeTitleBtn() should setTitle to true', () => {
      wrapperWithoutHoc.instance().handleClickChangeTitleBtn()
      expect(wrapperWithoutHoc.state('editTitle')).to.equal(true)
      expect(wrapperWithoutHoc.state('editTitleValue')).to.equal(props.rawTitle)
      wrapperWithoutHoc.instance().handleClickChangeTitleBtn()
      expect(wrapperWithoutHoc.state('editTitle')).to.equal(false)
    })

    it('handleInputKeyPress() should call handleClickChangeTitleBtn if the key is "Enter"', () => {
      wrapperWithoutHoc.instance().handleInputKeyPress({ key: 'Enter' })
      expect(wrapperWithoutHoc.state('editTitle')).to.equal(true)
      expect(wrapperWithoutHoc.state('editTitleValue')).to.equal(props.rawTitle)
    })

    it('handleInputKeyPress() should call handleClickUndoChangeTitleBtn if the key is "Escape"', () => {
      wrapperWithoutHoc.instance().handleClickChangeTitleBtn()
      const e = { target: { value: 'testTitle' } }
      wrapperWithoutHoc.instance().handleChangeTitle(e)
      wrapperWithoutHoc.instance().handleInputKeyPress({ key: 'Escape' })
      expect(wrapperWithoutHoc.state('editTitle')).to.equal(false)
      expect(wrapperWithoutHoc.state('editTitleValue')).to.equal(props.rawTitle)
    })
  })

  describe('Handlers', () => {
    it('onClickCloseBtnCallBack should be call when click the close button', () => {
      wrapper.find(`div.${(props.customClass)}__header__close`).simulate('click')
      expect(onClickCloseBtnCallBack.called).to.equal(true)
    })
  })
})
