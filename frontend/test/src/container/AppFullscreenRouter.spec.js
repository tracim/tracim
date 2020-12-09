import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { AppFullscreenRouter as AppFullscreenRouterWithoutHOC } from '../../../src/container/AppFullscreenRouter'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { MemoryRouter } from 'react-router'
import { PAGE, ROLE } from 'tracim_frontend_lib'

describe('<AppFullscreenRouter />', () => {
  const renderAppFullscreenCallBack = sinon.spy()

  const props = {
    user: user,
    renderAppFullscreen: renderAppFullscreenCallBack,
    match: {
      params: {
        idws: 1,
        idcts: 1
      }
    },
    workspaceList: [{
      memberList: [{
        id: 1,
        role: ROLE.reader.id
      }]
    }]
  }

  const ComponentWithHOC = AppFullscreenRouterWithoutHOC

  const wrapper = mount(
    <MemoryRouter initialEntries={['/']}>
      <ComponentWithHOC {...props} />
    </MemoryRouter>
  )

  describe('Disconnect the user', () => {
    it('should not render any app', () => {
      // INFO - GM - 2020/03/30 - In order to set props to children when mounting a element, we need to set props too root
      // See: https://github.com/enzymejs/enzyme/issues/1925#issuecomment-445490387
      wrapper.setProps({ children: (<ComponentWithHOC {...props} user={{ ...user, logged: false }} />) })
      expect(wrapper.find('.AppFullScreenManager').length).equal(0)
      wrapper.setProps({ children: (<ComponentWithHOC {...props} />) })
    })
  })

  describe('handlers', () => {
    afterEach(() => {
      renderAppFullscreenCallBack.resetHistory()
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.WORKSPACE.CONTENT_EDITION(1, 1)}`, () => {
      wrapper.instance().history.replace(PAGE.WORKSPACE.CONTENT_EDITION(1, 1))
      expect(renderAppFullscreenCallBack.called).to.equal(true)

      const args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([
        { slug: 'collaborative_document_edition', hexcolor: '#7d4e24' },
        props.user,
        ROLE.reader.id,
        { workspace_id: 1, content_id: '1' }
      ])
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.WORKSPACE.AGENDA(1)}`, () => {
      wrapper.instance().history.replace(PAGE.WORKSPACE.AGENDA(1))
      expect(renderAppFullscreenCallBack.called).to.equal(true)

      const args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'agenda', hexcolor: '#7d4e24', appConfig: { workspaceId: 1, forceShowSidebar: false } }, props.user, ROLE.reader.id, {}])
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.AGENDA}`, () => {
      wrapper.instance().history.replace(PAGE.AGENDA)
      expect(renderAppFullscreenCallBack.called).to.equal(true)

      const args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'agenda', hexcolor: '#7d4e24', appConfig: { workspaceId: null, forceShowSidebar: true } }, props.user, null, {}])
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.ADMIN.USER}`, () => {
      wrapper.instance().history.replace(PAGE.ADMIN.USER)
      expect(renderAppFullscreenCallBack.called).to.equal(true)

      const args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'user' }, props.user, null, { workspaceList: [], userList: [] }])
    })

    it(`renderAppFullscreenCallBack should be called when the route is ${PAGE.ADMIN.WORKSPACE}`, () => {
      wrapper.instance().history.replace(PAGE.ADMIN.WORKSPACE)
      expect(renderAppFullscreenCallBack.called).to.equal(true)

      const args = renderAppFullscreenCallBack.getCalls()[0].args
      expect(args).to.deep.equal([{ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'workspace' }, props.user, null, { workspaceList: [], userList: [] }])
    })
  })
})
