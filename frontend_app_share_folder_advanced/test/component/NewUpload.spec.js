/*
import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { NewUpload as NewUploadWithoutHOC } from '../../src/component/NewUpload.jsx'
import sinon from 'sinon'
import { translateMock } from '../hocMock/translate.js'

describe('<NewUpload />', () => {
  const onChangeUploadEmailsCallBack = sinon.stub()
  const onKeyDownEnterCallBack = sinon.stub()
  const onChangeUploadPasswordCallBack = sinon.stub()
  const onClickCancelNewUploadCallBack = sinon.stub()
  const onClickNewUploadCallBack = sinon.stub()

  const props = {
    uploadLinkList: [],
    customColor: '#ffffff',
    uploadEmails: 'customEmail',
    onChangeUploadEmails: onChangeUploadEmailsCallBack,
    onKeyDownEnter: onKeyDownEnterCallBack,
    uploadPassword: 'randomPassWord',
    onChangeUploadPassword: onChangeUploadPasswordCallBack,
    onClickCancelNewUpload: onClickCancelNewUploadCallBack,
    onClickNewUpload: onClickNewUploadCallBack
  }

  const ComponentWithHOC = translateMock()(NewUploadWithoutHOC)

  const wrapper = shallow(<ComponentWithHOC {...props} />)

  const wrapperInstance = wrapper.find('NewUpload')

  describe('static design', () => {

  })

  describe('intern functions', () => {
    describe('handleTogglePasswordActive()', () => {
      it('handleTogglePasswordActive should change state of isPasswordActive to his opposite', () => {
        // const prevIsPasswordActive = wrapperInstance.dive().state('isPasswordActive')
        // wrapper.dive().instance().handleTogglePasswordActive()
        // expect(wrapperInstance.dive().state('isPasswordActive')).to.equal(!prevIsPasswordActive)
      })
    })
  })

  describe('handlers', () => {

  })
})
*/
