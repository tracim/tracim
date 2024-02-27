import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Hot switching between the same app', () => {
  const htmlDocTitle = 'first Html Doc'
  const threadTitle = 'first Thread'
  const fileTitle = 'first File'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'
  const kanbantitle = 'first Kanban'

  const anotherHtmlDocTitle = 'second Html Doc'
  const anotherThreadTitle = 'second Thread'
  const anotherFileTitle = 'second File'
  const anotherKanbanTitle = 'second Kanban'

  const aThirdHtmlDocTitle = 'third Html Doc'
  const aThirdThreadTitle = 'third Thread'
  const aThirdFileTitle = 'third File'
  const aThirdKanbanTitle = 'third Kanban'

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
      cy.createKanban(fullFilename, contentType, kanbantitle, workspaceId)
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
      cy.createThread(threadTitle, workspaceId)
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)

      cy.createKanban(fullFilename, contentType, anotherKanbanTitle, workspaceId)
      cy.createHtmlDocument(anotherHtmlDocTitle, workspaceId)
      cy.createThread(anotherThreadTitle, workspaceId)
      cy.createFile(fullFilename, contentType, anotherFileTitle, workspaceId)
    })

    cy.createWorkspace().then(workspace => {
      secondWorkspaceId = workspace.workspace_id
      let userId;
      cy.getUserByRole('users').then(user => {
        userId = user.user_id
        cy.addUserToWorkspace(user.user_id, workspace.workspace_id)
      })
      cy.createKanban(fullFilename, contentType, aThirdKanbanTitle, workspaceId).then((kanban) => {
        cy.createComment(secondWorkspaceId, kanban.content_id, `<html-mention userid="${userId}"></html-mention> hello there`)
      })
      cy.createHtmlDocument(aThirdHtmlDocTitle, secondWorkspaceId).then((doc) => {
        cy.createComment(secondWorkspaceId, doc.content_id, `<html-mention userid="${userId}"></html-mention> hello there`)
      })
      cy.createThread(aThirdThreadTitle, secondWorkspaceId).then((thread) => {
        cy.createComment(secondWorkspaceId, thread.content_id, `<html-mention userid="${userId}"></html-mention> hello there`)
      })
      cy.createFile(fullFilename, contentType, aThirdFileTitle, secondWorkspaceId).then((file) => {
        cy.createComment(secondWorkspaceId, file.content_id, `<html-mention userid="${userId}"></html-mention> hello there`)
      })
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

        cy.get('.sidebar__notification__item')
          .click('left')

        // NOTE - M.L. - 2024-2-27 - This is to wait for the notification wall animation, so that it really clicks on
        //  the desired notification (same applies for below) the wait value is chosen based on the transition delay
        //  as in frontend/src/css/NotificationWall.styl line 10
        cy.wait(500)
        cy.get(`.notification__list__item.isMention .contentTitle__highlight[title="${aThirdFileTitle}"]`)
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

        cy.get('.sidebar__notification__item')
          .click('left')

        cy.wait(500)
        cy.get(`.notification__list__item.isMention .contentTitle__highlight[title="${aThirdHtmlDocTitle}"]`)
          .click('left')

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

        cy.get('.sidebar__notification__item')
          .click('left')

        cy.wait(500)
        cy.get(`.notification__list__item.isMention .contentTitle__highlight[title="${aThirdThreadTitle}"]`)
          .click('left')

        cy.contains(aThirdThreadTitle)
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(aThirdThreadTitle)
      })
    })

    describe('From Kanban to Kanban', () => {
      it('should close first kanban and open the second one', () => {
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: kanbantitle } })
          .find('.content__item')
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(kanbantitle)

        cy.get('.sidebar__notification__item')
          .click('left')

        cy.wait(500)
        cy.get(`.notification__list__item.isMention .contentTitle__highlight[title="${aThirdKanbanTitle}"]`)
          .click('left')

        cy.contains(aThirdKanbanTitle)
          .click('left')

        cy.getTag({ selectorName: s.CONTENT_FRAME }).contains(aThirdKanbanTitle)
      })
    })
  })
})
