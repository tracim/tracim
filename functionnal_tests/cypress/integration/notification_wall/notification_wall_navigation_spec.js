import { PAGES } from '../../support/urls_commands'

describe('Notification wall', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
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
