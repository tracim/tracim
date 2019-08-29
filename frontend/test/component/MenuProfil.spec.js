import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { MenuProfil as MenuProfilWithoutHOC } from '../../src/component/Header/MenuActionListItem/MenuProfil.jsx'
import { translateMock } from '../hocMock/translate.js'
import { RouterMock } from '../hocMock/withRouter.js'
import sinon from 'sinon'

describe('<MenuProfil />', () => {
  const onClickLogoutCallBack = sinon.stub()

  const props = {
    user: {
      public_name: 'randomPublicName',
      logged: true
    },
    onClickLogout: onClickLogoutCallBack
  }

  const ComponentWithHoc = translateMock()(MenuProfilWithoutHOC)

  const wrapper = mount(
    <RouterMock>
      <ComponentWithHoc { ...props } />
    </RouterMock>
  )

  describe('static design', () => {
    it('should display the public name in a div', () =>
      expect(wrapper.find(`div.menuprofil__dropdown__name__text`)).to.text().equal(props.user.public_name)
    )
  })

  describe('handler', () => {
    it('onClickLogoutCallBack should be called when logout div is clicked', () => {
      wrapper.find('div.menuprofil__dropdown__setting__link').simulate('click')
      expect(onClickLogoutCallBack.called).to.equal(true)
    })
  })
})
