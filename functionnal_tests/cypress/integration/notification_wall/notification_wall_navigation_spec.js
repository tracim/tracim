import { PAGES } from '../../support/urls_commands'

describe('Notification wall', () => {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.createHtmlDocument('title', workspace.workspace_id).then(content => {
        cy.createComment(workspace.workspace_id, content.content_id, 'test')
      })
    })
    cy.logout()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get('.notificationButton').click()
  })

  it('should close when clicked at the X', () => {
    cy.get('.notification__header__close').click()
    cy.get('.notification__header__title').contains('Notifications').should('not.be.visible')
  })

  it('should close when clicked at a notification', () => {
    cy.get('.notification__list__item').first().click()
    cy.get('.notification__header__title').contains('Notifications').should('not.be.visible')
  })

  it("should have notification list item with author's avatar", () => {
    cy.get('.notification__list__item').first().find('.avatar').should('be.visible')
  })
})
