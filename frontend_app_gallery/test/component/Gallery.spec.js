import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Gallery as GalleryWithoutHOC } from '../../src/container/Gallery.jsx'
import { DIRECTION } from '../../src/helper'
import { defaultDebug, PAGE } from 'tracim_frontend_lib'
import {
  mockGetContents200,
  mockGetWorkspaceDetail200,
  mockGetFolderDetailDetail200
} from '../apiMock.js'

describe('<Gallery />', () => {
  const folderId = 1
  const folderName = 'folderTest'

  const props = {
    registerCustomEventHandlerList: () => { },
    registerLiveMessageHandlerList: () => { },
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
    }
  }

  const stateMock = {
    content: {
      content_type: 'file',
      workspace_id: 0,
      workspaceLabel: 'workspaceTest'
    },
    imagePreviewList: [
      {
        src: 'mock.com/1.jpg',
        contentId: 1,
        fileName: 'imageOne',
        lightBoxUrlList: [
          'mock.com/big/1.jpg'
        ],
        previewUrlForThumbnail: [
          'mock.com/small/1.jpg'
        ],
        rotationAngle: 0,
        rawFileUrl: [
          'mock.com/raw/1.jpg'
        ]
      }, {
        src: 'mock.com/2.jpg',
        contentId: 2,
        fileName: 'imageTwo',
        lightBoxUrlList: [
          'mock.com/big/2.jpg'
        ],
        previewUrlForThumbnail: [
          'mock.com/small/2.jpg'
        ],
        rotationAngle: 0,
        rawFileUrl: [
          'mock.com/raw/2.jpg'
        ]
      }, {
        src: 'mock.com/3.jpg',
        contentId: 3,
        fileName: 'imageThree',
        lightBoxUrlList: [
          'mock.com/big/3.jpg'
        ],
        previewUrlForThumbnail: [
          'mock.com/small/3.jpg'
        ],
        rotationAngle: 0,
        rawFileUrl: [
          'mock.com/raw/3.jpg'
        ]
      }
    ]
  }

  mockGetContents200(props.data.config.apiUrl, props.data.config.appConfig.workspaceId, { parent_ids: folderId, namespaces_filter: 'upload,content' }, [])
  mockGetWorkspaceDetail200(props.data.config.apiUrl, props.data.config.appConfig.workspaceId, stateMock.content.workspaceLabel)
  mockGetFolderDetailDetail200(props.data.config.apiUrl, props.data.config.appConfig.workspaceId, folderId, folderName, null)

  const wrapper = shallow(<GalleryWithoutHOC {...props} t={tradKey => tradKey} />)
  wrapper.setState(stateMock)

  describe('functions tests', () => {
    describe('getPreviousImageUrl()', () => {
      it('should return the previous imagePreview when filSelected > 0', () => {
        wrapper.setState({ displayedPictureIndex: 1 })
        expect(wrapper.instance().getPreviousImageUrl()).to.equal(stateMock.imagePreviewList[0].lightBoxUrlList[0])
      })
      it('should return the last imagePreview when displayedPictureIndex === 0', () => {
        wrapper.setState({ displayedPictureIndex: 0 })
        expect(wrapper.instance().getPreviousImageUrl()).to.equal(stateMock.imagePreviewList[stateMock.imagePreviewList.length - 1].lightBoxUrlList[0])
      })
      it('should return undefined when imagePreviewList length <= 1', () => {
        wrapper.setState({ imagePreviewList: [] })
        expect(wrapper.instance().getPreviousImageUrl()).to.equal(undefined)
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList })
      })
    })

    describe('getNextImageUrl()', () => {
      it('should return the next imagePreview when filSelected < imagePreviewList.length', () => {
        wrapper.setState({ displayedPictureIndex: 1 })
        expect(wrapper.instance().getNextImageUrl()).to.equal(stateMock.imagePreviewList[2].lightBoxUrlList[0])
      })
      it('should return the first imagePreview when filSelected === imagePreviewList.length-1', () => {
        wrapper.setState({ displayedPictureIndex: stateMock.imagePreviewList.length - 1 })
        expect(wrapper.instance().getNextImageUrl()).to.equal(stateMock.imagePreviewList[0].lightBoxUrlList[0])
      })
      it('should return undefined when imagePreviewList length <= 1', () => {
        wrapper.setState({ imagePreviewList: [] })
        expect(wrapper.instance().getNextImageUrl()).to.equal(undefined)
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList })
      })
    })

    describe('handleClickPreviousNextPage()', () => {
      it('should set displayedPictureIndex-- when previousNext equal DIRECTION.LEFT', () => {
        wrapper.setState({ displayedPictureIndex: 1 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.LEFT)
        expect(wrapper.state().displayedPictureIndex).to.equal(0)
      })
      it('should set displayedPictureIndex++ when previousNext equal DIRECTION.RIGHT', () => {
        wrapper.setState({ displayedPictureIndex: 1 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.RIGHT)
        expect(wrapper.state().displayedPictureIndex).to.equal(2)
      })
      it('should set displayedPictureIndex to 0 when previousNext equal DIRECTION.RIGHT and state.displayedPictureIndex === imagePreviewList.length - 1', () => {
        wrapper.setState({ displayedPictureIndex: stateMock.imagePreviewList.length - 1 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.RIGHT)
        expect(wrapper.state().displayedPictureIndex).to.equal(0)
      })
      it('should set displayedPictureIndex to imagePreviewList.length - 1 when previousNext equal DIRECTION.LEFT and state.displayedPictureIndex === 0', () => {
        wrapper.setState({ displayedPictureIndex: 0 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.LEFT)
        expect(wrapper.state().displayedPictureIndex).to.equal(stateMock.imagePreviewList.length - 1)
      })
    })

    describe('handleCarouselPositionChange()', () => {
      it('should set displayedPictureIndex to 2 when the param is 2', () => {
        wrapper.setState({ displayedPictureIndex: 0 })
        wrapper.instance().handleCarouselPositionChange(2)
        expect(wrapper.state().displayedPictureIndex).to.equal(2)
      })
      it('should not change displayedPictureIndex when the param < 0', () => {
        wrapper.setState({ displayedPictureIndex: 0 })
        wrapper.instance().handleCarouselPositionChange(-1)
        expect(wrapper.state().displayedPictureIndex).to.equal(0)
      })
    })

    describe('handleOpenDeleteFilePopup()', () => {
      it('should set displayPopupDelete to true', () => {
        wrapper.setState({ displayPopupDelete: false })
        wrapper.instance().handleOpenDeleteFilePopup()
        expect(wrapper.state().displayPopupDelete).to.equal(true)
      })
    })

    describe('handleCloseDeleteFilePopup()', () => {
      it('should set displayPopupDelete to false', () => {
        wrapper.setState({ displayPopupDelete: true })
        wrapper.instance().handleCloseDeleteFilePopup()
        expect(wrapper.state().displayPopupDelete).to.equal(false)
      })
    })

    describe('onClickSlickPlay()', () => {
      it('should start the auto play when play is true', () => {
        wrapper.instance().onClickSlickPlay(true)
        expect(wrapper.state().autoPlay).to.be.a('object')
      })
      it('should stop the auto play when play is false', () => {
        wrapper.instance().onClickSlickPlay(false)
        expect(wrapper.state().autoPlay).to.be.a('null')
      })
    })

    describe('rotateImg()', () => {
      it('should change the rotationAngle of the displayedPictureIndex', () => {
        const displayedPictureIndex = 1
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList })
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.RIGHT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(90)
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.RIGHT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(180)
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.RIGHT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(270)
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.RIGHT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(0)
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.LEFT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(270)
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.LEFT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(180)
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.LEFT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(90)
        wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.LEFT)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(0)
      })
      it('should handle the case when filSelected < 0', () => {
        const displayedPictureIndex = -1
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList })
        expect(wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.RIGHT)).to.be.a('undefined')
      })
      it('should handle the case when filSelected >= imagePreviewList.length', () => {
        const displayedPictureIndex = stateMock.imagePreviewList.length
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList })
        expect(wrapper.instance().rotateImg(displayedPictureIndex, DIRECTION.RIGHT)).to.be.a('undefined')
      })
      it('should handle the case when direction is undefined', () => {
        const displayedPictureIndex = 1
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList })
        wrapper.instance().rotateImg(displayedPictureIndex, undefined)
        expect(wrapper.state().imagePreviewList[displayedPictureIndex].rotationAngle).to.equal(0)
      })
    })

    describe('getRawFileUrlSelectedFile()', () => {
      it('should return the correct rawFileUrl', () => {
        const displayedPictureIndexTested = 1
        wrapper.setState({ displayedPictureIndex: displayedPictureIndexTested })
        expect(wrapper.instance().getRawFileUrlSelectedFile()).to.equal(stateMock.imagePreviewList[displayedPictureIndexTested].rawFileUrl)
      })
    })

    describe('buildBreadcrumbs()', () => {
      it('should build the correct breadcrumbsList when empty workspace gallery', () => {
        wrapper.setState({ imagePreviewList: [], folderId: null })
        wrapper.instance().buildBreadcrumbs(stateMock.content.workspaceLabel, { fileName: '', folderParentIdList: [] }, true)
        expect(wrapper.state().breadcrumbsList.length).to.equal(2)
        expect(wrapper.state().breadcrumbsList[0].link).to.equal(PAGE.WORKSPACE.DASHBOARD(props.data.config.appConfig.workspaceId))
        expect(wrapper.state().breadcrumbsList[1].label).to.equal('Gallery')
      })

      it('should build the correct breadcrumbsList when workspace gallery', () => {
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList, folderId: null })
        wrapper.instance().buildBreadcrumbs(stateMock.content.workspaceLabel, { fileName: '', folderParentIdList: [] }, false)
        expect(wrapper.state().breadcrumbsList.length).to.equal(3)
        expect(wrapper.state().breadcrumbsList[0].link).to.equal(PAGE.WORKSPACE.DASHBOARD(props.data.config.appConfig.workspaceId))
        expect(wrapper.state().breadcrumbsList[1].label).to.equal('Gallery')
        expect(wrapper.state().breadcrumbsList[2].link)
          .to.equal(PAGE.WORKSPACE.CONTENT(props.data.config.appConfig.workspaceId, 'file', stateMock.imagePreviewList[wrapper.state().displayedPictureIndex].contentId))
      })

      it('should build the correct breadcrumbsList when folder gallery', () => {
        const folderId = 1
        const folderDetail = { fileName: 'folder1', folderParentIdList: [2, 3] }
        wrapper.setState({ folderId: folderId })
        wrapper.setState({ imagePreviewList: stateMock.imagePreviewList })
        wrapper.instance().buildBreadcrumbs(stateMock.content.workspaceLabel, folderDetail, true)
        expect(wrapper.state().breadcrumbsList.length).to.equal(4)
        expect(wrapper.state().breadcrumbsList[0].link).to.equal(PAGE.WORKSPACE.DASHBOARD(props.data.config.appConfig.workspaceId))
        expect(wrapper.state().breadcrumbsList[1].link).to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/contents?folder_open=${folderId},${folderDetail.folderParentIdList.join(',')}`)
        expect(wrapper.state().breadcrumbsList[2].label).to.equal('Gallery')
        expect(wrapper.state().breadcrumbsList[3].link)
          .to.equal(PAGE.WORKSPACE.CONTENT(props.data.config.appConfig.workspaceId, 'file', stateMock.imagePreviewList[wrapper.state().displayedPictureIndex].contentId))
      })
    })
  })
})
