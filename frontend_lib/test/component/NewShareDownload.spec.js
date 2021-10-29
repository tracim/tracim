import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { translateMock } from '../hocMock/translate.js'
import { NewShareDownload as NewShareDownloadWithoutHOC } from '../../src/component/ShareDownload/NewShareDownload.jsx'
require('../../src/component/ShareDownload/ShareDownload.styl')

describe('<NewShareDownload />', () => {
  const onChangeEmailsCallBack = sinon.spy()
  const onKeyDownEnterCallBack = sinon.spy()
  const onChangePasswordCallBack = sinon.spy()
  const onClickCancelButtonCallBack = sinon.spy()
  const onClickNewShareCallBack = sinon.spy()

  const props = {
    shareEmails: 'randomEmail@randomEmail.randomEmail',
    onChangeEmails: onChangeEmailsCallBack,
    onKeyDownEnter: onKeyDownEnterCallBack,
    hexcolor: 'yellow',
    sharePassword: 'randomPassword',
    onChangePassword: onChangePasswordCallBack,
    onClickCancelButton: onClickCancelButtonCallBack,
    onClickNewShare: onClickNewShareCallBack,
    emailNotifActivated: false
  }

  const NewShareDownloadWithHoc = translateMock()(NewShareDownloadWithoutHOC)

  // INFO - G.B. - 2019-09-03 - The lines bellow are needed because the reactstrap code looks in the document for the target and if the target is mounted outside of the document it cannot find it.
  const div = document.createElement('div')
  document.body.appendChild(div)

  const wrapper = mount(
    <NewShareDownloadWithHoc
      {...props}
    />, { attachTo: div }
  )

  describe('Static design', () => {
    it(`emails input should have the value: ${props.shareEmails}`, () => {
      expect(wrapper.find('.shareDownload__email__input').prop('value')).to.equal(props.shareEmails)
    })

    it(`password input should have the value: ${props.sharePassword}`, () => {
      wrapper.find('.shareDownload__password__link').simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(wrapper.find('.shareDownload__password__input').prop('value')).to.equal(props.sharePassword)
    })
  })

  describe('Handlers', () => {
    it('should call props.onChangeEmails when handler onChangeEmails is called', () => {
      wrapper.find('.shareDownload__email__input').simulate('change', { target: { value: 'anotherEmail' } })
      expect(onChangeEmailsCallBack.called).to.equal(true)
    })

    it('should call props.onKeyDownEnter when handler onKeyDownEnter is called', () => {
      wrapper.find('.shareDownload__email__input').simulate('keyDown', { key: 'Enter', preventDefault: () => {} })
      expect(onKeyDownEnterCallBack.called).to.equal(true)
    })

    it('should call props.onChangePassword when handler onChangePassword is called', () => {
      wrapper.find('.shareDownload__password__input').simulate('change', { target: { value: 'anotherEmail' } })
      expect(onChangePasswordCallBack.called).to.equal(true)
    })

    it('should call props.onClickCancelButton when handler onClickCancelButton is called', () => {
      wrapper.find('.shareDownload__buttons__cancel').simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(onClickCancelButtonCallBack.called).to.equal(true)
    })

    it('should call props.onClickNewShare when handler onClickNewShare is called', () => {
      wrapper.find('.shareDownload__buttons__newBtn').simulate('click', { preventDefault: () => {}, stopPropagation: () => {} })
      expect(onClickNewShareCallBack.called).to.equal(true)
    })
  })
})
