import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { CollaborativeEditionFrame as CollaborativeEditionFrameWithoutHOC } from '../src/container/CollaborativeEditionFrame.jsx'
import { ROLE } from 'tracim_frontend_lib'

const nock = require('nock')

describe('<CollaborativeEditionFrame />', function () {
  const props = {
    data: {
      content: {
        content_id: 1,
        workspace_id: 1
      },
      loggedUser: {
        userRoleIdInWorkspace: ROLE.workspaceManager.id,
        lang: 'en'
      },
      config: {
        apiUrl: 'http://unit.test:6543/api',
        translation: { en: { translation: {} } },
        system: {
          appListLoaded: true,
          config: {
            content_length_file_size_limit: 0,
            email_notification_activated: true,
            instance_name: 'Tracim',
            new_user_invitation_do_notify: true,
            webdav_enabled: true,
            webdav_url: 'https://unit.test:6543/webdav',
            workspace_size_limit: 0,
            workspaces_number_per_user_limit: 0
          },
          contentTypeListLoaded: true,
          redirectLogin: '',
          workspaceListLoaded: true
        }
      }
    },
    t: string => string
  }

  const wrapper = shallow(
    <CollaborativeEditionFrameWithoutHOC {...props} />
  )

  describe('the function buildCompleteIframeUrl', () => {
    const urlSource = 'http://unit.test:9980/loleaflet/305832f/loleaflet.html?'
    const accessToken = '123456789abc0'
    // INFO - CH - 2019-01-09 - getContentApiResult should come from fixtures from frontend_lib once PR related to merge
    // generic code of app feature is in develop
    const getContentApiResult = {
      actives_shares: 0,
      author: {
        avatar_url: '/api/asset/avatars/mrwhite.jpg',
        public_name: 'John Doe',
        user_id: 1
      },
      content_id: 1,
      content_namespace: 'content',
      content_type: 'file',
      created: '2020-01-07T15:59:17.003Z',
      current_revision_id: 12,
      file_extension: '.txt',
      filename: 'fileNameExample.txt',
      has_jpeg_preview: true,
      has_pdf_preview: true,
      is_archived: false,
      is_deleted: false,
      is_editable: true,
      label: 'Intervention Report 12',
      last_modifier: {
        avatar_url: '/api/asset/avatars/mrwhite.jpg',
        public_name: 'John Doe',
        user_id: 1
      },
      mimetype: 'image/jpeg',
      modified: '2020-01-07T15:59:17.003Z',
      page_nb: 1,
      parent_id: 34,
      raw_content: '',
      show_in_ui: true,
      size: 1024,
      slug: 'intervention-report-12',
      status: 'open',
      sub_content_types: ['comment'],
      workspace_id: 1
    }

    before(() => {
      window.location.protocol = 'unittest://'
      window.location.host = 'unit.test'
    })

    it('should return the proper built url without', async () => {
      // INFO - CH - 2019-01-09 - the nock bellow should refactored with frontend_lib apiMock file once PR related to merge
      // generic code of app feature is in develop

      nock(props.data.config.apiUrl)
        .get(`/workspaces/${props.data.content.workspace_id}/files/${props.data.content.content_id}`)
        .reply(200, getContentApiResult)
        .get(`/workspaces/${props.data.content.workspace_id}`)
        .reply(200, {})

      const expectedResult = 'http://unit.test:9980/loleaflet/305832f/loleaflet.html?WOPISrc=http://localhost/api/collaborative-document-edition/wopi/files/1&access_token=123456789abc0&closebutton=1&lang=en'
      await wrapper.instance().loadContent()
      const urlResult = wrapper.instance().buildCompleteIframeUrl(urlSource, accessToken)
      expect(urlResult).to.equal(expectedResult)
    })

    it('should return the url in mode readonly when api return is_editable to false', async () => {
      nock(props.data.config.apiUrl)
        .get(`/workspaces/${props.data.content.workspace_id}/files/${props.data.content.content_id}`)
        .reply(200, {
          ...getContentApiResult,
          is_editable: false
        })
        .get(`/workspaces/${props.data.content.workspace_id}`)
        .reply(200, {})

      const expectedResult = 'http://unit.test:9980/loleaflet/305832f/loleaflet.html?WOPISrc=http://localhost/api/collaborative-document-edition/wopi/files/1&access_token=123456789abc0&closebutton=1&lang=en&permission=readonly'
      await wrapper.instance().loadContent()
      const urlResult = wrapper.instance().buildCompleteIframeUrl(urlSource, accessToken)
      expect(urlResult).to.equal(expectedResult)
    })

    it('should return the url in mode readonly if user is reader event if api returned is_editable to true', async () => {
      const updatedProps = props
      updatedProps.data.loggedUser.userRoleIdInWorkspace = ROLE.reader.id

      nock(props.data.config.apiUrl)
        .persist()
        .get(`/workspaces/${props.data.content.workspace_id}/files/${props.data.content.content_id}`)
        .reply(200, getContentApiResult)

      nock(props.data.config.apiUrl)
        .persist()
        .get(`/workspaces/${props.data.content.workspace_id}`)
        .reply(200, {})

      const wrapperWithUserAsReader = shallow(
        <CollaborativeEditionFrameWithoutHOC {...updatedProps} />
      )

      const expectedResult = 'http://unit.test:9980/loleaflet/305832f/loleaflet.html?WOPISrc=http://localhost/api/collaborative-document-edition/wopi/files/1&access_token=123456789abc0&closebutton=1&lang=en&permission=readonly'
      await wrapperWithUserAsReader.instance().loadContent()
      const urlResult = wrapperWithUserAsReader.instance().buildCompleteIframeUrl(urlSource, accessToken)
      expect(urlResult).to.equal(expectedResult)
    })
  })
})
