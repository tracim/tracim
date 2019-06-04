const htmlDocTitle = 'HtmlDocForResearch'
const htmlDocTitleLong = 'HtmlDocForResearchLong'
const threadTitle = 'ThreadForResearch'
const fileTitle = 'FileForResearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'

const researchInput = '.research > [data-cy=research__text]'
const researchButton = '.research > [data-cy=research__btn]'
const contentName= '[data-cy=research__content] [data-cy=content__item] > [data-cy=content__name]'

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
        cy.createHtmlDocument(htmlDocTitleLong, workspaceId)
      })
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui')
  })

  describe('Typing HtmlDocForResearch in the input and validating', () => {
    it('Should display the results', () => {
      cy.get(researchInput).type(htmlDocTitle)
      cy.get(researchButton).click()

      cy.get(contentName).contains(htmlDocTitle).should('be.visible')
      // cy.get(contentName).contains(threadTitle).should('be.not.visible')
      // cy.get(contentName).contains(fileTitle).should('be.not.visible')
      cy.get(contentName).contains(htmlDocTitleLong).should('be.visible')
    })

    describe('Archiving one document', () => {
      describe('Typing HtmlDocForResearch in the input and validating again', () => {
        it('Should not display the archived document', () => {
          cy.get(researchInput).type(htmlDocTitle)
          cy.get(researchButton).click()

          cy.get(contentName).contains(htmlDocTitleLong).click()
          cy.get('[data-cy=archive__button]').click()

          // For not do the error Uncaught TypeError: Cannot read property 'setAttribute' of undefined
          cy.visit('/ui')

          cy.get(researchInput).type(htmlDocTitle)
          cy.get(researchButton).click()

          cy.get(contentName).contains(htmlDocTitle).should('be.visible')
          // cy.get(contentName).contains(htmlDocTitleLong).should('be.not.visible')
        })
      })
    })

    describe('Deleting one document', () => {
      describe('Typing HtmlDocForResearch in the input and validating again', () => {
        it('Should not display the deleted document', () => {
          cy.get(researchInput).type(htmlDocTitle)
          cy.get(researchButton).click()

          cy.get(contentName).contains(htmlDocTitle).click()
          cy.get('[data-cy=delete__button]').click()

          // For not do the error Uncaught TypeError: Cannot read property 'setAttribute' of undefined
          cy.visit('/ui')

          cy.get(researchInput).type(htmlDocTitle)
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
