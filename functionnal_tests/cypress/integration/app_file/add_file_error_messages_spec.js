import { PAGES as p, URLS } from '../../support/urls_commands';
import { SELECTORS as s } from '../../support/generic_selector_commands'

const pngFile = 'artikodin.png'
let workspaceId

describe('In a workspace', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: p.DASHBOARD, params: { workspaceId: workspaceId } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should open the app file with the newly added file', function () {
    cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
      .get('button[title="Upload files"]')
      .click()

    cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', 'file_exemple1.png')
    cy.getTag({ selectorName: s.CARD_POPUP_BODY })
      .get('[data-cy=popup__createcontent__form__button]')
      .click()
    cy.getTag({ selectorName: s.CONTENT_FRAME })
      .get('.previewcomponent').should('have.length', 1)
    cy.getTag({ selectorName: s.CONTENT_FRAME })
      .get('.selectStatus').contains('Opened')
    cy.url().should('include', URLS[p.FILE]({workspaceId, fileId: '1'}))
  })

  it('should display an error popup containing a descriptive error when uploading a single file', function () {
    cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
      .get('button[title="Upload files"]')
      .click()

    cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', 'file_exemple1.png')
    cy.getTag({ selectorName: s.CARD_POPUP_BODY })
      .get('[data-cy=popup__createcontent__form__button]')
      .click()
    cy.getTag({ selectorName: s.CARD_POPUP_BODY })
      .get('[data-cy=popup__createcontent__form__button]')

    cy.get('.flashmessage__container__content__text__paragraph')
      .should('exist')
    cy.get('.flashmessage__container__content__text__paragraph')
      .should('include.text', 'already exists')
  })

  it('should display an error popup containing a descriptive error when uploading multiple files', function () {
    const fileName1 = 'png_exemple3'
    const fileName2 = 'pdf_exemple3'

    cy.createFile(pngFile, 'image/png', `${fileName1}.png`, workspaceId)

    cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
      .get('button[title="Upload files"]')
      .click()

    cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName1}.png`)
    cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName2}.png`)
    cy.getTag({ selectorName: s.CARD_POPUP_BODY })
      .get('[data-cy=popup__createcontent__form__button]')
      .click()

    cy.get('.flashmessage__container__content__text__paragraph')
      .should('exist')
    cy.get('.flashmessage__container__content__text__paragraph')
      .should('include.text', 'already exists')
  })

  it('should display an error popup containing a generic error when uploading multiple erroneous files', function () {
    const fileName1 = 'png_exemple3'
    const fileName2 = 'pdf_exemple3'

    cy.createFile(pngFile, 'image/png', `${fileName1}.png`, workspaceId)

    cy.getTag({ selectorName: s.WORKSPACE_DASHBOARD })
      .get('button[title="Upload files"]')
      .click()

    cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName1}.png`)
    cy.dropFixtureInDropZone(pngFile, 'image/png', '.filecontent__form', `${fileName2}.png`)
    cy.getTag({ selectorName: s.CARD_POPUP_BODY })
      .get('[data-cy=popup__createcontent__form__button]')
      .click()

    cy.get('.flashmessage__container__content__text__paragraph')
      .should('exist')
    cy.get('.flashmessage__container__content__text__paragraph')
      .should('include.text', 'Error while uploading file(s)')
  })
})
