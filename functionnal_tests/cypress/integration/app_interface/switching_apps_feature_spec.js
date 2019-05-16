import { create_htmldocument } from '../helpers/htmldoc.js'
import { create_file } from '../helpers/file.js'
import { create_thread } from '../helpers/thread.js'

describe('App Interface (the mechanism to open and close apps)', () => {
  const htmlDocTitle = 'HtmlDocForSwitch'
  const ThreadTitle = 'ThreadForSwitch'
  let workspaceId

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.visit(`/ui/workspaces/${workspaceId}/contents`)
      create_htmldocument(cy, htmlDocTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()

      create_file(cy)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()

      create_thread(cy, ThreadTitle)
      cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
    })
  })

  describe('Switching between 2 different apps feature', () => {
    const contentHtmlDocGetter = `.workspace__content__fileandfolder > .content[title="${htmlDocTitle}"]`
    const contentThreadGetter = `.workspace__content__fileandfolder > .content[title="${ThreadTitle}"]`
    const contentFileGetter = `.workspace__content__fileandfolder > .content[title="blob"]`

    describe('From app Htmldoc to app File', () => {
      beforeEach(() => {
        cy.loginAs('administrators')
        cy.visit(`/ui/workspaces/${workspaceId}/contents`)
      })

      it('should close the app Htmldoc and open the app File', () => {
        cy.get(contentHtmlDocGetter).click('left')
        cy.wait(1000) // wait for tinymce or a js error might occur
        cy.get(contentFileGetter).click('left')

        cy.get('.wsContentGeneric.html-document').should('be.not.visible')
        cy.get('.wsContentGeneric.file').should('be.visible')
      })
    })

    describe('From app File to app Thread', () => {
      it('should close the app File and open the app Thread', () => {
        cy.get(contentFileGetter).click('left')
        cy.get(contentThreadGetter).click('left')

        cy.get('.wsContentGeneric.file').should('be.not.visible')
        cy.get('.wsContentGeneric.thread').should('be.visible')
      })
    })

    describe('From app Thread to app Htmldoc', () => {
      it('should close the app Thread and open the app Htmldoc', () => {
        cy.get(contentThreadGetter).click('left')
        cy.get(contentHtmlDocGetter).click('left')
        cy.wait(1000) // wait for tinymce or a js error might occur

        cy.get('.wsContentGeneric.thread').should('be.not.visible')
        cy.get('.wsContentGeneric.html-document').should('be.visible')
      })
    })

    describe('Closing the app Htmldoc and reopening it', () => {
      beforeEach(() => {
        cy.loginAs('administrators')
        cy.visit(`/ui/workspaces/${workspaceId}/contents`)
      })

      it("should hide the app Htmldoc and set it visible back", () => {
        cy.get(contentHtmlDocGetter).click('left')
        cy.wait(1000) // wait for tinymce or a js error might occur

        cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
        cy.get(contentHtmlDocGetter).click('left')
        cy.wait(1000) // wait for tinymce or a js error might occur

        cy.get('.wsContentGeneric.html-document').should('be.visible')
      })
    })

    describe('Closing the app File and reopening it', () => {
      beforeEach(() => {
        cy.loginAs('administrators')
        cy.visit(`/ui/workspaces/${workspaceId}/contents`)
      })

      it("should hide the app File and set it visible back", () => {
        cy.get(contentFileGetter).click('left')

        cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
        cy.get(contentFileGetter).click('left')

        cy.get('.wsContentGeneric.file').should('be.visible')
      })
    })

    describe('Closing the app Thread and reopening it', () => {
      beforeEach(() => {
        cy.loginAs('administrators')
        cy.visit(`/ui/workspaces/${workspaceId}/contents`)
      })

      it("should hide the app Thread and set it visible back", () => {
        cy.get(contentThreadGetter).click('left')

        cy.get('[data-cy="popinFixed__header__button__close"]').should('be.visible').click()
        cy.get(contentThreadGetter).click('left')

        cy.get('.wsContentGeneric.thread').should('be.visible')
      })
    })
  })
})
