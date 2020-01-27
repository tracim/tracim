import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Gallery as GalleryWithoutHOC } from '../../src/container/Gallery.jsx'
import { DIRECTION } from '../../src/helper'
import { defaultDebug } from 'tracim_frontend_lib'
import {
  mockGetContents200,
  mockGetWorkspaceDetail200,
  mockGetFolderDetailDetail200
} from '../apiMock.js'

describe('<Gallery />', () => {
  const folderId = 1
  const folderName = 'folderTest'

  const props = {
    data: {
      config: {
        apiUrl: 'http://localhost:1337/api/v2',
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
    }
  }

  const stateMock = {
    content: {
      content_type: 'file',
      workspace_id: 0,
      workspaceLabel: 'workspaceTest'
    },
    imagesPreviews: [
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
  mockGetFolderDetailDetail200(props.data.config.apiUrl, props.data.config.appConfig.workspaceId, folderId,folderName, null)

  const wrapper = shallow(<GalleryWithoutHOC {...props} t={tradKey => tradKey}/>)
  wrapper.setState(stateMock)

  describe('static design', () => {
    describe('rotation buttons', () => {
      it('should rotate the right image when rotation buttons are clicked', () => {
        const fileSelected = 1
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews, fileSelected })
        wrapper.find('.gallery__action__button > button.gallery__action__button__rotation__left').simulate('click')
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(270)
        wrapper.find('.gallery__action__button > button.gallery__action__button__rotation__right').simulate('click')
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(0)
      })
    })

    describe('play button', () => {
      it('should start the slideshow when the button play is clicked', () => {
        wrapper.find('.gallery__action__button__play').simulate('click')
        expect(wrapper.find('.gallery__action__button__play > i.fa.fa-pause')).to.be.lengthOf(1)
        expect(wrapper.state().autoPlay).to.be.a('object')
      })
      it('should stop the slideshow when the button pause is clicked', () =>  {
        wrapper.find('.gallery__action__button__play').simulate('click')
        expect(wrapper.find('.gallery__action__button__play > i.fa.fa-play')).to.be.lengthOf(1)
        expect(wrapper.state().autoPlay).to.be.a('null')
      })
    })
  })

  describe('functions tests', () => {
    describe('getPreviousImageUrl()', () => {
      it('should return the previous imagePreview when filSelected > 0', () => {
        wrapper.setState({ fileSelected: 1 })
        expect(wrapper.instance().getPreviousImageUrl()).to.equal(stateMock.imagesPreviews[0].lightBoxUrlList[0])
      })
      it('should return the last imagePreview when fileSelected === 0', () => {
        wrapper.setState({ fileSelected: 0 })
        expect(wrapper.instance().getPreviousImageUrl()).to.equal(stateMock.imagesPreviews[stateMock.imagesPreviews.length-1].lightBoxUrlList[0])
      })
      it('should return undefined when imagePreviews length <= 1', () => {
        wrapper.setState({ imagesPreviews: [] })
        expect(wrapper.instance().getPreviousImageUrl()).to.equal(undefined)
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
      })
    })

    describe('getNextImageUrl()', () => {
      it('should return the next imagePreview when filSelected < imagesPreviews.length', () => {
        wrapper.setState({ fileSelected: 1 })
        expect(wrapper.instance().getNextImageUrl()).to.equal(stateMock.imagesPreviews[2].lightBoxUrlList[0])
      })
      it('should return the first imagePreview when filSelected === imagesPreviews.length-1', () => {
        wrapper.setState({ fileSelected: stateMock.imagesPreviews.length - 1 })
        expect(wrapper.instance().getNextImageUrl()).to.equal(stateMock.imagesPreviews[0].lightBoxUrlList[0])
      })
      it('should return undefined when imagePreviews length <= 1', () => {
        wrapper.setState({ imagesPreviews: [] })
        expect(wrapper.instance().getNextImageUrl()).to.equal(undefined)
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
      })
    })

    describe('handleClickPreviousNextPage()', () => {
      it('should set fileSelected-- when previousNext equal DIRECTION.LEFT', () => {
        wrapper.setState({ fileSelected: 1 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.LEFT)
        expect(wrapper.state().fileSelected).to.equal(0)
      })
      it('should set fileSelected++ when previousNext equal DIRECTION.RIGHT', () => {
        wrapper.setState({ fileSelected: 1 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.RIGHT)
        expect(wrapper.state().fileSelected).to.equal(2)
      })
      it('should set fileSelected to 0 when previousNext equal DIRECTION.RIGHT and state.fileSelected === imagesPreviews.length - 1', () => {
        wrapper.setState({ fileSelected: stateMock.imagesPreviews.length - 1 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.RIGHT)
        expect(wrapper.state().fileSelected).to.equal(0)
      })
      it('should set fileSelected to imagesPreviews.length - 1 when previousNext equal DIRECTION.LEFT and state.fileSelected === 0', () => {
        wrapper.setState({ fileSelected: 0 })
        wrapper.instance().handleClickPreviousNextPage(DIRECTION.LEFT)
        expect(wrapper.state().fileSelected).to.equal(stateMock.imagesPreviews.length - 1)
      })
    })

    describe('onCarouselPositionChange()', () => {
      it('should set fileSelected to 2 when the param is 2', () => {
        wrapper.setState({ fileSelected: 0 })
        wrapper.instance().onCarouselPositionChange(2)
        expect(wrapper.state().fileSelected).to.equal(2)
      })
      it('should not change fileSelected when the param < 0', () => {
        wrapper.setState({ fileSelected: 0 })
        wrapper.instance().onCarouselPositionChange(-1)
        expect(wrapper.state().fileSelected).to.equal(0)
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
      it('should change the rotationAngle of the fileSelected', () => {
        const fileSelected = 1
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
        wrapper.instance().rotateImg(fileSelected, DIRECTION.RIGHT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(90)
        wrapper.instance().rotateImg(fileSelected, DIRECTION.RIGHT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(180)
        wrapper.instance().rotateImg(fileSelected, DIRECTION.RIGHT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(270)
        wrapper.instance().rotateImg(fileSelected, DIRECTION.RIGHT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(0)
        wrapper.instance().rotateImg(fileSelected, DIRECTION.LEFT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(270)
        wrapper.instance().rotateImg(fileSelected, DIRECTION.LEFT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(180)
        wrapper.instance().rotateImg(fileSelected, DIRECTION.LEFT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(90)
        wrapper.instance().rotateImg(fileSelected, DIRECTION.LEFT)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(0)
      })
      it('should handle the case when filSelected < 0', () => {
        const fileSelected = -1
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
        expect(wrapper.instance().rotateImg(fileSelected, DIRECTION.RIGHT)).to.be.a('undefined')
      })
      it('should handle the case when filSelected >= imagesPreviews.length', () => {
        const fileSelected = stateMock.imagesPreviews.length
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
        expect(wrapper.instance().rotateImg(fileSelected, DIRECTION.RIGHT)).to.be.a('undefined')
      })
      it('should handle the case when direction is undefined', () => {
        const fileSelected = 1
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
        wrapper.instance().rotateImg(fileSelected, undefined)
        expect(wrapper.state().imagesPreviews[fileSelected].rotationAngle).to.equal(0)
      })
    })

    describe('getRawFileUrlSelectedFile()', () => {
      it('should return the correct rawFileUrl', () => {
        const fileSelectedTested = 1
        wrapper.setState({ fileSelected: fileSelectedTested })
        expect(wrapper.instance().getRawFileUrlSelectedFile()).to.equal(stateMock.imagesPreviews[fileSelectedTested].rawFileUrl)
      })
    })

    describe('buildBreadcrumbs()', () => {
      it('should build the correct breadcrumbsList when workspace gallery', () => {
        wrapper.instance().buildBreadcrumbs(stateMock.content.workspaceLabel, { fileName: '', folderParentIdList: [] }, false)
        expect(wrapper.state().breadcrumbsList.length).to.equal(4)
        expect(wrapper.state().breadcrumbsList[0].link.props.to).to.equal(`/ui`)
        expect(wrapper.state().breadcrumbsList[1].link.props.to).to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/dashboard`)
        expect(wrapper.state().breadcrumbsList[2].link.props.to).to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/contents?folder_open=${folderId},`)
        expect(wrapper.state().breadcrumbsList[3].link.props.to)
          .to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/contents/file/${stateMock.imagesPreviews[wrapper.state().fileSelected].contentId}`)
      })
      it('should build the correct breadcrumbsList when empty workspace gallery', () => {
        wrapper.setState({ imagesPreviews: [] })
        wrapper.instance().buildBreadcrumbs(stateMock.content.workspaceLabel, { fileName: '', folderParentIdList: [] }, true)
        expect(wrapper.state().breadcrumbsList.length).to.equal(3)
        expect(wrapper.state().breadcrumbsList[0].link.props.to).to.equal(`/ui`)
        expect(wrapper.state().breadcrumbsList[1].link.props.to).to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/dashboard`)
        expect(wrapper.state().breadcrumbsList[2].link.props.to).to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/contents?folder_open=${folderId},`)
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
      })
      it('should build the correct breadcrumbsList when folder gallery', () => {
        const folderId = 1
        const folderDetail = { fileName: 'folder1', folderParentIdList: [ 2, 3] }
        wrapper.setState({ folderId: folderId })
        wrapper.setState({ imagesPreviews: stateMock.imagesPreviews })
        wrapper.instance().buildBreadcrumbs(stateMock.content.workspaceLabel, folderDetail, true)
        expect(wrapper.state().breadcrumbsList.length).to.equal(4)
        expect(wrapper.state().breadcrumbsList[0].link.props.to).to.equal(`/ui`)
        expect(wrapper.state().breadcrumbsList[1].link.props.to).to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/dashboard`)
        expect(wrapper.state().breadcrumbsList[2].link.props.to).to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/contents?folder_open=${folderId},${folderDetail.folderParentIdList.join(',')}`)
        expect(wrapper.state().breadcrumbsList[3].link.props.to)
          .to.equal(`/ui/workspaces/${props.data.config.appConfig.workspaceId}/contents/file/${stateMock.imagesPreviews[wrapper.state().fileSelected].contentId}`)
      })
    })
  })
})
