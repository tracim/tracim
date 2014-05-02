<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

<%def name="node_treeview_for_set_parent_menu(node_id, node_list, indentation=-1)">
  % if indentation==-1:
    <li>
      <a href="${tg.url('/api/set_parent_node?node_id=%i&new_parent_id=0'%(current_node.node_id))}">
        <i class="fa fa-file-text-o"></i> ${_('Home')}
      </a>
      ${node_treeview_for_set_parent_menu(node_id, node_list, 0)}
    </li>
  % else:
    % if len(node_list)>0:
      <ul style="list-style: none;">
      % for new_parent_node in node_list:
        <li>
          <a href="${tg.url('/api/set_parent_node?node_id=%i&new_parent_id=%i'%(node_id, new_parent_node.node_id))}"><i class="fa fa-file-text-o"></i> ${new_parent_node.getTruncatedLabel(40-indentation*2)}
          </a>
          ${node_treeview_for_set_parent_menu(node_id, new_parent_node.getStaticChildList(), indentation+1)}
        </li>
      % endfor
      </ul>
    % endif
  % endif
</%def>

<%def name="Toolbar(poNode, plNodeStatusList, plRootNodes, psDivId)">
  <div id="${psDivId}">
    <div class="btn-group">
  % if poNode.parent_id!=None and poNode.parent_id!=0:
      ${POD.EditButton('current-document-content-edit-button', True)}
  % endif
      <button class="btn btn-small"  data-toggle="dropdown" href="#"> 
        <i class="fa  fa-signal"></i>
        ${_("Change status")}
      </button>
      <a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">
        <span class="caret"></span>
      </a>
      <ul class="dropdown-menu">
      % for node_status in plNodeStatusList:
        % if node_status.status_id==poNode.getStatus().status_id:
        <li title="${h.getExplanationAboutStatus(node_status.status_id, current_node.getStatus().status_id)}">
          <a class="${node_status.css}" href="#"  style="color: #999;">
            <i class="${node_status.icon_id}"></i> ${node_status.label}
          </a>
        </li>
        % else:
        <li title="${h.getExplanationAboutStatus(node_status.status_id, current_node.getStatus().status_id)}">
          <a class="${node_status.css}" href="${tg.url('/api/edit_status?node_id=%i&node_status=%s'%(current_node.node_id, node_status.status_id))}">
            <i class="${node_status.icon_id}"></i> ${node_status.label}
          </a>
        </li>
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
          <div class="btn-success strong" ><strong><i class="fa fa-magic"></i> Add New...</strong><br/></div>
          <div class="pod-grey"><i>create a totally new item...</i></div>
        </li>

        <li><a><i class="fa fa-file-text-o"></i> Document</a></li>
        <li><a><i class="fa fa-paperclip"></i> File</a></li>
        <li><a><i class="fa fa-calendar"></i> Event</a></li>
        <li><a><i class="fa fa-user"></i> Contact</a></li>
        <li><a><i class="fa fa-comments-o"></i> Comment</a></li>

        <li class="divider" role="presentation"></li>

        <li>
          <div class="btn-warning strong" ><strong><i class="fa fa-link"></i> Add Existing...</strong><br/></div>
          <div class="pod-grey"><i>link to an existing item...</i></div>
        </li>
        <li><a><i class="fa fa-file-text-o"></i> Document</a></li>
        <li><a><i class="fa fa-paperclip"></i> File</a></li>
        <li><a><i class="fa fa-calendar"></i> Event</a></li>
        <li><a><i class="fa fa-user"></i> Contact</a></li>
        <li><a><i class="fa fa-comments-o"></i> Comment</a></li>

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
        href='${tg.url('/api/edit_status?node_id=%i&node_status=%s'%(poNode.node_id, 'deleted'))}'
        id='current-document-force-delete-button' onclick="return confirm('${_('Delete current document?')}');"
        title="${_('Delete')}"
        ><i class="fa fa-trash-o"></i></a>
    </div>
  </div>
</%def>

<%def name="BreadCrumb(poNode)">
  <ul class="breadcrumb span12">
    <li>
      <span class="divider"> / Documents /</span>
    </li>
    % for breadcrumb_node in poNode.getBreadCrumbNodes():
    <li>
      <a href="${tg.url('/document/%s'%(breadcrumb_node.node_id))}">${breadcrumb_node.getTruncatedLabel(30)}</a>
      <span class="divider">/</span>
    </li>
    % endfor
    <li class="active">${poNode.data_label}</li>
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
      <input
        type="text"
        name="data_label"
        value="${current_node.data_label}"
        class="span4"
        placeholder="${_('document title')}"
      />
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
      ${poNode.getStatus().label}
    </sup>
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

