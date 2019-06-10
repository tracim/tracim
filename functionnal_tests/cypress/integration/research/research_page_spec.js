import { PAGES } from '../../support/urls_commands'

const researchURL = '/research-result'

const htmlDocTitle = 'HtmlDocForResearch'
const htmlDocTitleLong = 'HtmlDocForResearchLong'
const researchInput = '[data-cy=research__text]'
const researchButton = '[data-cy=research__btn]'

let workspaceId

describe('Searching keywords', () => {
  describe('in the input', () => {
    before(function () {
        cy.resetDB()
        cy.setupBaseDB()
        cy.loginAs('users')
        cy.fixture('baseWorkspace').as('workspace').then(workspace => {
          workspaceId = workspace.workspace_id
          cy.createHtmlDocument(htmlDocTitle, workspaceId)
          cy.createHtmlDocument(htmlDocTitleLong, workspaceId)
        })
    })

    beforeEach(function () {
      cy.loginAs('users')
      cy.visitPage({pageName: PAGES.HOME})
    })

    afterEach(function () {
      cy.cancelXHR()
    })

    it('Should redirect to the research result page with click', () => {
      cy.get(researchInput).type(htmlDocTitle)
      cy.get(researchButton).click()
      cy.url().should('include', researchURL)
      cy.get('.ResearchResult__title').should('be.visible')
    })

    it('Should redirect to the research result page with enter', () => {
      cy.get(researchInput).type(htmlDocTitle).type('{enter}')
      cy.url().should('include', researchURL)
      cy.get('.ResearchResult__title').should('be.visible')
    })

    it('Should be disabled if the input is empty', () => {
      cy.get(researchInput).clear()
      cy.get(researchButton).should('be.disabled')
    })

    it('Should display the same word in the research input', () => {
      cy.get(researchInput).type(htmlDocTitle).type('{enter}')

      cy.get(researchInput).should('have.value', htmlDocTitle)
    })

    describe('the subtitle', () => {
      const pageSubTitle = '[data-cy=layoutPageSubTitle]'

      it('Should display the message with HtmlDocForResearch', () => {
        cy.get(researchInput).type(htmlDocTitle).type('{enter}')

        cy.get(pageSubTitle).contains(`best results for "${htmlDocTitle}"`).should('be.visible')
      })

      it('Should display the message with the same number as result contents', () => {
        cy.get(researchInput).type(htmlDocTitle).type('{enter}')

        // TODO - GB - 2019-06-04 - make this test variable for the number of results (don't put "2" as a constant), maybe using a table
        cy.get('[data-cy=content__item]').its('length').should('eq', 2)
        cy.get(pageSubTitle).contains(`2 best results for "${htmlDocTitle}"`).should('be.visible')
      })
    })
  })
})
