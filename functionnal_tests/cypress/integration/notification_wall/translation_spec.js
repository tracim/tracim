import { PAGES } from '../../support/urls_commands'

describe('Notification Wall', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get('.notificationButton').click()
  })

  it('should have translations', () => {
    cy.get('.notification__header__title').contains('Notifications').should('be.visible')

    cy.changeLanguage('fr')
    cy.get('.notification__header__title').contains('Notifications').should('be.visible')

    cy.changeLanguage('pt')
    cy.get('.notification__header__title').contains('Notificações').should('be.visible')

    cy.changeLanguage('de')
    cy.get('.notification__header__title').contains('Benachrichtigungen').should('be.visible')
  })
})
