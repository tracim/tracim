import { PAGES } from '../../support/urls_commands'

const threadTitle = 'Title'
const commentContent = 'the mention @nothing is invalid'
let threadId
let workspaceId

describe('In a thread', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createThread(threadTitle, workspaceId).then(note => threadId = note.content_id)
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { contentId: threadId }
    })
  })

  describe('an invalid mention in the comment in simple edition mode', () => {
    it('should open a popup that contains this mention', () => {
      cy.get('.commentArea__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(commentContent)
      cy.get('.commentArea__submit__btn')
        .should('be.visible')
        .click()
      cy.contains('.commentArea__mentions', '@nothing')
    })

    it('should remain in edition mode if user clicks on "Edit" in the popup', () => {
      cy.get('.commentArea__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(commentContent)
      cy.get('.commentArea__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()
      cy.contains('.commentArea__textinput', commentContent)
    })

    it('should save the document if user clicks on "Validate anyway" in the popup', () => {
      cy.get('.commentArea__textinput #wysiwygTimelineComment')
        .should('be.visible')
        .type(commentContent)
      cy.get('.commentArea__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.comment__body__content__text', commentContent)
    })
  })

  describe.skip('an invalid mention in the comment in advanced edition mode', () => {
    // RJ - 2020-12-28 - FIXME - See issue #3986
    it('should open a popup that contains this mention', () => {
      cy.get('.commentArea__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(commentContent))
      cy.get('.commentArea__submit__btn')
        .should('be.visible')
        .click()
      cy.contains('.commentArea__mentions', '@nothing')
    })

    it('should remain in edition mode if user clicks at "Edit" in the popup', () => {
      cy.get('.commentArea__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(commentContent))
      cy.get('.confirm_popup__button_confirm')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_confirm]')
        .should('be.visible')
        .click()
      cy.contains('.thread__contentpage', commentContent)
    })

    it('should save the document if user clicks at "Validate anyway" in the popup', () => {
      cy.get('.commentArea__advancedtext__btn')
        .should('be.visible')
        .click()
      cy.waitForTinyMCELoaded()
        .then(() => cy.typeInTinyMCE(commentContent))
      cy.get('.commentArea__submit__btn')
        .should('be.visible')
        .click()
      cy.get('[data-cy=confirm_popup__button_cancel]')
        .should('be.visible')
        .click()
      cy.contains('.thread__contentpage', commentContent)
    })
  })
})
