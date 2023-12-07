import { PAGES } from '../../support/urls_commands.js'

describe('Notification Wall', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.createHtmlDocument('My first note is nice', workspace.workspace_id).then(content => {
        cy.createComment(workspace.workspace_id, content.content_id, 'comment 1')
        cy.createComment(workspace.workspace_id, content.content_id, 'comment 2')
        cy.createComment(workspace.workspace_id, content.content_id, 'comment 3')
        cy.createComment(workspace.workspace_id, content.content_id, 'comment 4')
      })
      cy.createHtmlDocument('My second note is nice', workspace.workspace_id).then(content => {
        cy.createComment(workspace.workspace_id, content.content_id, 'comment 5')
      })
    })
    cy.logout()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get('.sidebar__notification__item').click()
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('The filter input', () => {
    it('should filter the results when typing inside it', () => {
      cy.get('[data-cy=FilterNotificationButton]').click()
      cy.get('[data-cy=textInputComponent__text]').should('be.visible')

      cy.get('[data-cy=textInputComponent__text]')
        .type('made 8 contributions')
      cy.get('.notification__list .notification__list__item')
        .should('have.length', 1)
        // INFO - CH - 2023-12-07 - Clicking on the group to open it
        .click()

      cy.get('[data-cy=textInputComponent__text]')
        .clear()
      cy.get('.notification__list .notification__list__item')
        .should('have.length', 8)

      cy.get('[data-cy=textInputComponent__text]')
        .clear()
        .type('Global manager commented on My first note is nice')
      cy.get('.notification__list .notification__list__item')
        .should('have.length', 4)

      cy.get('[data-cy=textInputComponent__text]')
        .clear()
        .type('my first note')
      cy.get('.notification__list .notification__list__item')
        .should('have.length', 5)

      cy.get('[data-cy=textInputComponent__text]')
        .clear()
        .type('My space')
      cy.get('.notification__list .notification__list__item')
        .should('have.length', 8)

      cy.get('[data-cy=textInputComponent__text]')
        .clear()
        .type('no match for this string')
      cy.get('.notification__list .notification__list__item')
        .should('have.length', 0)
    })
  })
})
