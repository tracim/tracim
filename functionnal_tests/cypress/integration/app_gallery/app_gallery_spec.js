import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('App Gallery', function () {
  let workspaceId
  let otherWorkspaceId
  let folder1 = { label: 'first Folder' }
  const createdFiles = {
    file1: {
      title: 'fileTest1',
      fullFilename: 'Linux-Free-PNG.png',
      contentType: 'image/png'
    },
    file2: {
      title: 'fileTest2',
      fullFilename: 'Linux-Free-PNG.png',
      contentType: 'image/png'
    },
    file3: {
      title: 'fileTest3',
      fullFilename: 'artikodin.png',
      contentType: 'image/png'
    },
    file4: {
      title: 'fileTest4',
      fullFilename: 'artikodin.png',
      contentType: 'image/png'
    }
  }

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.createFile(createdFiles.file1.fullFilename, createdFiles.file1.contentType, createdFiles.file1.title, workspace.workspace_id)
        .then(newContent => createdFiles.file1.id = newContent.content_id)

      cy.createFile(createdFiles.file2.fullFilename, createdFiles.file2.contentType, createdFiles.file2.title, workspace.workspace_id)
        .then(newContent => createdFiles.file2.id = newContent.content_id)

      cy.createFile(createdFiles.file3.fullFilename, createdFiles.file3.contentType, createdFiles.file3.title, workspace.workspace_id)
        .then(newContent => createdFiles.file3.id = newContent.content_id)

      cy.createFolder(folder1.label, workspaceId).then(f => {
        folder1 = f
        cy.createFile(createdFiles.file4.fullFilename, createdFiles.file4.contentType, createdFiles.file4.title, workspace.workspace_id, folder1.content_id)
          .then(newContent => createdFiles.file4.id = newContent.content_id)
      })
    })
    cy.createRandomWorkspace().then(workspace => {
      otherWorkspaceId = workspace.workspace_id
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('Open gallery App', () => {
    it('click to workspace gallery button should redirect to the gallery app', () => {
      cy.visitPage({
        pageName: PAGES.DASHBOARD,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
        .find('button[title="Open the gallery"]')
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
        .find('.sidebar__content__navigation__item__menu')
        .click()
        .get('[data-cy=sidebar_subdropdown-gallery]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .should('be.visible')
    })
    it('click to another workspace gallery button in the sidebar should update the gallery app contents', function () {
      // INFO - GM - 2020/07/16 - Skipping this test because it fails in TravisCI but pass locally
      // https://github.com/tracim/tracim/issues/3341
      this.skip()

      cy.visitPage({
        pageName: PAGES.HOME,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId } }).click()
      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId } })
        .find('.sidebar__content__navigation__item__menu')
        .click()
        .get('[data-cy=sidebar_subdropdown-gallery]')
        .click()
      cy.getTag({ selectorName: s.WORKSPACE_MENU, params: { workspaceId: otherWorkspaceId } })
        .click()
        .find('[data-cy=sidebar_subdropdown-gallery]')
        .click()
      cy.contains('.gallery-scrollView', "There isn't any previewable content at that folder's root.")
    })
    it('open a folder gallery with button extended action', () => {
      cy.visitPage({
        pageName: PAGES.CONTENTS,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id } })
        .find('.extandedaction')
        .click()
      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id } })
        .find('[data-cy=extended_action_gallery]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file4.title}']`)
        .should('be.visible')
    })
  })

  describe('Carousel should be able to navigate through files', () => {
    it('Get previous image with the left arrow', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.get('.sidebar__expand')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .find('.carousel__arrow.arrowprev')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file3.title}']`)
        .should('be.visible')
    })
    it('Get next image with the right arrow', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .find('.carousel__arrow.arrownext')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file2.title}']`)
        .should('be.visible')
    })
    it('should start the autoPlay and hide arrows when the autoPlay is clicked', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.get('.sidebar__expand')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__auto__play]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file2.title}']`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.carousel__arrow.arrownext')
        .should('be.not.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.carousel__arrow.arrowprev')
        .should('be.not.visible')
    })
  })

  describe('Rotation test', () => {
    it('the image should be rotated to the left when the right rotate button is clicked', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('button.gallery__action__button__rotation__left')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}'].rotate270`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.carousel__item__preview__content__image > img').then(($img) => {
          cy.window().then(win => {
            cy.getTag({ selectorName: s.GALLERY_FRAME })
              .get('.carousel__item__preview__content__image').then(($imgContainer) => {
                cy.wrap($img[0].getBoundingClientRect().height).should('eq',
                  $imgContainer[0].clientHeight - (
                    parseFloat(win.getComputedStyle($imgContainer[0]).paddingTop) +
                    parseFloat(win.getComputedStyle($imgContainer[0]).paddingBottom)
                  )
                )
              })
          })
        })
        // A big image should use the full available height when rotated
    })

    it('the image should be rotated to the right when the left rotate button is clicked', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('button.gallery__action__button__rotation__right')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}'].rotate90`)
        .should('be.visible')
    })
  })

  describe('ImageLightBox', () => {
    it('should be able to open the lightbox', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']:visible`)
        .click()
    })
    it('should enable fullscreen when the fullscreen button is clicked', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']:visible`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__lightbox__fullscreen]')
        .click()
      // INFO - GM - 2020-01-14 we check only if the div exist here to test if fullscreen mode is activated because cypress don't render it properly
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.fullscreen.fullscreen-enabled')
    })
    it('should hide arrows when the autoPlay is enabled', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']:visible`)
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__lightbox__auto__play]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.ril-next-button.ril__navButtons')
        .should('be.not.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.ril-prev-button.ril__navButtons')
        .should('be.not.visible')
    })
    it('should be responsive on mobile', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']:visible`)
        .click()
      cy.viewport('iphone-4') // INFO - GM - 2020/03/05 - 320x480, smallest common screen which is used these days (Iphone SE)
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__lightbox__auto__play]')
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__lightbox__fullscreen]')
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.gallery__action__button__lightbox__rotation__right')
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__lightbox__rotation__left]')
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.gallery__action__button__lightbox__openRawContent')
        .should('be.visible')
    })
  })

  describe('Delete file', () => {
    it('should be able to delete a file', () => {
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']`)
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__delete]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('.gallery__delete__file__popup')
        .should('be.visible')
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__delete__file__popup__body__btn__delete]')
        .click()
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get(`.carousel__item__preview__content__image > img[alt='${createdFiles.file1.title}']`)
        .should('be.not.visible')
    })
    it('should no display the delete button if user don\'t have right to delete file', () => {
      cy.loginAs('users')
      cy.visitPage({
        pageName: PAGES.GALLERY,
        params: { workspaceId }
      })
      cy.getTag({ selectorName: s.GALLERY_FRAME })
        .get('[data-cy=gallery__action__button__delete]')
        .should('be.not.visible')
    })
  })
})
