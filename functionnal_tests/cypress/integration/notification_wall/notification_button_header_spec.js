import { PAGES } from '../../support/urls_commands'

describe('Notification button at header', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  it('should open the notification wall when clicked one time', () => {
    cy.get('.notificationButton').click()
    cy.get('.notification__header__title').contains('Notifications').should('be.visible')
  })

  it('should close the notification wall when clicked two times', () => {
    cy.get('.notificationButton').click()
    cy.get('.notification__header__title').contains('Notifications')
    cy.get('.notificationButton').click()
    cy.get('.notification__header__title').contains('Notifications').should('not.be.visible')
  })
})
