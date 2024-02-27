import { PAGES } from '../../support/urls_commands'
// import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'

const fileTitle = 'FileForSearch'
const fullFilename = 'Linux-Free-PNG.png'
const contentType = 'image/png'
const fileDescription = 'newDescription'
let fileId
let workspaceId

describe('At file properties', () => {
  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(file => fileId = file.content_id)
    })
    cy.logout()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visitPage({
      pageName: PAGES.CONTENT_OPEN,
      params: { contentId: fileId }
    })
    cy.get('[data-cy=popin_right_part_properties]').click()
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should show file properties', () => {
    cy.get('.fileProperties__content__detail__item').should('have.length', 6)
  })

  describe('Change the description', () => {
    it('should show the new description', () => {
      cy.get('.fileProperties__content__detail__btndesc').click()
      cy.get('.fileProperties__content__detail__description__editiondesc').click().type(fileDescription)
      cy.get('.fileProperties__content__detail__description__editiondesc__btn__validate').click()
      cy.get('.fileProperties__content__detail__description__text').contains(fileDescription)
    })
  })
})
