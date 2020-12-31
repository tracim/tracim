import { PAGES } from '../../support/urls_commands'

const commentContent = 'the mention @nothing is invalid'
const fileTitle = 'FileTitle'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'
let fileId
let workspaceId

describe('In a file', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        .then(note => fileId = note.content_id)
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { workspaceId: workspaceId, contentType: 'file', contentId: fileId }
    })
  })

  describe('an invalid mention in the comment in simple edition mode', () => {
    it('should open a popup that contains this mention', () => {
      cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(commentContent)
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__mentions', '@nothing')
    })

    it('should remain in edition mode if user clicks on "Edit" in the popup', () => {
      cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(commentContent)
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', commentContent)
    })

    it('should save the document if user clicks at "Validate anyway" in the popup', () => {
      cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(commentContent)
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', commentContent)
    })
  })

  describe.skip('an invalid mention in the comment in advanced edition mode', () => {
    // RJ - 2020-12-28 - FIXME - See issue #3986
    it('should open a popup that contains this mention', () => {
      cy.get('.timeline__texteditor__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(commentContent))
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__mentions', '@nothing')
    })

    it('should remain in edition mode if user clicks on "Edit" in the popup', () => {
      cy.get('.timeline__texteditor__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(commentContent))
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', commentContent)
    })

    it('should save the document if user clicks on "Validate anyway" in the popup', () => {
      cy.get('.timeline__texteditor__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(commentContent))
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', commentContent)
    })
  })
})
