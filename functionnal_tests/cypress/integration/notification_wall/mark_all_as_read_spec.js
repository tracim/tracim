import { PAGES } from '../../support/urls_commands'

describe('Notification Wall', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
    this.skip() // FIXME - GB - 2020-08-10 - To be activate when the notification wall (https://github.com/tracim/tracim/issues/2840) and button's header (https://github.com/tracim/tracim/issues/3323) were merge
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should have the Mark All As Read button', () => {
    cy.get('[data-cy=markAllAsReadButton]').should('be.visible')
  })

  it('should mark all notifications as read when click at the Mark All As Read button', () => {
    cy.get('[data-cy=markAllAsReadButton]').click()
    cy.get('.notification__list__item__circle').should('not.exist')
  })
})
