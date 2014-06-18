<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pod.templates.pod"/>
<%namespace name="DOCTABS" file="pod.templates.document-widgets-tabs"/>

<%def name="node_treeview_for_set_parent_menu(node_id, node_list, indentation=-1)">
  % if indentation==-1:
    <li>
      <a href="${tg.url('/api/set_parent_node', dict(node_id=node_id, new_parent_id=0))}">
        <i class="fa fa-file-text-o"></i> ${_('Home')}
      </a>
      ${node_treeview_for_set_parent_menu(node_id, node_list, 0)}
    </li>
  % else:
    % if len(node_list)>0:
      <ul style="list-style: none;">
      % for new_parent_node in node_list:
        <li>
          <a href="${tg.url('/api/set_parent_node', dict(node_id=node_id, new_parent_id=new_parent_node.node_id))}"><i class="fa fa-file-text-o"></i> ${new_parent_node.getTruncatedLabel(40-indentation*2)}
          </a>
          ${node_treeview_for_set_parent_menu(node_id, new_parent_node.getStaticChildList(), indentation+1)}
        </li>
      % endfor
      </ul>
    % endif
  % endif
</%def>

<%def name="ToolbarMenuItemModal(psTargetModalId, psIconClasses, psMenuLabel, psItemClasses='')">
  <li class="${psItemClasses}"><a href="#${psTargetModalId}" role="button" data-toggle="modal"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
</%def>

<%def name="ToolbarMenuItemInline(psTargetId, psIconClasses, psMenuLabel)">
  <li><a href="#${psTargetId}"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
</%def>
<%def name="ToolbarMenuItemLink(psTargetUrl, psIconClasses, psMenuLabel, psLinkCss='', psLinkTitle='', psOnClick='')">
  % if psTargetUrl=='#':
    <li class="disabled"><a href="${psTargetUrl}" class="${psLinkCss}" title="${psLinkTitle}" onclick="${psOnClick}"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
  % else:
    <li><a href="${psTargetUrl}" class="${psLinkCss}" title="${psLinkTitle}" onclick="${psOnClick}"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
  % endif
</%def>

        
<%def name="Toolbar(poNode, plNodeStatusList, plRootNodes, psDivId, user_rights, user)">
  <div id="${psDivId}">

##
## TOOLBAR ITEMS ARE SHOWN ACCORDING TO THE R/W PERMISSIONS GRANTED TO THE USER
##
% if user.user_id==poNode.owner_id or (user_rights and user_rights.hasWriteAccess()):
    <div class="btn-group">
      ${POD.EditButton('current-document-content-edit-button', True)}

      <button class="btn btn-small"  data-toggle="dropdown" href="#"> 
        <i class="fa  fa-signal"></i>
        ${_("Change status")}
      </button>
      <a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">
        <span class="caret"></span>
      </a>
      <ul class="dropdown-menu pull-right">
        <li>
          <div class="pod-grey strong" ><strong><i class="fa fa-magic"></i> ${_('Current status is...')}</strong><br/></div>
        </li>
      % for node_status in plNodeStatusList:
        % if node_status.status_id==poNode.getStatus().status_id:
          ${ToolbarMenuItemLink('#', node_status.icon_id, node_status.label, 'disabled '+node_status.css, h.getExplanationAboutStatus(node_status.status_id, current_node.getStatus().status_id))}
        % endif
      % endfor
        <li class="divider" role="presentation"></li>
        <li>
          <div class=" strong" ><strong><i class="fa fa-magic"></i> ${_('Change to...')}</strong><br/></div>
          <div class="pod-grey"><i>${_('change the status to...')}</i></div>
        </li>
      % for node_status in plNodeStatusList:
        % if node_status.status_id!=poNode.getStatus().status_id:
          ${ToolbarMenuItemLink(tg.url('/api/edit_status', dict(node_id=current_node.node_id, node_status=node_status.status_id)), node_status.icon_id, node_status.label, node_status.css, h.getExplanationAboutStatus(node_status.status_id, current_node.getStatus().status_id))}
        % endif
      % endfor
      </ul>
    </div>
% endif

    <div class="btn-group">
      <button class="btn btn-small btn-success"  data-toggle="dropdown" href="#">
        <i class="fa fa-plus"></i> ${_('Add')}
      </button>
      <a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>
      <ul class="dropdown-menu">
      
        <li>
          <div class="btn-success strong" ><strong><i class="fa fa-magic"></i> ${_('Add New...')}</strong><br/></div>
          <div class="pod-grey"><i>${_('create a totally new item...')}</i></div>
        </li>

        ${ToolbarMenuItemModal(h.ID.AddDocumentModalForm(current_node), 'fa fa-file-text-o', _('Document'))}
        ${ToolbarMenuItemModal(h.ID.AddFileModalForm(current_node), 'fa fa-paperclip', _('File'))}
        ${ToolbarMenuItemModal(h.ID.AddEventModalForm(current_node), 'fa fa-calendar', _('Event'))}
        ${ToolbarMenuItemModal(h.ID.AddContactModalForm(current_node), 'fa fa-user', _('Contact'))}
##
## FIXME - DA - 07-05-2014 - The link below is not working clean
##
        ${ToolbarMenuItemInline(h.ID.AddCommentInlineForm(), 'fa fa-comments-o', _('Comment'))}

        <li class="divider" role="presentation"></li>

        <li>
          <div class="btn-warning strong" ><strong><i class="fa fa-link"></i> Add Existing...</strong><br/></div>
          <div class="pod-grey"><i>link to an existing item...</i></div>
        </li>
        <li><p class="pod-grey"><i class="fa fa-danger"></i> coming soon!</p></li>
      </ul>
    </div>
% if user.user_id==poNode.owner_id or (user_rights and user_rights.hasWriteAccess()):
    <div class="btn-group pull-right">
      <button class="btn btn-small btn-link"  data-toggle="dropdown" href="#">
        ${_('more ...')}
      </button>
      <ul class="dropdown-menu">
        <li>
          <div class="strong" ><strong><i class="fa fa-magic"></i> ${_('Advanced actions...')}</strong><br/></div>
          <div class="pod-grey"><i>${_('power user actions...')}</i></div>
        </li>
##
## Here are MOVE and DELETE buttons
##
        ${ToolbarMenuItemModal(h.ID.MoveDocumentModalForm(current_node), 'fa fa-arrows', _('Move'), 'btn-warning')}
        ${ToolbarMenuItemLink(tg.url('/api/edit_status', dict(node_id=poNode.node_id, node_status='deleted')), 'fa fa-trash-o', _('Delete'), 'btn-danger', _('Delete the current document'), 'return confirm(\'{0}\');'.format('Delete current document?'))}
      </ul>
    </div>
% endif
  </div>
</%def>

<%def name="BreadCrumb(poNode, allowed_nodes)">
  <ul class="breadcrumb span12">
    <li>
      <span class="divider">/</span>
      <a href="${tg.url('/document/')}">Documents</a>
    </li>
    % if poNode!=None:
      % for breadcrumb_node in poNode.getBreadCrumbNodes():
##
## HACK - D.A - 2014-05-29
## Here we remove forbidden nodes from the breadcrumb
## This should not be done in the templates!
##
        % if breadcrumb_node in allowed_nodes:
          <li>
            <span class="divider">/</span>
            <a href="${tg.url('/document/%s'%(breadcrumb_node.node_id))}">${breadcrumb_node.getTruncatedLabel(30)}</a>
          </li>
        % endif
      % endfor
      <li class="active">
        <span class="divider">/</span>
        ${poNode.data_label}
      </li>
    % endif
  </ul>
</%def>

<%def name="EditForm(poNode)">
  <form
    style="display: none;"
    id="current-document-content-edit-form"
    method="post"
    action="${tg.url('/api/edit_label_and_content')}"
  >
    <div>
      ${POD.CancelButton('current-document-content-edit-cancel-button-top', True)}
      ${POD.SaveButton('current-document-content-edit-save-button-top', True)}
    </div>
    <div style="padding: 0.5em 0 0 0">
      <input type="hidden" name="node_id" value="${current_node.node_id}"/>
      <input type="hidden" name="data_content" id="current_node_textarea" />
      <label>
        ${_('Title')}
        <input
          type="text"
          name="data_label"
          value="${current_node.data_label}"
          class="span4"
          placeholder="${_('document title')}"
        />
      </label>
    </div>
    <div>
      ${POD.RichTextEditor('current_node_textarea_wysiwyg', current_node.data_content)}
    </div>
    <div class="pull-right">
      ${POD.CancelButton('current-document-content-edit-cancel-button', True)}
      ${POD.SaveButton('current-document-content-edit-save-button', True)}
    </div>
  </form>
</%def>

<%def name="ShowContent(poNode, psKeywords)">
  <div>
  % if len(psKeywords)>0 and psKeywords!='':
      ${poNode.getContentWithHighlightedKeywords(psKeywords.split(), poNode.getContentWithTags())|n}
  % else:
      ${poNode.getContentWithTags()|n}
  % endif
  </div>
</%def>

<%def name="ShowTitle(poNode, psKeywords, psId)">
  <h3 id="${psId}" title="Document ${poNode.node_id}: ${poNode.data_label}">
    ${poNode.data_label}
    <sup class="label ${poNode.getStatus().css}" href="#">
      <i class="${poNode.getStatus().icon_id}"></i>
      ${poNode.getStatus().label}
    </sup>
    
    % if poNode.is_shared==False:
      <sup class="label label-info" title="${_('This document is private')}">
        <i class="fa fa-key"></i>
        ${_('private')}
      </sup>
    % else:
      <sup class="label label-warning" title="${_('This document is shared')}">
        <i class="fa fa-group"></i>
        ${_('shared')}
      </sup>
    % endif
######
##
## 2014-05-06 - D.A. - The document is not yet internet-sharable
##
##    % if poNode.is_public==True:
##      <sup class="label label-warning" href="#">
##        <i class="fa fa-globe"></i>
##        <span title="${_('This document is published through internet at %s')%poNode.public_url_key}">${_('shared')}</span>
##      </sup>
##    % endif

  </h3>
</%def>

#######
##
## METADATA TAB FUNCTIONS
##
<%def name="MetadataTab(psAnchorName, psDataToggleName, psTitle, psFontAwesomeIconClass, plItems)">
  <a
    href="${psAnchorName}" 
    data-toggle="${psDataToggleName}" 
    title="${psTitle}"
  >
    <i class="pod-dark-grey fa ${psFontAwesomeIconClass}"></i>
    ${POD.ItemNb(plItems)}
  </a>
</%def>


<%def name="FirstTimeFakeDocument()">
  <div id='application-document-panel' class="span5">
    <div id='current-document-content' class="well">
      ${_('<p>We suggest you to start...<br/><br/></p>')|n}
      <h4>
        <i class="fa fa-angle-double-left fa-3x fa-fw pod-blue" style="vertical-align: middle"></i>
        ${_('by working on existing items')}
      </h4>
      <p class="text-center">${_('or')}</p>
      <h4 class="">
        <i class="fa fa-angle-double-right fa-3x fa-fw pod-blue" style="vertical-align: middle;"></i>
        ${_('by creating a new document')}
        <a href="#${h.ID.AddDocumentModalForm()}" role="button" class="btn btn-success" style="float:right;" data-toggle="modal">
          <i class="fa fa-plus"></i>
          ${_('Create')}
        </a>
      </h4>
  
      ${DocumentEditModalDialog(None, None, tg.url('/api/create_document'), h.ID.AddDocumentModalForm(), 'Create your first document')}
      <div style="clear: both;"></div>
    </div>
    <script>
    </script>
  </div>
</%def>

<%def name="DocumentEditModalDialog(poParentNode, poNode, psPostUrl, psModalId, psTitle)">
  <div
    id="${psModalId}"
    class="modal hide"
    tabindex="-1"
    role="dialog"
    aria-labelledby="myModalLabel"
    aria-hidden="true">
    
   <div class="modal-header">
## MODAL HEADER
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
      <h3 id="myModalLabel">${psTitle}</h3>
## MODAL HEADER [END]
    </div>

    <div class="modal-body">
## MODAL BODY
      <form id='${psModalId}-form' method="GET" action="${psPostUrl}">
        <div style="padding: 0.5em 0 0 0">
          % if poNode!=None:
            <input type="hidden" name="node_id" value="${poNode.node_id}"/>
          % endif
          <input type="hidden" name="parent_id" value="${poParentNode.node_id if poParentNode else 0}"/>
          
          <input type="hidden" name="data_content" id="${psModalId}-textarea" />
          <input
            type="text"
            name="data_label"
            value="${poNode.data_label if poNode!=None else ''}"
            class="span4"
            placeholder="${_('document title')}"
          />
        </div>
        <div>
          ${POD.RichTextEditor(psModalId+'-textarea-wysiwyg', poNode.data_content if poNode!=None else '')}
        </div>
        % if poParentNode and poParentNode.is_shared:
          <p>
            <input type="checkbox" name="inherit_rights" checked="checked"/> 
            ${_('Share:')}
            <span class="pod-grey">${_('if checked, then copy share properties from current item')}</span>
          </p>
        % endif
      </form>

## MODAL BODY [END]
    </div>
    
    <div class="modal-footer">
## MODAL FOOTER
      <button class="btn" data-dismiss="modal" aria-hidden="true">
        <i class="fa fa-ban"></i> ${_('Cancel')}
      </button>
      <button class="btn btn-success" id="${psModalId}-form-submit-button">
        <i class="fa fa-check"></i> ${_('Save changes')}
      </button>
## MODAL FOOTER [END]
      <script>
        $('#${psModalId}-form-submit-button').click(function(){
          $('#${psModalId}-textarea-wysiwyg').cleanHtml();
          $('#${psModalId}-textarea').val($('#${psModalId}-textarea-wysiwyg').html());
          $('#${psModalId}-form')[0].submit();
        });
      </script>
    </div>
  </div>
</%def>


<%def name="FileEditModalDialog(poParentNode, poNode, psPostUrl, psModalId, psTitle)">
  <div
    id="${psModalId}"
    class="modal hide"
    tabindex="-1"
    role="dialog"
    aria-labelledby="myModalLabel"
    aria-hidden="true">
    
    <div class="modal-header">
    ## MODAL HEADER
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
      <h3 id="myModalLabel">${psTitle}</h3>
    ## MODAL HEADER [END]
    </div>

    <div class="modal-body">
    ## MODAL BODY
      <form id='${psModalId}-form' method="POST" action="${psPostUrl}" enctype="multipart/form-data">
          % if poNode!=None:
            <input type="hidden" name="node_id" value="${poNode.node_id}"/>
          % endif
          <input type="hidden" name="parent_id" value="${poParentNode.node_id if poParentNode else 0}"/>
          <input type="hidden" name="data_content" id="${psModalId}-textarea" />
        <div>
          <label>
            ${_('Title')}
            <input
              type="text"
              name="data_label"
              value="${poNode.data_label if poNode!=None else ''}"
              class="span4"
              placeholder="${_('this field is optionnal')}"
            />
          </label>
          <label>
            ${_('Choose a file...')}
            <input type="file" class="span4" placeholder="${_('choose a file...')}" name="data_file"/>
          </label>
          
        </div>
        <div>
          <label>${_('File description (optionnal)')}</label>
          ${POD.RichTextEditor(psModalId+'-textarea-wysiwyg', poNode.data_content if poNode!=None else '', '')}
        </div>
        % if poParentNode and poParentNode.is_shared:
          <p>
            <input type="checkbox" name="inherit_rights" checked="checked"/>
            ${_('Share:')}
            <span class="pod-grey">${_('if checked, then copy share properties from current item')}</span>
          </p>
        % endif
      </form>
    ## MODAL BODY [END]
    </div>
    
    <div class="modal-footer">
    ## MODAL FOOTER
      <button class="btn" data-dismiss="modal" aria-hidden="true">
        <i class="fa fa-ban"></i> ${_('Cancel')}
      </button>
      <button class="btn btn-success" id="${psModalId}-form-submit-button">
        <i class="fa fa-check"></i> ${_('Save changes')}
      </button>
      <script>
        $('#${psModalId}-form-submit-button').click(function(){
          $('#${psModalId}-textarea-wysiwyg').cleanHtml();
          $('#${psModalId}-textarea').val($('#${psModalId}-textarea-wysiwyg').html());
          $('#${psModalId}-form')[0].submit();
        });
      </script>
    ## MODAL FOOTER [END]
    </div>
  </div>
</%def>

<%def name="EventEditModalDialog(poParentNode, poNode, psPostUrl, psModalId, psTitle)">
  <div
    id="${psModalId}"
    class="modal hide"
    tabindex="-1"
    role="dialog"
    aria-labelledby="myModalLabel"
    aria-hidden="true">
    
    <div class="modal-header">
    ## MODAL HEADER
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
      <h3 id="myModalLabel">
        ${psTitle}
      </h3>
    ## MODAL HEADER [END]
    </div>

    <div class="modal-body">
    ###### MODAL BODY
      <form id='${psModalId}-form' action='${psPostUrl}' method='POST'>
        <input type="hidden" name='parent_id' value="${poParentNode.node_id if poParentNode else 0}"/>
        <fieldset>
          <label>
            ${_('Event')}
            <input type="text" name='data_label' placeholder="Event"/>
          </label>
          <label>
            ${_('Date and time')}
            <div class="datetime-picker-input-div input-append date">
              <input name='data_datetime' data-format="dd/MM/yyyy hh:mm" type="text" placeholder="date and time"/>
              <span class="add-on"><i data-time-icon="icon-g-clock" data-date-icon="icon-g-calendar"></i></span>
            </div>
          </label>
          <label>
            ${_('Event description:')}
            <div>
              <input type="hidden" name="data_content" id="${psModalId}-textarea" />
              ${POD.RichTextEditor(psModalId+'-textarea-wysiwyg', poNode.data_content if poNode!=None else '', 'boldanditalic')}
            </div>
          </label>
          % if poParentNode and poParentNode.is_shared:
            <label>
              <p>
                <input type="checkbox" name="inherit_rights" checked="checked"/>
                ${_('Share:')}
                <span class="pod-grey">${_('if checked, then copy share properties from current item')}</span>
              </p>
            <label>
          % endif
        </fieldset>
      </form>
    ###### MODAL BODY [END]
    </div>
    
    <div class="modal-footer">
    ###### MODAL FOOTER
      <button class="btn" data-dismiss="modal" aria-hidden="true">
        <i class="fa fa-ban"></i> ${_('Cancel')}
      </button>
      <button class="btn btn-success" id="${psModalId}-form-submit-button">
        <i class="fa fa-check"></i> ${_('Save changes')}
      </button>
      <script>
        $('#${psModalId}-form-submit-button').click(function(){
          $('#${psModalId}-textarea-wysiwyg').cleanHtml();
          $('#${psModalId}-textarea').val($('#${psModalId}-textarea-wysiwyg').html());
          $('#${psModalId}-form')[0].submit();
        });
      </script>
    ###### MODAL FOOTER [END]
    </div>
  </div>
</%def>

<%def name="ContactEditModalDialog(poParentNode, poNode, psPostUrl, psModalId, psTitle)">
  <div
    id="${psModalId}"
    class="modal hide"
    tabindex="-1"
    role="dialog"
    aria-labelledby="myModalLabel"
    aria-hidden="true">
    
    <div class="modal-header">
    ## MODAL HEADER
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
      <h3 id="myModalLabel">${psTitle}</h3>
    ## MODAL HEADER [END]
    </div>

    <div class="modal-body">
    ## MODAL BODY
      <form id='${psModalId}-form' method="POST" action="${psPostUrl}">
          % if poNode!=None:
            <input type="hidden" name="node_id" value="${poNode.node_id}"/>
          % endif
          <input type="hidden" name="parent_id" value="${poParentNode.node_id if poParentNode else 0}"/>
          <input type="hidden" name="data_content" id="${psModalId}-textarea" />
        <div>
          <label>
            ${_('Contact name and firstname')}
            <input
              type="text"
              name="data_label"
              value="${poNode.data_label if poNode!=None else ''}"
              class="span4"
              placeholder="${_('name, firstname, title...')}"
            />
          </label>
        </div>
        <div>
          <label>${_('Address, phone, email, company...')}</label>
          ${POD.RichTextEditor(psModalId+'-textarea-wysiwyg', poNode.data_content if poNode!=None else '', 'boldanditalic')}
        </div>
        % if poParentNode and poParentNode.is_shared:
          <label>
            <p>
              <input type="checkbox" name="inherit_rights" checked="checked"/>
              ${_('Share:')}
              <span class="pod-grey">${_('if checked, then copy share properties from current item')}</span>
            </p>
          <label>
        % endif

      </form>
    ## MODAL BODY [END]
    </div>
    
    <div class="modal-footer">
    ## MODAL FOOTER
      <button class="btn" data-dismiss="modal" aria-hidden="true">
        <i class="fa fa-ban"></i> ${_('Cancel')}
      </button>
      <button class="btn btn-success" id="${psModalId}-form-submit-button">
        <i class="fa fa-check"></i> ${_('Save changes')}
      </button>
      <script>
        $('#${psModalId}-form-submit-button').click(function(){
          $('#${psModalId}-textarea-wysiwyg').cleanHtml();
          $('#${psModalId}-textarea').val($('#${psModalId}-textarea-wysiwyg').html());
          $('#${psModalId}-form')[0].submit();
        });
      </script>
    ## MODAL FOOTER [END]
    </div>
  </div>
</%def>

<%def name="MoveDocumentModalDialog(poNode, psPostUrl, psModalId, psTitle)">
  <div
    id="${psModalId}"
    class="modal hide"
    tabindex="-1"
    role="dialog"
    aria-labelledby="myModalLabel"
    aria-hidden="true">
    
    <div class="modal-header">
    ## MODAL HEADER
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
      <h3 id="myModalLabel">${psTitle}</h3>
    ## MODAL HEADER [END]
    </div>

    <div class="modal-body">
    ## MODAL BODY
          <p>${_('Select the destination:')}</p>
          <div id="${psModalId}-new-parent-selector-treeview"></div>
          <script>
              /** return true or false if the node should be shown in the "move item" dialog treeview 
               */
              function shouldRemoveNodeFromMoveTreeView(parentTreeItem, currentTreeItem, rootList) {
                  if(currentTreeItem.id==${poNode.node_id}) {
                      console.log('Say OK to remove item #'+currentTreeItem.id+' from menu');
                      return true;
                  }
                  return false;
              }

              $(function () {
                  $('#${psModalId}-new-parent-selector-treeview').jstree({
                      "plugins" : [ "wholerow"],
                      'core' : {
                          'error': function (error) {
                              console.log('Error ' + error.toString())
                          },
                          'data' : {
                              'dataType': 'json',
                              'contentType': 'application/json; charset=utf-8',
                              'url' : function (node) {
                                  if (node.id==='#') {
                                      return '${tg.url("/api/menu/initialize", dict(current_node_id=poNode._oParent.node_id if poNode._oParent else 0))}';
                                  } else {
                                      return '${tg.url("/api/menu/children")}';
                                  }
                              },
                              'data' : function(node) {
                                  console.log("NODE => "+JSON.stringify(node))
                                  return {
                                      'id' : node.id
                                  };
                              },
                              'success': function (new_data) {
                                  console.log('loaded new menu data (for move operation)' + new_data)
                                  console.log(new_data);

                                  for (var i = new_data['d'].length; i--;) {
                                      prepareOrRemoveTreeNode(null, new_data['d'][i], new_data['d'], shouldRemoveNodeFromMoveTreeView);
                                  }
                                  return new_data;
                              },
                          },
                      }
                  });
              
                  $('#${psModalId}-new-parent-selector-treeview').on("select_node.jstree", function (e, data) {
                      new_parent_id_selected = data.selected[0];
                      $("#${psModalId}-form-new-parent-field").attr("value", new_parent_id_selected)
                      console.log("About to move document "+${poNode.node_id}+" as child of "+new_parent_id_selected);
                  });
              });
          </script>
          <form id='${psModalId}-form' method="POST" action="${psPostUrl}" enctype="multipart/form-data">
            <input type="hidden" name="node_id" value="${poNode.node_id}"/>
            <input type="hidden" name="new_parent_id" value="-1" id="${psModalId}-form-new-parent-field" />
          </form>
    ## MODAL BODY [END]
    </div>
    
    <div class="modal-footer">
    ## MODAL FOOTER
      <button class="btn" data-dismiss="modal" aria-hidden="true">
        <i class="fa fa-ban"></i> ${_('Cancel')}
      </button>
      <button class="btn btn-success" id="${psModalId}-form-submit-button">
        <i class="fa fa-check"></i> ${_('Save changes')}
      </button>
      <script>
        $('#${psModalId}-form-submit-button').click(function(){
          $('#${psModalId}-textarea-wysiwyg').cleanHtml();
          $('#${psModalId}-textarea').val($('#${psModalId}-textarea-wysiwyg').html());
          $('#${psModalId}-form')[0].submit();
        });
      </script>
    ## MODAL FOOTER [END]
    </div>
  </div>
</%def>

<%def name="TabbedMetadataPanelContent(current_user, current_node)">
    <div class="tabbable">
        <ul class="nav nav-tabs" style="margin-bottom: 0em;">
            <li>${MetadataTab('#subdocuments', 'tab', _('Subdocuments'), 'fa-file-text-o', current_node.getChildren())}</li>
            <li>${MetadataTab('#events', 'tab', _('Calendar'), 'fa-calendar', current_node.getEvents())}</li>
            <li>${MetadataTab('#contacts', 'tab', _('Address book'), 'fa-user', current_node.getContacts())}</li>
            <li class="active">${MetadataTab('#comments', 'tab', _('Comment thread'), 'fa-comments-o', current_node.getComments())}</li>
            <li>${MetadataTab('#files', 'tab', _('Attachments'), 'fa-paperclip', current_node.getFiles())}</li>
            <li class="pull-right">${MetadataTab('#accessmanagement', 'tab', _('Access Management'), 'fa-key', current_node.getGroupsWithSomeAccess())}</li>
            <li class="pull-right">${MetadataTab('#history', 'tab', _('History'), 'fa-history', current_node.getHistory())}</li>
        </ul>
        
        ################################
        ##
        ## PANEL SHOWING ASSOCIATED DATA AND METADATA
        ##
        ################################
        <div class="tab-content">
            <div class="tab-pane" id="subdocuments">${DOCTABS.SubdocumentContent(current_node)}</div>
            <div class="tab-pane" id="events">${DOCTABS.EventTabContent(current_user, current_node)}</div>
            <div class="tab-pane" id="contacts">${DOCTABS.ContactTabContent(current_node)}</div>
            <div class="tab-pane active" id="comments">${DOCTABS.CommentTabContent(current_user, current_node)}</div>
            <div class="tab-pane" id="files">${DOCTABS.FileTabContent(current_node)}</div>
            <div class="tab-pane" id="history">${DOCTABS.HistoryTabContent(current_node)}</div>
            <div class="tab-pane" id="accessmanagement">${DOCTABS.AccessManagementTab(current_node, current_user_rights, current_user)}</div>
        </div>
    </div>
</%def>

<%def name="ContentExplorerPanelContent(user, node)">
    <link rel="stylesheet" href="${tg.url('/jstree/dist/themes/default/style.min.css')}" />
    <script src="${tg.url('/jstree/dist/jstree.js')}"></script>
    <style>
      #left-menu-treeview {overflow:hidden;}
      #left-menu-treeview:hover {overflow:visible; }
    </style>
    <h5>${_('Content explorer')}</h5>
    <div id="left-menu-treeview"></div>
    <script>
        function prepareOrRemoveTreeNode(parentTreeViewItem, currentTreeViewItem, rootList, shouldRemoveNodeCallBack) {
            // In case parentTreeViewItem is Null, then use rootList as the parent
            
            console.log("node #"+currentTreeViewItem.id+' => '+currentTreeViewItem.node_status);
            
            if(shouldRemoveNodeCallBack && shouldRemoveNodeCallBack(parentTreeViewItem, currentTreeViewItem, rootList)) {
                console.log('Will remove node #'+currentTreeViewItem.id+' from tree view');
                if(parentTreeViewItem!=null) {
                    var currentTreeViewItemPosition = parentTreeViewItem.children.indexOf(currentTreeViewItem);
                    if(currentTreeViewItemPosition != -1) {
                        parentTreeViewItem.children.splice(currentTreeViewItemPosition, 1);
                    }
                } else {
                    var currentTreeViewItemPosition = rootList.indexOf(currentTreeViewItem);
                    if(currentTreeViewItemPosition != -1) {
                        rootList.splice(currentTreeViewItemPosition, 1);
                    }
                }
                
            } else {
                for (var i = currentTreeViewItem.children.length; i--;) {
                    console.log('processing node #'+currentTreeViewItem.children[i].id);
                    prepareOrRemoveTreeNode(currentTreeViewItem, currentTreeViewItem.children[i], rootList, shouldRemoveNodeCallBack);
                }
            }
        }
      
        function shouldRemoveNodeDoneCallBack(parentTreeViewItem, currentTreeViewItem, rootList) {
            if(currentTreeViewItem.node_status=='done' || currentTreeViewItem.node_status=='closed') {
                console.log('Hide item #'+currentTreeViewItem.id+' from menu (status is '+currentTreeViewItem.node_status+')');
                return true;
            }
            return false;
        }
      
        $(function () {
            $('#left-menu-treeview').jstree({
                'plugins' : [ 'wholerow', 'types' ],
                'core' : {
                    'error': function (error) {
                        console.log('Error ' + error.toString())
                    },
                    'data' : {
                        'dataType': 'json',
                        'contentType': 'application/json; charset=utf-8',
                        'url' : function (node) {
                            if (node.id==='#') {
                                return '${tg.url("/api/menu/initialize", dict(current_node_id=node.node_id if node else 0))}';
                            } else {
                                return '${tg.url("/api/menu/children")}';
                            }
                        },
                        'data' : function(node) {
                            console.log("NODE => "+JSON.stringify(node))
                            return {
                                'id' : node.id
                            };
                        },
                        'success': function (new_data) {
                            console.log('loaded new menu data' + new_data)
                            console.log(new_data);

                            for (var i = new_data['d'].length; i--;) {
                                prepareOrRemoveTreeNode(null, new_data['d'][i], new_data['d'], shouldRemoveNodeDoneCallBack);
                            }
                            return new_data;
                        },
                    },
                }
            });
        
            $('#left-menu-treeview').on("select_node.jstree", function (e, data) {
                url = "${tg.url('/document/')}"+data.selected[0];
                console.log("Opening document: "+url);
                location.href = url;
            });
          
            $('#left-menu-treeview').on("loaded.jstree", function () {
                nodes = $('#left-menu-treeview .jstree-node');
                console.log("nodes = "+nodes.length);
                if (nodes.length<=0) {
                    $("#left-menu-treeview").append( "<p class='pod-grey'>${_('There is no content yet.')|n}" );
                    $("#left-menu-treeview").append( "<p><a class=\"btn btn-success\" data-toggle=\"modal\" role=\"button\" href=\"#add-document-modal-form\"><i class=\"fa fa-plus\"></i> ${_('Create a topic')}</a></p>" );
                }
            });
        });
    </script>
</%def>
