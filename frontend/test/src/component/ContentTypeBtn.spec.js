import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { ContentTypeBtn } from '../../../src/component/Dashboard/ContentTypeBtn.jsx'
import sinon from 'sinon'

describe('<ContentTypeBtn />', () => {
  const onClickBtnCallBack = sinon.spy()

  const props = {
    hexcolor: '#ffffff',
    label: 'randomLabel',
    faIcon: 'randomFaIcon',
    creationLabel: 'randomCreationLabel',
    customClass: 'randomCustomClass',
    onClickBtn: onClickBtnCallBack,
    appSlug: 'randomAppSlug'
  }

  const wrapper = shallow(<ContentTypeBtn {...props} />)

  describe('handler', () => {
    it('onClickBtnCallBack should be called when the root div is clicked', () => {
      wrapper.find('.dashboard__workspace__rightMenu__contents .iconbutton').simulate('click')
      expect(onClickBtnCallBack.called).to.equal(true)
    })
  })
})
