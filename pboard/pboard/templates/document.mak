<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>
<%namespace name="DOC" file="pboard.templates.document-widgets"/>
<%namespace name="DOCTABS" file="pboard.templates.document-widgets-tabs"/>

<%def name="title()">
  % if current_node!=None:
    pod :: document ${current_node.getTruncatedLabel(40)} [#${current_node.node_id} / ${current_node.getStatus().label}]
  % else:
    pod :: document root
  % endif
</%def>

<%def name="node_treeview(node_list, indentation=0)">
  % if len(node_list)<=0 and indentation==0:
    <p class="pod-grey">${_('You have no document yet.')}</p>
  % endif

  % if len(node_list)>0:
    % for item in node_list:
      <div id='pod-menu-item-${item.node.node_id}' class="pod-toolbar-parent ${'pod-status-active' if current_node!=None and item.node.node_id==current_node.node_id else ''}" style="padding-left: ${(indentation+2)*0.5}em; position: relative;">
        <a class="toggle-child-menu-items"><i class='${item.node.getIconClass()}'></i></a>
        <a href="${tg.url('/document/%s'%(item.node.node_id))}" title="${item.node.data_label}">
          % if item.node.getStatus().status_family=='closed' or item.node.getStatus().status_family=='invisible':
            <strike>
          % endif
              ${item.node.getTruncatedLabel(32-0.8*(indentation+1))}
          % if item.node.getStatus().status_family=='closed' or item.node.getStatus().status_family=='invisible':
            </strike>
          % endif
        </a>
        <div class="pod-toolbar">
          <a href="${tg.url('/api/move_node_upper?node_id=%i'%(item.node.node_id))}" title="${_('Move up')}"><i class="fa fa-arrow-up"></i></a>
          <a href="${tg.url('/api/move_node_lower?node_id=%i'%(item.node.node_id))}" title="${_('Move down')}"><i class="fa fa-arrow-down"></i></a>
        </div>
        <div class="pod-status ${item.node.getStatus().css}" title='${item.node.getStatus().label}'>
           <i class='${item.node.getStatus().icon}'></i>
        </div>
      </div>
      % if len(item.children)>0:
        <div id="pod-menu-item-${item.node.node_id}-children">${node_treeview(node_list=item.children, indentation=indentation+1)}</div>
      % endif
    % endfor
  % endif
</%def>

<%def name="node_treeview_in_select_field(node_list, indentation, selected_id=0)">
    % if len(node_list)>0:
      % if indentation==0:
        <option style="margin-left: ${0.5*indentation}em; color: #CCC;" value="0">no parent...</option>
      % endif
      % for node in node_list:
        % if selected_id!=node.node_id:
          <option style="margin-left: ${0.5*indentation}em;" value="${node.node_id}">${node.data_label}</option>
        % else:
          <option style="margin-left: ${0.5*indentation}em;" value="${node.node_id}" selected>${node.data_label}</option>
        % endif
        ${node_treeview_in_select_field(node.getChildren(), indentation+1, selected_id)}
      % endfor
    % endif
</%def>

#######
##
## HERE COMES THE BREADCRUMB
##
  <div class="row">
    ${DOC.BreadCrumb(current_node, allowed_nodes)}
  </div>

  <div class="row">
    <div id='application-left-panel' class="span3" >
      <link rel="stylesheet" href="${tg.url('/jstree/dist/themes/default/style.min.css')}" />
      <script src="${tg.url('/jstree/dist/jstree.js')}"></script>
      <style>
        #mypodtree {overflow:hidden;}
        #mypodtree:hover {overflow:visible; }
      </style>
      <h5>${_('Content explorer')}</h5>
      <div id="mypodtree"></div>
      <script>
        $(function () {
          $('#mypodtree').jstree({
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
                    return '${tg.url("/api/menu/initialize", dict(current_node_id=current_node.node_id if current_node else 0))}';
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
                  return new_data;
                },
              },
            }
          });
          
          $('#mypodtree').on("select_node.jstree", function (e, data) {
            url = "${tg.url('/document/')}"+data.selected[0];
            console.log("Opening document: "+url);
            location.href = url;
          });
          
          $('#mypodtree').on("loaded.jstree", function () {
            nodes = $('#mypodtree .jstree-node');
            console.log("nodes = "+nodes.length);
            if (nodes.length<=0) {
              $("#mypodtree").append( "<p class='pod-grey'>${_('There is no content yet.')|n}</p>" );
            }
          });
        });
      </script>
## INFO - D.A. - 2014-05-28 - Hide old school menu
##      <div>
##        ${node_treeview(menu_node_list)}
##      </div>
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
            ######
            ##
            ## CURRENT DOCUMENT TOOLBAR - START
            ##
            ## The Toolbar is a div with a specific id
            ##
            ${DOC.Toolbar(current_node, node_status_list, root_node_list_for_select_field, 'current-document-toobar')}
            ${DOC.ShowTitle(current_node, keywords, 'current-document-title')}
            ${DOC.ShowContent(current_node, keywords)}
          </div>
          ${DOC.EditForm(current_node)}
        </div>
        <div id='application-metadata-panel' class="span4">
          ######
          ##
          ## HERE WE INCLUDE ALL MODAL DIALOG WHICH WILL BE ACCESSIBLE THROUGH TABS OR MENU
          ##
          ${DOC.DocumentEditModalDialog(current_node, None, tg.url('/api/create_document'), h.ID.AddDocumentModalForm(current_node), _('New Sub-document'))}
          ${DOC.EventEditModalDialog(current_node, None, tg.url('/api/create_event'), h.ID.AddEventModalForm(current_node), _('Add an event'))}
          ${DOC.ContactEditModalDialog(current_node, None, tg.url('/api/create_contact'), h.ID.AddContactModalForm(current_node), _('Add a new contact'))}
          ${DOC.FileEditModalDialog(current_node, None, tg.url('/api/create_file'), h.ID.AddFileModalForm(current_node), _('Add a new file'))}
          ${DOC.MoveDocumentModalDialog(current_node, tg.url('/api/set_parent_node'), h.ID.MoveDocumentModalForm(current_node), _('Move the document'))}

          <div class="tabbable">
            <ul class="nav nav-tabs" style="margin-bottom: 0em;">
                <li>${DOC.MetadataTab('#subdocuments', 'tab', _('Subdocuments'), 'fa-file-text-o', current_node.getChildren())}</li>
                <li class="active">${DOC.MetadataTab('#events', 'tab', _('Calendar'), 'fa-calendar', current_node.getEvents())}</li>
                <li>${DOC.MetadataTab('#contacts', 'tab', _('Address book'), 'fa-user', current_node.getContacts())}</li>
                <li>${DOC.MetadataTab('#comments', 'tab', _('Comment thread'), 'fa-comments-o', current_node.getComments())}</li>
                <li>${DOC.MetadataTab('#files', 'tab', _('Attachments'), 'fa-paperclip', current_node.getFiles())}</li>
                <li class="pull-right">${DOC.MetadataTab('#accessmanagement', 'tab', _('Access Management'), 'fa-key', current_node.getGroupsWithSomeAccess())}</li>
                <li class="pull-right">${DOC.MetadataTab('#history', 'tab', _('History'), 'fa-history', current_node.getHistory())}</li>
            </ul>
            ################################
            ##
            ## PANEL SHOWING ASSOCIATED DATA AND METADATA
            ##
            ################################
            <div class="tab-content">
              <div class="tab-pane" id="subdocuments">${DOCTABS.SubdocumentContent(current_node)}</div>
              <div class="tab-pane active" id="events">${DOCTABS.EventTabContent(current_node)}</div>
              <div class="tab-pane" id="contacts">${DOCTABS.ContactTabContent(current_node)}</div>
              <div class="tab-pane" id="comments">${DOCTABS.CommentTabContent(current_user, current_node)}</div>
              <div class="tab-pane" id="files">${DOCTABS.FileTabContent(current_node)}</div>
              <div class="tab-pane" id="history">${DOCTABS.HistoryTabContent(current_node)}</div>
              <div class="tab-pane" id="accessmanagement">${DOCTABS.AccessManagementTab(current_node)}</div>
            </div>
          </div>
        </div>
      </div>
      % endif
    </div>
  </div>
</div>
