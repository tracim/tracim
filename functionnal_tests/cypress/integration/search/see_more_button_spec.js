import { PAGES } from '../../support/urls_commands'

const htmlDocTitle = 'HtmlDocForSearch'
const htmlDocTitle1 = 'HtmlDocForSearch1'
const htmlDocTitle2 = 'HtmlDocForSearch2'
const htmlDocTitle3 = 'HtmlDocForSearch3'
const htmlDocTitle4 = 'HtmlDocForSearch4'
const htmlDocTitle5 = 'HtmlDocForSearch5'
const htmlDocTitle6 = 'HtmlDocForSearch6'
const htmlDocTitle7 = 'HtmlDocForSearch7'
const htmlDocTitle8 = 'HtmlDocForSearch8'
const htmlDocTitle9 = 'HtmlDocForSearch9'
const htmlDocTitle10 = 'HtmlDocForSearch10'
const htmlDocTitle11 = 'HtmlDocForSearch11'
const htmlDocTitle12 = 'HtmlDocForSearch12'
const htmlDocTitle13 = 'HtmlDocForSearch13'
const htmlDocTitle14 = 'HtmlDocForSearch14'
const htmlDocTitle15 = 'HtmlDocForSearch15'

const searchInput = '[data-cy=search__text]'
const seeMoreButton = '.searchResult__btnSeeMore button'

let workspaceId

describe('Searching keywords', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createHtmlDocument(htmlDocTitle, workspaceId)
      cy.createHtmlDocument(htmlDocTitle1, workspaceId)
      cy.createHtmlDocument(htmlDocTitle2, workspaceId)
      cy.createHtmlDocument(htmlDocTitle3, workspaceId)
      cy.createHtmlDocument(htmlDocTitle4, workspaceId)
      cy.createHtmlDocument(htmlDocTitle5, workspaceId)
      cy.createHtmlDocument(htmlDocTitle6, workspaceId)
      cy.createHtmlDocument(htmlDocTitle7, workspaceId)
      cy.createHtmlDocument(htmlDocTitle8, workspaceId)
      cy.createHtmlDocument(htmlDocTitle9, workspaceId)
      cy.createHtmlDocument(htmlDocTitle10, workspaceId)
      cy.createHtmlDocument(htmlDocTitle11, workspaceId)
      cy.createHtmlDocument(htmlDocTitle12, workspaceId)
      cy.createHtmlDocument(htmlDocTitle13, workspaceId)
      cy.createHtmlDocument(htmlDocTitle14, workspaceId)
      cy.createHtmlDocument(htmlDocTitle15, workspaceId)
    })
  })

  beforeEach(function () {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.HOME })
  })

  describe('that match more than 15 contents', () => {
    it('Should display maximum 15 results in the page and the See more button', () => {
      cy.get(searchInput).type(htmlDocTitle).type('{enter}')
      cy.get('.tracim__content-scrollview').scrollTo('bottom')

      cy.get('[data-cy=content__item]').its('length').should('eq', 15)

      cy.get(seeMoreButton).should('be.visible')
    })

    it('Should display more results when clicking in the See more button', () => {
      cy.get(searchInput).type(htmlDocTitle).type('{enter}')
      cy.get('.tracim__content-scrollview').scrollTo('bottom')

      cy.get(seeMoreButton).should('be.visible').click().then(test => {
        cy.wait(500)
        cy.get('[data-cy=content__item]').its('length').should('gt', 15)
      })
    })
    describe('with a search with 5 results per page by changing it in the url', () => {
      it('Should display maximum 5 results in the page and the See more button', () => {
        const pageNumber = '1'
        const numberByPage = '5'
        const actived = '1'
        const deleted = '0'
        const archived = '0'
        const contentTypes = 'html-document%2Cfile%2Cthread%2Cfolder%2Ccomment'
        cy.visitPage({ pageName: PAGES.SEARCH, params: { searchedString: htmlDocTitle, pageNumber, numberByPage, actived, deleted, archived, contentTypes } })

        cy.get('[data-cy=content__item]').its('length').should('eq', 5)

        cy.get(seeMoreButton).should('be.visible')
      })
    })
  })
})
