import { PAGES } from '../../support/urls_commands'

const markAllAsReadButton = '[data-cy=markAllAsReadButton]'

describe('Notification Wall', () => {
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
    cy.get('.sidebar__notification__item').click()
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  // TODO - MP - 2022-07-05 - This test is skipped due to an acceptable bug
  // when you click on a notification group that is grouped by a space you
  // aren't redirected to the space
  // https://github.com/tracim/tracim/issues/5764
  it.skip('should mark the notification as read after click on it', () => {
    cy.get('.notification__list__item').first().click()
    cy.get('.notification__list__item').should('not.be.visible')
    cy.get('.sidebar__notification__item').click()
    // cy.get('.sidebar__notification__item').should('not.be.visible')
    cy.get('.notification__list__item').first().should('have.class', 'itemRead')
  })

  it('should mark the notification as read after click on the circle', () => {
    cy.get('.notification__list__item__circle').first().click()
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
