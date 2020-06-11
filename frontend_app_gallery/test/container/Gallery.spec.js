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
    displayedPictureIndex: 1,
    imagesPreviews: pictures.map(picture => ({
      src: picture.filename,
      label: picture.label,
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
      describe('delete a picture', () => {
        it('should not be in the picture list anymore', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({content: pictures[1]})
          expect(wrapper.state().imagesPreviews.every(image => image.contentId !== pictures[1].content_id))
          expect(wrapper.state().imagesPreviews.length).to.equal(stateMock.imagesPreviews.length - 1)
        })

        it('should go to the next picture', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({content: pictures[1]})
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })

        it('should stay at the same picture', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: pictures[0] })
          expect(wrapper.state().displayedPictureIndex).to.equal(0)
        })

        it('should go to the previous picture', () => {
          wrapper.setState({ ...stateMock, displayedPictureIndex: 2 })
          wrapper.instance().handleContentDeleted({ content: pictures[2] })
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })

        it('should ignore files from other folders', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: { ...pictures[0], parent_id: folderId + 1 } })
          expect(wrapper.state().imagesPreviews.length).to.equal(stateMock.imagesPreviews.length)
        })

        it('should ignore files from other workspaces', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: { ...pictures[0], workspace_id: 2 } })
          expect(wrapper.state().imagesPreviews.length).to.equal(stateMock.imagesPreviews.length)
        })
      })
    })

    describe('handleContentModified', () => {
      describe('modify the current picture', () => {
        it('should not keep the old label in the picture list anymore and but the new one, yes after rename', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[1], label: 'betterversion' } })
          expect(wrapper.state().imagesPreviews.every(image => image.label !== pictures[1].label))
          expect(wrapper.state().imagesPreviews.some(image => image.label === 'betterversion'))
        })

        it('should be sorted', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[1], label: 'betterversion' } })
          let sortedImagesPreviews = wrapper.state().imagesPreviews.slice()
          sortedImagesPreviews.sort((a, b) => (a.label.localeCompare(b.label)))
          expect(sortedImagesPreviews).to.be.deep.equal(wrapper.state().imagesPreviews)
        })

        it('should stay at the same picture if the displayed picture is not touched', () => {
          wrapper.setState({ ...stateMock, displayedPictureIndex: 2 })
          wrapper.instance().handleContentModified({ content: pictures[1] })
          expect(wrapper.state().imagesPreviews[wrapper.state().displayedPictureIndex].label).to.equal(pictures[2].label)

          wrapper.setState({ ...stateMock, displayedPictureIndex: 0 })
          wrapper.instance().handleContentModified({ content: pictures[1] })
          expect(wrapper.state().imagesPreviews[wrapper.state().displayedPictureIndex].label).to.equal(pictures[0].label)

          wrapper.setState({ ...stateMock, displayedPictureIndex: 1 })
          wrapper.instance().handleContentModified({ content: pictures[0] })
          expect(wrapper.state().imagesPreviews[wrapper.state().displayedPictureIndex].label).to.equal(pictures[1].label)
        })

        it('should ignore files from other folders', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[0], label: 'NotRelevant', parent_id: folderId + 1 } })
          expect(wrapper.state().imagesPreviews.every(image => image.label !== 'NotRelevant'))
        })

        it('should ignore files from other workspaces', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[0], label: 'NotRelevant', workspace_id: 2 } })
          expect(wrapper.state().imagesPreviews.every(image => image.label !== 'NotRelevant'))
        })
      })
    })
  })
})
