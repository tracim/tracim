import { PAGES } from '../../support/urls_commands'

const htmlDocTitle = 'HtmlDocForResearch'
const threadTitleLong = 'ThreadForResearchLong'
const threadTitle = 'ThreadForResearch'
const fileTitle = 'FileForResearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const researchInput = '[data-cy=research__text]'
const researchButton = '[data-cy=research__btn]'
const contentName= '[data-cy=content__name]'

let workspaceId

describe('Research page', () => {
  before(function () {
      cy.resetDB()
      cy.setupBaseDB()
      cy.loginAs('users')
      cy.fixture('baseWorkspace').as('workspace').then(workspace => {
        workspaceId = workspace.workspace_id
        cy.createHtmlDocument(htmlDocTitle, workspaceId)
        cy.createThread(threadTitle, workspaceId)
        cy.createFile(fullFilename, contentType, fileTitle, workspaceId)
        cy.createThread(threadTitleLong, workspaceId)
      })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({pageName: PAGES.HOME})
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('Typing HtmlDocForResearch in the input and validating', () => {
    it('Should display the results', () => {
      cy.get(researchInput).type(threadTitle)
      cy.get(researchButton).click()


      cy.get(contentName).contains(htmlDocTitle).should('be.not.visible')
      cy.get(contentName).contains(threadTitle).should('be.visible')
      cy.get(contentName).contains(fileTitle).should('be.not.visible')
      cy.get(contentName).contains(threadTitleLong).should('be.visible')
    })

    describe('Archiving one document', () => {
      describe('Typing HtmlDocForResearch in the input and validating again', () => {
        it('Should not display the archived document', () => {
          cy.get(researchInput).type(threadTitle)
          cy.get(researchButton).click()

          cy.get(contentName).contains(threadTitleLong).click()
          cy.get('[data-cy=archive__button]').click()

          cy.get('[data-cy=displaystate]')
          cy.get(researchButton).click()

          cy.get(contentName).contains(threadTitle).should('be.visible')
          cy.get(contentName).contains(threadTitleLong).should('be.not.visible')
        })
      })
    })

    describe('Deleting one document', () => {
      describe('Typing HtmlDocForResearch in the input and validating again', () => {
        it('Should not display the deleted document', () => {
          cy.get(researchInput).type(threadTitle)
          cy.get(researchButton).click()

          cy.get(contentName).contains(threadTitle).click()
          cy.get('[data-cy=delete__button]').click()

          cy.get('[data-cy=displaystate]')
          cy.get(researchButton).click()

          cy.get('.ResearchResult__content__empty').should('be.visible')
        })
      })
    })
  })

  describe('Typing DoesNotExist in the input and validating', () => {
    it('Should display the No results message', () => {
      cy.get(researchInput).type('DoesNotExist')
      cy.get(researchButton).click()

      cy.get('.ResearchResult__content__empty').should('be.visible')
    })
  })
})
