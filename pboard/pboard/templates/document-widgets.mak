<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

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

<%def name="ToolbarMenuItemModal(psTargetModalId, psIconClasses, psMenuLabel)">
  <li><a href="#${psTargetModalId}" role="button" data-toggle="modal"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
</%def>

<%def name="ToolbarMenuItemInline(psTargetId, psIconClasses, psMenuLabel)">
  <li><a href="#${psTargetId}"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
</%def>
<%def name="ToolbarMenuItemLink(psTargetUrl, psIconClasses, psMenuLabel, psLinkCss='', psLinkTitle='')">
  % if psTargetUrl=='#':
    <li class="disabled"><a href="${psTargetUrl}" class="${psLinkCss}" title="${psLinkTitle}"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
  % else:
    <li><a href="${psTargetUrl}" class="${psLinkCss}" title="${psLinkTitle}"><i class="${psIconClasses}"></i> ${psMenuLabel}</a></li>
  % endif
</%def>

        
<%def name="Toolbar(poNode, plNodeStatusList, plRootNodes, psDivId)">
  <div id="${psDivId}">
    <div class="btn-group">
      ${POD.EditButton('current-document-content-edit-button', True)}
      <button class="btn btn-small"  data-toggle="dropdown" href="#"> 
        <i class="fa  fa-signal"></i>
        ${_("Change status")}
      </button>
      <a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">
        <span class="caret"></span>
      </a>
      <ul class="dropdown-menu">
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
    <div class="btn-group ">
      <a
        class="btn btn-small btn-warning"
        href="#"
        data-toggle="dropdown"
        title="${_('Move to')}"
        ><i class="fa fa-arrows"></i></a>
      <ul class="dropdown-menu">
        <li >
          <div class="btn-warning strong" ><strong><i class="fa fa-magic"></i> ${_("Move the document...")}</strong><br/></div>
          <div class="pod-grey"><i>move the document to...</i></div>
        </li>
        ${node_treeview_for_set_parent_menu(poNode.node_id, plRootNodes)}
      </ul>
      <a
        class="btn btn-small btn-danger"
        href='${tg.url('/api/edit_status', dict(node_id=poNode.node_id, node_status='deleted'))}'
        id='current-document-force-delete-button' onclick="return confirm('${_('Delete current document?')}');"
        title="${_('Delete')}"
        ><i class="fa fa-trash-o"></i></a>
    </div>
  </div>
</%def>

<%def name="BreadCrumb(poNode)">
  <ul class="breadcrumb span12">
    <li>
      <span class="divider">/</span>
      <a href="${tg.url('/document/')}">Documents</a>
    </li>
    % if poNode!=None:
      % for breadcrumb_node in poNode.getBreadCrumbNodes():
      <li>
        <span class="divider">/</span>
        <a href="${tg.url('/document/%s'%(breadcrumb_node.node_id))}">${breadcrumb_node.getTruncatedLabel(30)}</a>
      </li>
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
    <div id='current-document-content' class="">
      <p class="well">
        <strong>${_('Welcome aboard')}</strong>
        <i class="fa fa-smile-o fa-2x"></i>
      </p>
      ${_('<p>We suggest you to...<br/><br/></p>')|n}
      <h4>
        <i class="fa fa-angle-double-left fa-3x fa-fw pod-blue" style="vertical-align: middle"></i>
        ${_('work on existing documents')}
      </h4>
      <p class="text-center">${_('or')}</p>
      <h4 class="text-right">
        ${_('create a new document')}
        <i class="fa fa-angle-double-down fa-3x fa-fw pod-blue" style="vertical-align: middle"></i>
      </h4>
      <p class="pull-right">
        <a href="#${h.ID.AddDocumentModalForm()}" role="button" class="btn btn-success" data-toggle="modal">
          <i class="fa fa-plus"></i>
          ${_('Create a new document')}
        </a>
      </p>
  
      ${DocumentEditModalDialog(None, None, tg.url('/api/create_document'), h.ID.AddDocumentModalForm(), 'Create your first document')}
      <div style="clear: both;"></div>
      <p class="alert alert-info" style="margin-top: 2em;">
        <i class="fa fa-info-circle"></i> ${_('<strong>Note :</strong> You can even create a dummy document: you will be able to remove it later.')|n}
      </p>
    </div>
    <script>
    </script>
  </div>
</%def>

<%def name="DocumentEditModalDialog(piParentNodeId, poNode, psPostUrl, psModalId, psTitle)">
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
          <input type="hidden" name="parent_id" value="${piParentNodeId if piParentNodeId else 0}"/>
          
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


<%def name="FileEditModalDialog(piParentNodeId, poNode, psPostUrl, psModalId, psTitle)">
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
          <input type="hidden" name="parent_id" value="${piParentNodeId if piParentNodeId else 0}"/>
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

<%def name="EventEditModalDialog(piParentNodeId, poNode, psPostUrl, psModalId, psTitle)">
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
        <input type="hidden" name='parent_id' value='${current_node.node_id}'/>
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

<%def name="ContactEditModalDialog(piParentNodeId, poNode, psPostUrl, psModalId, psTitle)">
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
          <input type="hidden" name="parent_id" value="${piParentNodeId if piParentNodeId else 0}"/>
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
