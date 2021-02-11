import { PAGES } from '../../support/urls_commands'

const noteTitle = 'Title'
const noteContent = 'the mention @nothing is invalid'
let noteId
let workspaceId

describe('In a note', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(noteTitle, workspaceId).then(note => noteId = note.content_id)
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { workspaceId: workspaceId, contentType: 'html-document', contentId: noteId }
    })
  })

  describe('an invalid mention in the content', () => {
    it('should open a popup that contains this mention', () => {
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(noteContent))
      cy.get('button.html-document__editionmode__submit.editionmode__button__submit')
        .should('be.visible')
        .click()
      cy.contains('.html-document__contentpage__textnote__mentions', '@nothing')
    })

    it('should remain in edition mode if user clicks on "Edit" in the popup', () => {
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(noteContent))
      cy.get('button.html-document__editionmode__submit.editionmode__button__submit')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()
      cy.get('.html-document__editionmode__container')
        .should('be.visible')
    })

    it('should save the document if user clicks on "Validate anyway" in the popup', () => {
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(noteContent))
      cy.get('button.html-document__editionmode__submit.editionmode__button__submit')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.html-document__contentpage__textnote__text', noteContent)
    })
  })

  describe('an invalid mention in the comment in simple edition mode', () => {
    it('should open a popup that contains this mention', () => {
      cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(noteContent)
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__mentions', '@nothing')
    })

    it('should remain in edition mode if user clicks on "Edit" in the popup', () => {
      cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(noteContent)
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', noteContent)
    })

    it('should save the document if user clicks on "Validate anyway" in the popup', () => {
      cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(noteContent)
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', noteContent)
    })
  })

  describe.skip('an invalid mention in the comment in advanced edition mode', () => {
    // RJ - 2020-12-28 - FIXME - See issue #3986
    it('should open a popup that contains this mention', () => {
      cy.get('.timeline__texteditor__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(noteContent))
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
        .then(() => cy.typeInTinyMCE(noteContent))
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', noteContent)
    })

    it('should save the document if user clicks on "Validate anyway" in the popup', () => {
      cy.get('.timeline__texteditor__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(noteContent))
      cy.get('.timeline__texteditor__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.timeline__texteditor__textinput', noteContent)
    })
  })
})
