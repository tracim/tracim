import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Gallery } from '../../src/container/Gallery.jsx'
import { defaultDebug } from 'tracim_frontend_lib'
import pictures from '../fixture/content/pictures.js'

describe('<Gallery />', () => {
  const folderId = 1

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
        translation: ''
      },
      loggedUser: {
        ...defaultDebug.loggedUser
      }
    },
    t: key => key
  }

  const wrapper = shallow(<Gallery {...props} />)

  const stateMock = {
    displayedPictureIndex: 1,
    imagePreviewList: pictures.map(picture => ({
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

  describe('TLM handlers', () => {
    describe('handleContentDeleted', () => {
      describe('after deleting a picture', () => {
        it('should not be in the picture list anymore', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: pictures[1] })
          expect(wrapper.state().imagePreviewList.every(image => image.contentId !== pictures[1].content_id))
          expect(wrapper.state().imagePreviewList.length).to.equal(stateMock.imagePreviewList.length - 1)
        })

        it('should go to the next picture when the current picture is deleted', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: pictures[1] })
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })

        it('should stay at the same index if the current picture is before the deleted picture', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: pictures[0] })
          expect(wrapper.state().displayedPictureIndex).to.equal(0)
        })

        it('should go to the previous picture if the last picture is deleted and this was the current picture', () => {
          wrapper.setState({ ...stateMock, displayedPictureIndex: 2 })
          wrapper.instance().handleContentDeleted({ content: pictures[2] })
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })

        it('should ignore files from other folders', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: { ...pictures[0], parent_id: folderId + 1 } })
          expect(wrapper.state().imagePreviewList.length).to.equal(stateMock.imagePreviewList.length)
        })

        it('should ignore files from other workspaces', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ content: { ...pictures[0], workspace_id: 2 } })
          expect(wrapper.state().imagePreviewList.length).to.equal(stateMock.imagePreviewList.length)
        })
      })
    })

    describe('handleContentModified', () => {
      describe('modifying the current picture', () => {
        it('should not keep the old label in the picture list anymore but the new one, yes after rename', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[1], label: 'betterversion' } })
          expect(wrapper.state().imagePreviewList.every(image => image.label !== pictures[1].label))
          expect(wrapper.state().imagePreviewList.some(image => image.label === 'betterversion'))
        })

        it('should keep the picture list sorted', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[1], label: 'betterversion' } })
          const sortedImagesPreviews = [...wrapper.state().imagePreviewList]
          sortedImagesPreviews.sort((a, b) => (a.label.localeCompare(b.label)))
          expect(sortedImagesPreviews).to.be.deep.equal(wrapper.state().imagePreviewList)
        })

        it('should stay at the same picture if the displayed picture is not touched', () => {
          wrapper.setState({ ...stateMock, displayedPictureIndex: 2 })
          wrapper.instance().handleContentModified({ content: pictures[1] })
          expect(wrapper.state().imagePreviewList[wrapper.state().displayedPictureIndex].label).to.equal(pictures[2].label)

          wrapper.setState({ ...stateMock, displayedPictureIndex: 0 })
          wrapper.instance().handleContentModified({ content: pictures[1] })
          expect(wrapper.state().imagePreviewList[wrapper.state().displayedPictureIndex].label).to.equal(pictures[0].label)

          wrapper.setState({ ...stateMock, displayedPictureIndex: 1 })
          wrapper.instance().handleContentModified({ content: pictures[0] })
          expect(wrapper.state().imagePreviewList[wrapper.state().displayedPictureIndex].label).to.equal(pictures[1].label)
        })

        it('should ignore files from other folders', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[0], label: 'NotRelevant', parent_id: folderId + 1 } })
          expect(wrapper.state().imagePreviewList.every(image => image.label !== 'NotRelevant'))
        })

        it('should ignore files from other workspaces', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ content: { ...pictures[0], label: 'NotRelevant', workspace_id: 2 } })
          expect(wrapper.state().imagePreviewList.every(image => image.label !== 'NotRelevant'))
        })
      })
    })

    describe('handleWorkspaceModified', () => {
      it("should update the gallery's title", () => {
        const newWorkspaceLabel = 'Workspace name changed'
        wrapper.setState(stateMock)
        wrapper.instance().handleWorkspaceModified({ workspace: { workspace_id: 0, label: newWorkspaceLabel } })
        expect(wrapper.state().workspaceLabel).to.be.equal(newWorkspaceLabel)
      })

      it("should NOT change the gallery's title if the modified workspace is not the one displayed", () => {
        const newWorkspaceLabel = 'This is not my workspace'
        wrapper.setState(stateMock)
        wrapper.instance().handleWorkspaceModified({ workspace: { workspace_id: 2, label: newWorkspaceLabel } })
        expect(wrapper.state().workspaceLabel).to.be.not.equal(newWorkspaceLabel)
      })
    })
  })
})
