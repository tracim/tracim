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
    cy.contains('.notification__header__title', 'Notifications').should('be.visible')

    cy.changeLanguage('fr')
    cy.get('.notificationButton').click()
    cy.contains('.notification__header__title', 'Notifications').should('be.visible')

    cy.changeLanguage('pt')
    cy.get('.notificationButton').click()
    cy.contains('.notification__header__title', 'Notificações').should('be.visible')

    cy.changeLanguage('de')
    cy.get('.notificationButton').click()
    cy.contains('.notification__header__title', 'Benachrichtigungen').should('be.visible')
  })
})
