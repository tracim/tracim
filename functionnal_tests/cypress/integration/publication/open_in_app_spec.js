import { PAGES as p } from '../../support/urls_commands'
import baseWorkspace from '../../fixtures/baseWorkspace.json'
import baseOtherUser from '../../fixtures/baseOtherUser.json'

describe('Open publications in the thread app', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createUser('baseOtherUser').then(user => {
        cy.addUserToWorkspace(user.user_id, baseWorkspace.workspace_id)
        cy.visitPage({
          pageName: p.PUBLICATION,
          params: { workspaceId: baseWorkspace.workspace_id },
          waitForTlm: true
        })

        cy.get('#wysiwygTimelineCommentPublication').type(' @' + user.username + '  ')
        cy.get('.commentArea__submit__btn').click()
        cy.get('.feedItem__publication__body__content').should('be.visible')
        cy.clearCookies()
        cy.login(baseOtherUser)
        cy.visitPage({ pageName: p.HOME })
    })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should redirect to the thread app with the right icon', () => {
    function checkAndCloseThreadApp () {
        cy.get('.wsContentGeneric.thread .wsContentGeneric__header__icon i.fa-stream').should('have.attr', 'style', 'color: rgb(102, 31, 152);')
        cy.get('.wsContentGeneric.thread .wsContentGeneric__header__close').click()
    }

    cy.get('.notificationButton__btn').click()
    cy.get('.notification__list__item.isMention').click()
    checkAndCloseThreadApp()

    cy.get('.notificationButton__btn').click()
    cy.get('.notification__list__item:not(.isMention)').contains('commented on').click()
    checkAndCloseThreadApp()

    cy.get('.sidebar__content__navigation__item').first().click() // recent activities
    cy.get('.feedItemHeader__title a').contains('News').click()
    checkAndCloseThreadApp()

    cy.get('.sidebar__content__navigation__item[href="/ui/recent-activities"]').first().click() // recent activities
    cy.get('.feedItemHeader__title a').contains('News').click()
    checkAndCloseThreadApp()
  })
})
