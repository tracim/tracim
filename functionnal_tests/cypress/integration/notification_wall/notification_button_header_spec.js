import { PAGES } from '../../support/urls_commands'
import baseUser from '../../fixtures/baseUser.json'
import baseWorkspace from '../../fixtures/baseWorkspace.json'
import defaultAdmin from '../../fixtures/defaultAdmin.json'


const threadTitle = 'Title'
const commentAll = 'sending a mention to @all'
const comment = 'sending a regular notification'
let threadId
let workspaceId

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

describe('Check notification dot', () => {
  const allowedUserList = [
    defaultAdmin,
    baseUser
  ]
  for (const user of allowedUserList) {
    describe(`As ${user.username} sending ${baseUser.username} a global notification`, () => {
      beforeEach(function () {
        cy.resetDB()
        cy.setupBaseDB()
        cy.login(user)
        cy.fixture('baseWorkspace').as('workspace').then(workspace => {
          workspaceId = workspace.workspace_id
        cy.createThread(threadTitle, workspaceId).then(note => threadId = note.content_id)
        })
      })

      beforeEach(function () {
        cy.loginAs('users')
        cy.visitPage({
          pageName: PAGES.CONTENT_OPEN,
          params: { workspaceId: workspaceId, contentType: 'thread', contentId: threadId }
        })
      })

      describe('an invalid mention in the comment in simple edition mode', () => {
        it('should open a popup that contains this mention', () => {
          cy.get('.timeline__texteditor__textinput #wysiwygTimelineComment')
            .should('be.visible')
            .type(comment)
          cy.get('.timeline__texteditor__submit__btn')
            .should('be.visible')
            .click()
          // cy.contains('.timeline__texteditor__mentions', '@nothing')
        })
      })
    }
  )}

  it('User should see a notification', function () {
    cy.logout()
    cy.loginAs('administrators')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { workspaceId: workspaceId, contentType: 'thread', contentId: threadId }
    })
    // cy.get('[data-cy=revision_data_2]').within(() => {
    //   cy.get('.revision__data__infos__author').contains('Global manager').should('be.visible')
    // })
  })

})
