<%inherit file="local:templates.master"/>
<%def name="get_icon_class_from_node_type(node_type)">

</%def>

<%def name="node_treeview(node_list, indentation=0)">
  % if len(node_list)>0:
    <!--ul style="list-style:none; margin-left: ${(indentation+1)*0.5}em;"-->
    % for node in node_list:
      <tr title="Last updated: ${node.updated_at}">
        <td style="padding-left: ${(indentation+1)*0.5}em;">
          <a href="?node=${node.node_id}" title="${node.data_label}">
            <i class='${node.getIconClass()}'></i>
            % if len(node.data_label)<=15:
              ${node.data_label}
            % else:
              ${node.data_label[0:15]}...
            % endif
          </a>
        </td>
        <td class="text-right">
          <a href="${tg.url('/move_node_upper?node_id=%i'%(node.node_id))}" title="Move up"><i class=" icon-g-up-arrow"></i></a>
          <a href="${tg.url('/move_node_lower?node_id=%i'%(node.node_id))}" title="Move down"><i class=" icon-g-down-arrow"></i></a>
          <a href="" title="Edit"><i class="icon-g-edit"></i></a>
        </td>
      </tr>
      ${node_treeview(node.getChildren(), indentation+1)}
    % endfor
    <!--/ul-->
  % endif
</%def>

<%def name="node_treeview_in_select_field(node_list, indentation)">
    % if len(node_list)>0:
      % if indentation==0:
        <option style="margin-left: ${0.5*indentation}em; color: #CCC;" value="0">no parent...</option>
      % endif
      % for node in node_list:
        <option style="margin-left: ${0.5*indentation}em;" value="${node.node_id}">${node.data_label}</option>
        ${node_treeview_in_select_field(node.getChildren(), indentation+1)}
      % endfor
      </ul>
    % endif
</%def>

<%def name="title()">
Learning TurboGears 2.3: Quick guide to the Quickstart pages.
</%def>

  <div class="row">
    <div class="span3">
      <legend>
        Documents
      </legend>

      <!-- Button to trigger modal -->
      <p>
        <a href="#addFolderNode" role="button" class="btn" data-toggle="modal">
          <i class="icon-g-circle-plus"></i> Create document</a>
      </p>
      <!-- Modal -->
      <div id="addFolderNode" class="modal hide" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
          <h3 id="myModalLabel">Create a new page</h3>
        </div>
        <div class="modal-body">
          <form id="create_document_form" method="POST" action="${tg.url('/create_document')}" class="form-horizontal">
            <div class="control-group">
              <label class="control-label" for="data_label">Title</label>
              <div class="controls">
                <input type="text" id="data_label" name="data_label" placeholder="page title...">
              </div>
            </div>
            <div class="control-group">
              <label class="control-label" for="parent_id">As child of...</label>
              <div class="controls">
                <select id="parent_id" name="parent_id" placeholder="as child of...">
                  ${node_treeview_in_select_field(root_node_list, 0)}
                </select>
              </div>
            </div>
            <div class="control-group">
              <label class="control-label" for="data_content">Description</label>
              <div class="controls">

                <textarea id="data_content" name="data_content"></textarea>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
          <button id="create_document_save_button" class="btn btn-primary">Save changes</button>
        </div>
      </div>

      <div>
        <table class="table table-striped table-hover table-condensed">
          ${node_treeview(root_node_list)}
        </table>
      </div>
    </div>
    <div class="span5">
      <div class="page-header">
        <h3>${current_node.data_label}</h3>
      </div>

      <div class="btn-group">
        <button class="btn"><i class="icon-g-edit"></i> Edit</button>

      </div>

      <div class="btn-group">
        <a class="btn btn-primary" href="#"><i class="icon-g-stats icon-g-white"></i> Status</a>
        <a class="btn btn-primary dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>
        <ul class="dropdown-menu">
        
          
  
          <li><a class="btn-success" href="#"><i class="icon-g-sun"></i> Open</a></li>
          <li><a class="btn-warning" href="#"><i class="icon-g-rotation-lock"></i> in Standby</a></li>
          <li><a class="btn-danger"  href="#"><i class="icon-g-circle-exclamation-mark"></i> Hot</a></li>
          <li><a class="btn " href="#"><i class="icon-g-ok"></i> Finished</a></li>
          <li><a class="btn btn-disabled" href="#"><i class="icon-g-ban"></i> Archived</a></li>
        </ul>

      </div>

      <div class="btn-group">
        <a class="btn btn-primary" href="#" ><i class="icon-g-circle-plus icon-g-white"></i> Add</a>
        <a class="btn btn-primary dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>
        <ul class="dropdown-menu">
          <li><a href="#"><i class="icon-g-calendar" ></i> Event</a></li>
          <li><a href="#"><i class="icon-g-comments"></i> Comment</a></li>
          <li><a href="#"><i class="icon-g-user"></i> Contact</a></li>
          <li><a href="#"><i class="icon-g-attach"></i> File</a></li>
        </ul>
      </div>

      <div class="btn-group">
        <button class="btn btn-danger"><i class="icon-g-white icon-g-remove"></i> Delete</button>
      </div>
      
    
      <div>
        ${current_node.data_content|n}
      </div>
    </div>
    <div class="span4">
      <div class="tabbable">
        <ul class="nav nav-tabs">
            <li class="active">
              <a href="#events" data-toggle="tab" title="History"><i class="icon-g-calendar"></i></a>
            </li>
            <li><a href="#contacts" data-toggle="tab" title="Contacts"><i class="icon-g-user""></i> </a></li>
            <li><a href="#comments" data-toggle="tab" title="Comments"><i class="icon-g-comments"></i> </a></li>
            <li><a href="#files" data-toggle="tab" title="Files"><i class="icon-g-attach"></i> </a></li>
        </ul>
        <div class="tab-content">
            <div class="tab-pane active" id="events">
              <!--p class="text-right" >
                <button class="text-right btn btn-info " type="button"><i class="icon-g-plus icon-g-white"></i> new event</button>
              </p-->
              <table class="table table-striped table-hover table-condensed">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>
                      Event
                    </th>
                    <th>
                      <a href="" title="Add an event"><i class="icon-g-plus"></i></a>
                    </th>
                  </tr>
                </thead>
              % for event in current_node.getEvents():
                <tr title="Last updated: ${event.updated_at}">
                   <td>${event.getFormattedDate(event.data_datetime)}</td>
                   <td>${event.getFormattedTime(event.data_datetime)}</td>
                   <td>${event.data_label}</td>
                   <td>
                     <a href=""><i class="icon-g-edit"></i></a>
                   </td>
                </tr>
              % endfor
              </table>
            </div>
            <div class="tab-pane" id="contacts">
              % for contact in current_node.getContacts():
                <div class="well">
                  <legend class="text-info">${contact.data_label}</legend>
                  <div>${contact.data_content|n}</div>
                </div>
              % endfor
            </div>
            <div class="tab-pane" id="comments">${current_node.data_content|n}</div>
            <div class="tab-pane" id="files">Files</div>
        </div>
      </div>
    </div>
  </div>

