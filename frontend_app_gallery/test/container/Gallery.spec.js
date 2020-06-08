import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Gallery } from '../../src/container/Gallery.jsx'
import { APP_FEATURE_MODE } from 'tracim_frontend_lib'
import pictures from '../fixture/content/pictures.js'
import { debug } from '../../src/debug.js'
import { defaultDebug } from 'tracim_frontend_lib'

describe('<Gallery />', () => {
  const folderId = 1
  const folderName = 'folderTest'

  const props = {
    i18n: {},
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
    setApiUrl: () => { },
    data: {
      config: {
        apiUrl: 'http://localhost:1337/api',
        slug: 'gallery',
        faIcon: 'paperclip',
        hexcolor: '#ffa500',
        label: 'Gallery',
        appConfig: {
          forceShowSidebar: false,
          workspaceId: 0
        },
        history: {
          location: {
            search: `?folder_ids=${folderId}`
          }
        },
        translation :''
      },
      loggedUser: {
        ...defaultDebug.loggedUser
      }
    },
    t: key => key
  }

  const stateMock = {
    content: {
      content_type: 'file',
      workspace_id: 0,
      workspaceLabel: 'workspaceTest'
    },
    displayedPictureIndex: 1,
    imagesPreviews: pictures.map(picture => ({
      src: picture.filename,
      contentId: picture.content_id,
      fileName: picture.filename,
      lightBoxUrlList: [picture.filename],
      previewUrlForThumbnail: [picture.filename],
      rotationAngle: 0,
      rawFileUrl: [picture.filename]
    }))
  }

  const wrapper = shallow(<Gallery {...props} />)

  describe('TLM handlers', () => {
    describe('handleContentDeleted', () => {
      describe('delete the current picture', () => {
        it('should not be in the picture list anymore', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({content: pictures[1]})
          expect(wrapper.state().imagesPreviews.every(image => image.contentId !== pictures[0].content_id))
          expect(wrapper.state().imagesPreviews.length).to.equal(stateMock.imagesPreviews.length - 1)
        })

        it('should go to the next picture', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({content: pictures[1]})
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })

        it('should stay at the same picture', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({content: pictures[0]})
          expect(wrapper.state().displayedPictureIndex).to.equal(0)
        })

        it('should go to the previous picture', () => {
          wrapper.setState({...stateMock, displayedPictureIndex: 2})
          wrapper.instance().handleContentDeleted({content: pictures[2]})
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })
      })
    })
  })
})
