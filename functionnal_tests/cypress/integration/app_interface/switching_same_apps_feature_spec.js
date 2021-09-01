import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Hot switching between the same app', () => {
  const htmlDocTitle = 'first Html Doc'
  const threadTitle = 'first Thread'
  const fileTitle = 'first File'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  const anotherHtmlDocTitle = 'second Html Doc'
  const anotherThreadTitle = 'second Thread'
  const anotherFileTitle = 'second File'

  const aThirdHtmlDocTitle = 'third Html Doc'
  const aThirdThreadTitle = 'third Thread'
  const aThirdFileTitle = 'third File'

  let workspaceId, secondWorkspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      // FIXME -  B.L - 2019/05/03 - when we send simultaneous request to create contents we
      // end up with an undefined response we need to dig up to find if it's the server or cypress
      // Issue 1836
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
      cy.createThread(threadTitle, workspaceId)
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
      cy.createHtmlDocument(anotherHtmlDocTitle, workspaceId)
      cy.createThread(anotherThreadTitle, workspaceId)
      cy.createFile(fullFilename, contentType, anotherFileTitle, workspaceId)
    })

    cy.createWorkspace().then(workspace => {
      secondWorkspaceId = workspace.workspace_id
      cy.getUserByRole('users').then(user => {
        cy.addUserToWorkspace(user.user_id, workspace.workspace_id)
      })
      cy.createHtmlDocument(aThirdHtmlDocTitle, secondWorkspaceId)
      cy.createThread(aThirdThreadTitle, secondWorkspaceId)
      cy.createFile(fullFilename, contentType, aThirdFileTitle, secondWorkspaceId)
    })
  })

  describe('In a different workspace', () => {
    beforeEach(() => {
      cy.ignoreTinyMceError()
      cy.loginAs('users')
      cy.visitPage({ pageName: p.CONTENTS, params: { workspaceId: workspaceId } })
    })

    afterEach(() => {
      cy.cancelXHR()
    })

    describe('From File to File', () => {
      it('should close first file and open the second one', () => {
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileTitle } })
          .find('.content__item')
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(fileTitle)

        cy.get('.notificationButton__btn')
          .click('left')

        cy.get('.notification__list__item').first().click()

        cy.contains(aThirdFileTitle)
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(aThirdFileTitle)
      })
    })

    describe('From HtmlDoc to HtmlDoc', () => {
      it('should close first file and open the second one', () => {
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: htmlDocTitle } })
          .find('.content__item')
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(htmlDocTitle)

        cy.get('.notificationButton__btn')
          .click('left')

        cy.get('.notification__list__item').first().click()

        cy.contains(aThirdHtmlDocTitle)
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(aThirdHtmlDocTitle)
      })
    })

    describe('From Thread to Thread', () => {
      it('should close first file and open the second one', () => {
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: threadTitle } })
          .find('.content__item')
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(threadTitle)

        cy.get('.notificationButton__btn')
          .click('left')

        cy.get('.notification__list__item').first().click()

        cy.contains(aThirdThreadTitle)
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(aThirdThreadTitle)
      })
    })
  })
})
