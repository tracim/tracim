import { PAGES as p } from '../../support/urls_commands'
import baseWorkspace from '../../fixtures/baseWorkspace.json'
import baseOtherUser from '../../fixtures/baseOtherUser.json'

describe.skip('Open publications in the thread app', () => {
  // FIXME MB - 2022-03-29 - Unstable test
  // See https://github.com/tracim/tracim/issues/5344
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
        cy.get('.autocomplete__item__active').should('be.visible').click()
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
        cy.get('.wsContentGeneric.thread .wsContentGeneric__header__close').should('be.visible').click()
    }

    cy.get('.sidebar__notification__item').should('be.visible').click()
    cy.get('.notification__list__item.isMention').should('be.visible').click()
    checkAndCloseThreadApp()

    cy.get('.sidebar__notification__item').should('be.visible').click()
    cy.get('.notification__list__item:not(.isMention)').contains('commented on').should('be.visible').click()
    checkAndCloseThreadApp()

    cy.get('.sidebar__item').first().should('be.visible').click() // recent activities
    cy.get('.feedItemHeader__title a').contains('News').should('be.visible').click()
    checkAndCloseThreadApp()

    cy.get('.sidebar__item[href="/ui/recent-activities"]').first().should('be.visible').click() // recent activities
    cy.get('.feedItemHeader__title a').contains('News').should('be.visible').click()
    checkAndCloseThreadApp()
  })
})
