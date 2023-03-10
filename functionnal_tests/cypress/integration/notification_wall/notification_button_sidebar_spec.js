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
    cy.get('.sidebar__notification__item').click()
    cy.get('.notification__header__title').contains('Notifications').should('be.visible')
  })

  it('should close the notification wall when clicked two times', () => {
    cy.get('.sidebar__notification__item').click()
    cy.get('.notification__header__title').contains('Notifications')
    cy.get('.sidebar__notification__item').click()
    cy.get('.notification__header__title').contains('Notifications').should('not.be.visible')
  })
})

describe('Check notification dot', () => {
  describe('Creating a thread', () => {
    beforeEach(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.login(baseUser)
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createThread(threadTitle, workspaceId).then(note => {
          threadId = note.content_id
          cy.visitPage({
            pageName: PAGES.CONTENT_OPEN,
            params: { contentId: threadId }
          })
        })
        cy.contains('.sidebar__title__button', baseUser.public_name)
      })
    })

    describe(`As ${baseUser.username} sending ${defaultAdmin.username} a notifications`, () => {
      it('create a general notifiation', () => {
        cy.get('.componentTitle').should('be.visible')
        cy.inputInTinyMCE(comment).then(() => {
          cy.get('.commentArea__submit__btn')
            .should('be.visible')
            .click()
        })
        cy.contains('.thread__contentpage__comment', comment)
        cy.logout()

        cy.login(defaultAdmin)
        cy.fixture('baseWorkspace').as('workspace').then(workspace => {
          workspaceId = workspace.workspace_id
          cy.visitPage({
            pageName: PAGES.CONTENT_OPEN,
            params: { contentId: threadId }
          })
        })
        cy.contains('.sidebar__title__button', defaultAdmin.public_name)
        cy.get('.sidebar__notification__item')
          .should('be.visible')
      })

      it('create a mention notifiation', () => {
        cy.get('.componentTitle').should('be.visible')
        cy.inputInTinyMCE(commentAll).then(() => {
          cy.get('.commentArea__submit__btn')
            .should('be.visible')
            .click()
        })
        cy.get('.commentArea__submit__btn')
          .should('be.visible')
          .click()
        cy.contains('.thread__contentpage__comment', commentAll)
        cy.logout()

        cy.get('.loginpage__main__header__title')
        .should('be.visible')

        cy.login(defaultAdmin)
        cy.fixture('baseWorkspace').as('workspace').then(workspace => {
          workspaceId = workspace.workspace_id
          cy.visitPage({
            pageName: PAGES.CONTENT_OPEN,
            params: { contentId: threadId }
          })
        })
        cy.contains('.sidebar__title__button', defaultAdmin.public_name)
        cy.get('.sidebar__notification__item')
          .should('be.visible')
        cy.get('.sidebar__mention')
          .should('be.visible')
      })
    })
  })
})
