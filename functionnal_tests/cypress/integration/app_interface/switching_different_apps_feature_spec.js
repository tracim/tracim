import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

describe('App Interface (the mechanism to open and close apps)', () => {
  const htmlDocTitle = 'HtmlDocForSwitch'
  const threadTitle = 'ThreadForSwitch'
  const fileTitle = 'FileForSwitch'

  const secondHtmlDocTitle = 'HtmlDocForSwitch'
  const secondThreadTitle = 'ThreadForSwitch'
  const secondFileTitle = 'FileForSwitch'

  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  let workspaceId

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
      cy.createThread(threadTitle, workspaceId)
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
    })

    cy.createWorkspace().then(workspace => {
      const secondWorkspaceId = workspace.workspace_id
      cy.getUserByRole('users').then(user => {
        cy.addUserToWorkspace(user.user_id, workspace.workspace_id)
      })
      cy.createHtmlDocument(secondHtmlDocTitle, secondWorkspaceId)
      cy.createThread(secondThreadTitle, secondWorkspaceId)
      cy.createFile(fullFilename, contentType, secondFileTitle, secondWorkspaceId)
    })
  })

  beforeEach(() => {
    cy.ignoreTinyMceError()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('Switching between 2 different apps feature', () => {
    const contentHtmlDocGetter = formatTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: htmlDocTitle } })
    const contentThreadGetter = formatTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: threadTitle } })
    const contentFileGetter = formatTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileTitle } })

    beforeEach(function () {
      cy.loginAs('users')
    })

    describe('In the same workspace', () => {
      describe('From app Htmldoc to app File', () => {
        it('should close the app Htmldoc and open the app File', () => {
          cy.visit(`/ui/workspaces/${workspaceId}/contents`)

          cy.get(contentHtmlDocGetter).find('.content__item').click('left')
          cy.get(contentFileGetter).find('.content__item').click('left')
          cy.get('[data-cy="popinFixed"].html-document').should('be.not.visible')
          cy.get('[data-cy="popinFixed"].file').should('be.visible')
        })
      })

      describe('From app File to app Thread', () => {
        it('should close the app File and open the app Thread', () => {
          cy.visit(`/ui/workspaces/${workspaceId}/contents`)

          cy.get(contentFileGetter).find('.content__item').click('left')
          cy.get(contentThreadGetter).find('.content__item').click('left')

          cy.get('[data-cy="popinFixed"].file').should('be.not.visible')
          cy.get('[data-cy="popinFixed"].thread').should('be.visible')
        })
      })

      describe('From app Thread to app Htmldoc', () => {
        it('should close the app Thread and open the app Htmldoc', () => {
          cy.visit(`/ui/workspaces/${workspaceId}/contents`)

          cy.get(contentThreadGetter).find('.content__item').click('left')
          cy.get(contentHtmlDocGetter).find('.content__item').click('left')
          cy.get('[data-cy="popinFixed"].thread').should('be.not.visible')
          cy.get('[data-cy="popinFixed"].html-document').should('be.visible')
        })
      })
    })

    describe('In the different workspaces', () => {
      describe('From app Htmldoc to app File', () => {
        it('should close the app Htmldoc and open the app File', () => {
          cy.visit(`/ui/workspaces/${workspaceId}/contents`)

          cy.get(contentHtmlDocGetter).find('.content__item').click('left')

          cy.get('.notificationButton__btn')
            .click('left')

          cy.contains(secondFileTitle)
            .click('left')

          cy.get('[data-cy="popinFixed"].html-document').should('be.not.visible')
          cy.get('[data-cy="popinFixed"].file').should('be.visible')
        })
      })

      describe('From app File to app Thread', () => {
        it('should close the app File and open the app Thread', () => {
          cy.visit(`/ui/workspaces/${workspaceId}/contents`)

          cy.get(contentFileGetter).find('.content__item').click('left')

          cy.get('.notificationButton__btn')
            .click('left')

          cy.contains(secondThreadTitle)
            .click('left')

          cy.get('[data-cy="popinFixed"].file').should('be.not.visible')
          cy.get('[data-cy="popinFixed"].thread').should('be.visible')
        })
      })

      describe('From app Thread to app Htmldoc', () => {
        it('should close the app Thread and open the app Htmldoc', () => {
          cy.visit(`/ui/workspaces/${workspaceId}/contents`)

          cy.get(contentThreadGetter).find('.content__item').click('left')

          cy.get('.notificationButton__btn')
            .click('left')

          cy.contains(secondHtmlDocTitle)
            .click('left')

          cy.get('[data-cy="popinFixed"].thread').should('be.not.visible')
          cy.get('[data-cy="popinFixed"].html-document').should('be.visible')
        })
      })
    })


    describe('Closing the app Htmldoc and reopening it', () => {
      it('should hide the app Htmldoc and set it visible back', () => {
        cy.visit(`/ui/workspaces/${workspaceId}/contents`)

        cy.get(contentHtmlDocGetter).find('.content__item').click('left')
        cy.get('.html-document__header__close[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
        cy.get('[data-cy="popinFixed"].html-document').should('be.not.visible')

        cy.get(contentHtmlDocGetter).find('.content__item').click('left')
        cy.get('[data-cy="popinFixed"].html-document').should('be.visible')
      })
    })

    describe('Closing the app File and reopening it', () => {
      it('should hide the app File and set it visible back', () => {
        cy.visit(`/ui/workspaces/${workspaceId}/contents`)

        cy.get(contentFileGetter).find('.content__item').click('left')

        cy.get('.file__header__close[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
        cy.get('[data-cy="popinFixed"].file').should('be.not.visible')

        cy.get(contentFileGetter).find('.content__item').click('left')
        cy.get('[data-cy="popinFixed"].file').should('be.visible')
      })
    })

    describe('Closing the app Thread and reopening it', () => {
      it('should hide the app Thread and set it visible back', () => {
        cy.visit(`/ui/workspaces/${workspaceId}/contents`)

        cy.get(contentThreadGetter).find('.content__item').click('left')

        cy.get('.thread__contentpage__header__close[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
        cy.get('[data-cy="popinFixed"].thread').should('be.not.visible')

        cy.get(contentThreadGetter).find('.content__item').click('left')
        cy.get('[data-cy="popinFixed"].thread').should('be.visible')
      })
    })
  })
})
