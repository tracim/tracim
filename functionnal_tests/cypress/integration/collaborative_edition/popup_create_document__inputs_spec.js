import { PAGES as p} from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'

const text_slug = 'text'
const spreadsheet_slug = 'spreadsheet'
const presentation_slug = 'presentation'

describe('Popup create office document, ', () => {
  before(()=> {
    cy.resetDB()
    cy.setupBaseDB()
    cy.polyfillFetch()
  })

  beforeEach(() => {
    cy.log(process.env.COLLABORATIVE_DOCUMENT_EDITION__ACTIVATED)
    cy.server()
    cy.route('**/system/config', 'fixture:system_config')
    cy.loginAs('administrators').as('user')
    cy.fixture('baseWorkspace').as('workspace')
      .then(workspace => cy.visitPage({pageName: p.DASHBOARD, params: {workspaceId: workspace.workspace_id}}))
  })

  it('elements are all visible', () => {
    cy.server()
    cy.route(
      '**/collaborative-document-edition/templates',
      {file_templates: ['default.odt', 'default.ods', 'default.odp']}
    )
    cy.get('[data-cy=contentTypeBtn_office_document]').click()
    cy.get('.createcontent__contentname__title').contains('New Office Document')
    cy.get('[data-cy=createcontent__form__input]').should('have.attr', 'placeholder', "Office Document's title")
    cy.get('.radio_btn_group').children().should('have.length', 3)
    cy.get('.cardPopup__close')
    cy.get('.createcontent__form__button')
  })

  it('radio button group show only odt', () => {
    cy.server()
    cy.route('**/api/v2/collaborative-document-edition/templates', {file_templates: ['default.odt']})
    cy.get('[data-cy=contentTypeBtn_office_document]').click()
    cy.get('.radio_btn_group').children().should('have.length', 1)
    cy.get(`.radio_btn_group__btn[data-value=${text_slug}]`).within(() => {
      cy.get(`[alt=${text_slug}]`)
      cy.get('.radio_btn_group__btn__img__label').contains(text_slug.charAt(0).toUpperCase() + text_slug.slice(1))
    })
  })

  it('radio button group show only ods', () => {
    cy.server()
    cy.route('/api/v2/collaborative-document-edition/templates', {file_templates: ['default.ods']})
    cy.get('[data-cy=contentTypeBtn_office_document]').click()
    cy.get('.radio_btn_group').children().should('have.length', 1)
    cy.get(`.radio_btn_group__btn[data-value=${spreadsheet_slug}]`).within(() => {
      cy.get(`[alt=${spreadsheet_slug}]`)
      cy.get('.radio_btn_group__btn__img__label').contains(spreadsheet_slug.charAt(0).toUpperCase() + spreadsheet_slug.slice(1))
    })
  })

  it('radio button group show only odp', () => {
    cy.server()
    cy.route('/api/v2/collaborative-document-edition/templates', {file_templates: ['default.odp']})
    cy.get('[data-cy=contentTypeBtn_office_document]').click()
    cy.get('.radio_btn_group').children().should('have.length', 1)
    cy.get(`.radio_btn_group__btn[data-value=${presentation_slug}]`).within(() => {
      cy.get(`[alt=${presentation_slug}]`)
      cy.get('.radio_btn_group__btn__img__label').contains(presentation_slug.charAt(0).toUpperCase() + presentation_slug.slice(1))
    })
  })

  it('X button close the popup', () => {
    cy.route(
      '**/collaborative-document-edition/templates',
      {file_templates: ['default.odt', 'default.ods', 'default.odp']}
    )
    cy.get('.cardPopup__close').click()
    cy.get('.popupCreateContent').should('not.exist')
    cy.url().should('include', '/ui/workspaces/1/contents?')
  })

  it('escape key closes the popup', () => {
    cy.route(
      '**/collaborative-document-edition/templates',
      {file_templates: ['default.odt', 'default.ods', 'default.odp']}
    )
    cy.get('.cardPopup__close')
    cy.type({'esc'})
    cy.get('.popupCreateContent').should('not.exist')
    cy.url().should('include', '/ui/workspaces/1/contents?')
  })

  it('enter key does not send the form if it is not valid', () => {

  })

  it('send button redirect to iframe', () => {

  })

  it('pressing enter redirect to iframe', () => {

  })
})