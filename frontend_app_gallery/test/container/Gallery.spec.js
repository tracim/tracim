import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { cloneDeep } from 'lodash'
import { defaultDebug } from 'tracim_frontend_lib'
import { Gallery } from '../../src/container/Gallery.jsx'
import pictures from '../fixture/content/pictures.js'
import { mockGetFileRevisionPreviewInfo200 } from '../apiMock.js'

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
      lightBoxUrl: picture.filename,
      previewUrlForThumbnail: [picture.filename],
      rotationAngle: 0,
      rawFileUrl: [picture.filename]
    }))
  }

  describe('The constructor', () => {
    it('Initialize folderId to undefined by default', () => {
      const propsWithoutFolderId = cloneDeep(props)
      propsWithoutFolderId.data.config.history.location.search = ''
      expect(shallow(<Gallery {... propsWithoutFolderId} />).instance().state.folderId).to.be.equal(undefined)
    })
  })

  describe('Intern function', () => {
    describe('liveMessageNotRelevant', () => {
      const initialState = {
        config: {
          appConfig: {
            workspaceId: 1
          }
        },
        folderId: 1
      }

      const initialData = {
        fields: {
          content: {
            workspace_id: 1,
            parent_id: 1
          }
        }
      }

      it('should return true when the workspace is the same but state.folderId is undefined', () => {
        const state = {
          ...initialState,
          folderId: undefined
        }

        expect(wrapper.instance().liveMessageNotRelevant(initialData, state)).to.equal(true)
      })

      it('should return true when the workspace is not the same', () => {
        const data = {
          fields: {
            content: {
              ...initialData.content,
              workspace_id: initialData.fields.content.workspace_id + 1
            }
          }
        }
        expect(wrapper.instance().liveMessageNotRelevant(data, initialState)).to.equal(true)
      })

      it('should return false when the folder id and the workspace are the same', () => {
        expect(wrapper.instance().liveMessageNotRelevant(initialData, initialState)).to.equal(false)
      })

      it('should return true when the folder id is not the same', () => {
        const data = {
          fields: {
            content: {
              ...initialData.fields.content,
              parent_id: initialState.folderId + 1
            }
          }
        }
        expect(wrapper.instance().liveMessageNotRelevant(data, initialState)).to.equal(true)
      })
    })
  })

  describe('TLM handlers', () => {
    describe('handleContentDeleted', () => {
      describe('after deleting a picture', () => {
        it('should not be in the picture list anymore', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ fields: { content: pictures[1] } })
          expect(wrapper.state().imagePreviewList.every(image => image.contentId !== pictures[1].content_id))
          expect(wrapper.state().imagePreviewList.length).to.equal(stateMock.imagePreviewList.length - 1)
        })

        it('should go to the next picture when the current picture is deleted', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ fields: { content: pictures[1] } })
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })

        it('should stay at the same index if the current picture is before the deleted picture', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ fields: { content: pictures[0] } })
          expect(wrapper.state().displayedPictureIndex).to.equal(0)
        })

        it('should go to the previous picture if the last picture is deleted and this was the current picture', () => {
          wrapper.setState({ ...stateMock, displayedPictureIndex: 2 })
          wrapper.instance().handleContentDeleted({ fields: { content: pictures[2] } })
          expect(wrapper.state().displayedPictureIndex).to.equal(1)
        })

        it('should ignore files from other folders', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ fields: { content: { ...pictures[0], parent_id: folderId + 1 } } })
          expect(wrapper.state().imagePreviewList.length).to.equal(stateMock.imagePreviewList.length)
        })

        it('should ignore files from other workspaces', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentDeleted({ fields: { content: { ...pictures[0], workspace_id: 2 } } })
          expect(wrapper.state().imagePreviewList.length).to.equal(stateMock.imagePreviewList.length)
        })
      })
    })

    describe('handleContentModified', () => {
      describe('modifying the current picture', () => {
        it('should not keep the old label in the picture list anymore but the new one, yes after rename', () => {
          wrapper.setState(stateMock)
          const content = pictures[1]
          mockGetFileRevisionPreviewInfo200(props.data.config.apiUrl, content.workspace_id, content.content_id, content.current_revision_id)
          wrapper.instance().handleContentModified({ fields: { content: { ...content, label: 'betterversion' } } })
          expect(wrapper.state().imagePreviewList.every(image => image.label !== content.label))
          expect(wrapper.state().imagePreviewList.some(image => image.label === 'betterversion'))
        })

        it('should keep the picture list sorted', () => {
          wrapper.setState(stateMock)
          const content = pictures[1]
          mockGetFileRevisionPreviewInfo200(props.data.config.apiUrl, content.workspace_id, content.content_id, content.current_revision_id)
          wrapper.instance().handleContentModified({ fields: { content: { ...content, label: 'betterversion' } } })
          const sortedImagesPreviews = [...wrapper.state().imagePreviewList]
          sortedImagesPreviews.sort((a, b) => (a.label.localeCompare(b.label)))
          expect(sortedImagesPreviews).to.be.deep.equal(wrapper.state().imagePreviewList)
        })

        it('should stay at the same picture if the displayed picture is not touched', () => {
          wrapper.setState({ ...stateMock, displayedPictureIndex: 2 })
          const content = pictures[1]
          mockGetFileRevisionPreviewInfo200(props.data.config.apiUrl, content.workspace_id, content.content_id, content.current_revision_id).persist()
          wrapper.instance().handleContentModified({ fields: { content } })
          expect(wrapper.state().imagePreviewList[wrapper.state().displayedPictureIndex].label).to.equal(pictures[2].label)

          wrapper.setState({ ...stateMock, displayedPictureIndex: 0 })
          wrapper.instance().handleContentModified({ fields: { content } })
          expect(wrapper.state().imagePreviewList[wrapper.state().displayedPictureIndex].label).to.equal(pictures[0].label)

          wrapper.setState({ ...stateMock, displayedPictureIndex: 1 })
          mockGetFileRevisionPreviewInfo200(props.data.config.apiUrl, pictures[0].workspace_id, pictures[0].content_id, pictures[0].current_revision_id)
          wrapper.instance().handleContentModified({ fields: { content: pictures[0] } })
          expect(wrapper.state().imagePreviewList[wrapper.state().displayedPictureIndex].label).to.equal(pictures[1].label)
        })

        it('should ignore files from other folders', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ fields: { content: { ...pictures[0], label: 'NotRelevant', parent_id: folderId + 1 } } })
          expect(wrapper.state().imagePreviewList.every(image => image.label !== 'NotRelevant'))
        })

        it('should ignore files from other workspaces', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ fields: { content: { ...pictures[0], label: 'NotRelevant', workspace_id: 2 } } })
          expect(wrapper.state().imagePreviewList.every(image => image.label !== 'NotRelevant'))
        })
      })

      describe('moving a content outside the current folder', () => {
        it('should remove this content from the list when it was moved in a other workspace', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ fields: { content: { ...pictures[0], workspace_id: 2 } } })
          expect(wrapper.state().imagePreviewList.every(image => image.filename !== pictures[0].filename)).to.equal(true)
        })
        it('should remove this content from the list when it was moved in a other folder and same workspace', () => {
          wrapper.setState(stateMock)
          wrapper.instance().handleContentModified({ fields: { content: { ...pictures[0], parent_id: folderId + 1 } } })
          expect(wrapper.state().imagePreviewList.every(image => image.contentId !== pictures[0].content_id)).to.equal(true)
        })
      })
    })

    describe('handleWorkspaceModified', () => {
      it("should update the gallery's title", () => {
        const newWorkspaceLabel = 'Workspace name changed'
        wrapper.setState(stateMock)
        wrapper.instance().handleWorkspaceModified({ fields: { workspace: { workspace_id: 0, label: newWorkspaceLabel } } })
        expect(wrapper.state().workspaceLabel).to.be.equal(newWorkspaceLabel)
      })

      it("should NOT change the gallery's title if the modified workspace is not the one displayed", () => {
        const newWorkspaceLabel = 'This is not my workspace'
        wrapper.setState(stateMock)
        wrapper.instance().handleWorkspaceModified({ fields: { workspace: { workspace_id: 2, label: newWorkspaceLabel } } })
        expect(wrapper.state().workspaceLabel).to.be.not.equal(newWorkspaceLabel)
      })
    })
  })
})
