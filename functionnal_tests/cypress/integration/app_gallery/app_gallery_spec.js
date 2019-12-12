import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('App Gallery', function () {
  let workspaceId
  let folder1 = { label: 'first Folder' }
  const files = [{
      title: 'fileTest1',
      fullFilename: 'Linux-Free-PNG.png',
      contentType: 'image/png'
    }, {
      title: 'fileTest2',
      fullFilename: 'Linux-Free-PNG.png',
      contentType: 'image/png'
    }, {
      title: 'fileTest3',
      fullFilename: 'artikodin.png',
      contentType: 'image/png'
    }, {
      title: 'fileTest4',
      fullFilename: 'artikodin.png',
      contentType: 'image/png'
  }]

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.createFile(files[0].fullFilename, files[0].contentType, files[0].title, workspace.workspace_id)
        .then(newContent => files[0].id = newContent.content_id)

      cy.createFile(files[1].fullFilename, files[1].contentType, files[1].title, workspace.workspace_id)
        .then(newContent => files[1].id  = newContent.content_id)

      cy.createFile(files[2].fullFilename, files[2].contentType, files[2].title, workspace.workspace_id)
        .then(newContent => files[2].id = newContent.content_id)


      cy.createFolder(folder1.label, workspaceId).then(f => {
        folder1 = f
        cy.createFile(files[3].fullFilename, files[3].contentType, files[3].title, workspace.workspace_id, folder1.content_id)
          .then(newContent => files[3].id = newContent.content_id)
      })

    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  describe('Open gallery App', () => {
    it('click to workspace gallery button should redirect to the gallery app', () => {
      cy.visitPage({
        pageName: PAGES.DASHBOARD,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
        .find('[data-cy=contentTypeBtn_gallery]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .should('be.visible')
    })
    it('click to workspace gallery button in the sidebar should redirect to the gallery app', () => {
      cy.visitPage({
        pageName: PAGES.HOME,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId } }).click()
      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId } })
        .get('[data-cy=sidebar_subdropdown-gallery]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .should('be.visible')
    })
    it('open a folder gallery with button extended action', () => {
      cy.visitPage({
        pageName: PAGES.CONTENTS,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id }})
        .find('.extandedaction__button')
        .click()
      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id }})
        .find('[data-cy=extended_action_gallery]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[3].title}']`)
        .should('be.visible')
    })
  })
  describe('Carousel should be able to navigate through files', () => {
    before(() => {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
    })

    it('Get previous image with the left arrow', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}']`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .find('.carousel__arrow.arrowprev')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[2].title}']`)
        .should('be.visible')
    })
    it('Get next image with the right arrow', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .find('.carousel__arrow.arrownext')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}']`)
        .should('be.visible')
    })
    it('should start the autoPlay when the autoPlay is clicked', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.gallery__action__button__auto__play`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}']`)
        .should('be.visible')
    })
  })

  describe('Rotation test', () => {
    before(() => {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
    })

    it('the image should be rotated to the left when the right rotate button is clicked', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}']`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`button.gallery__action__button__rotation__left`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}'].rotate270`)
        .should('be.visible')
    })

    it('the image should be rotated to the right when the left rotate button is clicked', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`button.gallery__action__button__rotation__right`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}'].rotate0`)
        .should('be.visible')
    })
  })

  describe('ImageLightBox', () => {
    before(() => {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
    })

    it('should be able to open the lightbox', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}']:visible`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.gallery__action__button__lightbox`)
        .should('be.visible')
    })
    it('should enable fullscreen when the fullscreen button is clicked', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.gallery__action__button__lightbox__fullscreen`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.fullscreen.fullscreen-enabled`)
        .should('be.visible')
    })
  })

  describe('Delete file', () => {
    before(() => {
      cy.loginAs('administrators')
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
    })

    it('should be able to delete a file', () => {
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}']`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`button.gallery__action__button__delete`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.gallery__delete__file__popup`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`[data-cy=gallery__delete__file__popup__body__btn__delete]`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${files[0].title}']`)
        .should('be.not.visible')
    })
  })
})
