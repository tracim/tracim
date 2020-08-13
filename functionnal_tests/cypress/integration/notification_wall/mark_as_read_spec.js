import { PAGES } from '../../support/urls_commands'

const markAllAsReadButton = '[data-cy=markAllAsReadButton]'
const notReadNotificationCircle = '.notification__list__item .notification__list__item__circle'

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

  it('should mark the notification as read when click at it', () => {
    cy.get('.notification__list__item').first().click()
    cy.get('.notificationButton').click()
    cy.get(notReadNotificationCircle).first().should('not.exist')
  })

  it('should have the Mark All As Read button', () => {
    cy.get(markAllAsReadButton).should('be.visible')
  })

  it('should mark all notifications as read when click at the Mark All As Read button', () => {
    cy.get(markAllAsReadButton).click()
    cy.get('.notification__list__item__circle').should('not.exist')
  })
})
