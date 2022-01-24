import { PAGES } from '../../support/urls_commands'

const markAllAsReadButton = '[data-cy=markAllAsReadButton]'

describe('Notification Wall', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    cy.get('.notificationButton').click()
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should mark the notification as read after click on the circle', () => {
    cy.get('.notification__list__item__circle').first().click()
    cy.get('.notificationButton__notification').should('not.be.visible')
    cy.get('.notification__list__item').first().should('have.class', 'itemRead')
  })

  it('should have the `Mark All As Read` button', () => {
    cy.get(markAllAsReadButton).should('be.visible')
  })

  it('should mark all notifications as read after click on the `Mark All As Read` button', () => {
    cy.get(markAllAsReadButton).click()
    cy.get('.notification__list__item__circle').should('not.exist')
  })
})
