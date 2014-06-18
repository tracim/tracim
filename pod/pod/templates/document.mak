<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pod.templates.pod"/>
<%namespace name="DOC" file="pod.templates.document-widgets"/>
<%namespace name="DOCTABS" file="pod.templates.document-widgets-tabs"/>

<%def name="title()">
  % if current_node!=None:
    pod :: document ${current_node.getTruncatedLabel(40)} [#${current_node.node_id} / ${current_node.getStatus().label}]
  % else:
    pod :: document root
  % endif
</%def>

<%def name='toggle_view_mode()'>
    <li title=" ${_('Toggle view mode [narrow, medium, large]')}">
        <a title="${_('Toggle view mode: narrow')}" id='view-size-toggle-button-small' class="pod-do-not-display"><i class='fa fa-eye'></i></a>
        <a title="${_('Toggle view mode: medium')}" id='view-size-toggle-button-medium'><i class='fa fa-eye'></i></a>
        <a title="${_('Toggle view mode: large')}"  id='view-size-toggle-button-large' class="pod-do-not-display"><i class='fa fa-eye'></i></a>
    </li>
</%def>

#######
##
## HERE COMES THE BREADCRUMB
##
  <div class="row">
    ${DOC.BreadCrumb(current_node, allowed_nodes)}
  </div>

  <div class="row">

    <div id='application-left-panel' class='span3'>
      ${DOC.ContentExplorerPanelContent(current_user, current_node)}
    </div>
    
    <div id='application-main-panel' class="span9">
      % if current_node==None:
          <div class="row">
            ${DOC.FirstTimeFakeDocument()}
          </div>
      % else:
          <div class="row">
              <div id='application-document-panel' class="span5">
                  <div id='current-document-content' class="">
                      ${DOC.Toolbar(current_node, node_status_list, root_node_list_for_select_field, 'current-document-toobar', current_user_rights, current_user)}
                      ${DOC.ShowTitle(current_node, keywords, 'current-document-title')}
                      ${DOC.ShowContent(current_node, keywords)}
                  </div>
                  ${DOC.EditForm(current_node)}
              </div>
              <div id='application-metadata-panel' class="span4">
                ${DOC.TabbedMetadataPanelContent(current_user, current_node)}
              </div>
          </div>
          
          <div>
              ######
              ##
              ## HERE WE INCLUDE ALL MODAL DIALOG WHICH WILL BE ACCESSIBLE THROUGH TABS OR MENU
              ##
              ${DOC.DocumentEditModalDialog(current_node, None, tg.url('/api/create_document'), h.ID.AddDocumentModalForm(current_node), _('New Sub-document'))}
              ${DOC.EventEditModalDialog(current_node, None, tg.url('/api/create_event'), h.ID.AddEventModalForm(current_node), _('Add an event'))}
              ${DOC.ContactEditModalDialog(current_node, None, tg.url('/api/create_contact'), h.ID.AddContactModalForm(current_node), _('Add a new contact'))}
              ${DOC.FileEditModalDialog(current_node, None, tg.url('/api/create_file'), h.ID.AddFileModalForm(current_node), _('Add a new file'))}
              ${DOC.MoveDocumentModalDialog(current_node, tg.url('/api/set_parent_node'), h.ID.MoveDocumentModalForm(current_node), _('Move the document'))}
          </div>
      % endif
    </div>
  </div>
</div>
