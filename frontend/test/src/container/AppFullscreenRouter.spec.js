import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { AppFullscreenRouter as AppFullscreenRouterWithoutHOC } from '../../../src/container/AppFullscreenRouter'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { MemoryRouter } from 'react-router'
import { PAGE } from '../../../src/helper'

describe('<AppFullscreenRouter />', () => {
  const renderAppFullscreenCallBack = sinon.stub()

  const props = {
    user: user,
    renderAppFullscreen: renderAppFullscreenCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1
      }
    }
  }

  const ComponentWithHOC = AppFullscreenRouterWithoutHOC

  const wrapper = mount(
    <MemoryRouter initialEntries={['/']}>
      <ComponentWithHOC {...props} />
    </MemoryRouter>
  )

  describe('handlers', () => {
    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.WORKSPACE.CONTENT_EDITION(1, 1)}`, () => {
      wrapper.instance().history.replace(PAGE.WORKSPACE.CONTENT_EDITION(1, 1))
      expect(renderAppFullscreenCallBack.called).to.equal(true)
      let args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'collaborative_document_edition', hexcolor: '#7d4e24' }, props.user, { workspace_id: '1', content_id: '1' }])
      renderAppFullscreenCallBack.resetHistory()
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.WORKSPACE.AGENDA(1)}`, () => {
      wrapper.instance().history.replace(PAGE.WORKSPACE.AGENDA(1))
      expect(renderAppFullscreenCallBack.called).to.equal(true)
      let args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'agenda', hexcolor: '#7d4e24', appConfig: { workspaceId: 1, forceShowSidebar: false } }, props.user, {}])
      renderAppFullscreenCallBack.resetHistory()
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.AGENDA}`, () => {
      wrapper.instance().history.replace(PAGE.AGENDA)
      expect(renderAppFullscreenCallBack.called).to.equal(true)
      let args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'agenda', hexcolor: '#7d4e24', appConfig: { workspaceId: null, forceShowSidebar: true } }, props.user, {}])
      renderAppFullscreenCallBack.resetHistory()
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.ADMIN.USER}`, () => {
      wrapper.instance().history.replace(PAGE.ADMIN.USER)
      expect(renderAppFullscreenCallBack.called).to.equal(true)
      let args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'user' }, props.user, { workspaceList: [], userList: [] }])
      renderAppFullscreenCallBack.resetHistory()
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.ADMIN.WORKSPACE}`, () => {
      wrapper.instance().history.replace(PAGE.ADMIN.WORKSPACE)
      expect(renderAppFullscreenCallBack.called).to.equal(true)
      let args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'workspace' }, props.user, { workspaceList: [], userList: [] }])
      renderAppFullscreenCallBack.resetHistory()
    })
  })
})
