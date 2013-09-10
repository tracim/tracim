<%inherit file="local:templates.master"/>



<%def name="node_treeview(node_list, indentation=-1)">
  % if indentation==-1:
    <tr>
      <td style="padding-left: ${(indentation+1)*0.8}em;">
        <a href="?node=0" title="${_('Root')}">
          <i class='icon-g-folder-open'></i>
          ${_('Root')}
        </a>
      </td>
      <td class="text-right">
        <div class="pod-toolbar">
          <a href="${tg.url('/create_document?parent_id=0')}" title="${_('Add child document')}"><i class="icon-g-circle-plus"></i></a>
        </div>
      </td>
    </tr>
    ${node_treeview(node_list, 0)}
  % else:
    % if len(node_list)>0:
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
            <div class="pod-toolbar">
              <a href="${tg.url('/move_node_upper?node_id=%i'%(node.node_id))}" title="${_('Move up')}"><i class="icon-g-up-arrow"></i></a>
              <a href="${tg.url('/move_node_lower?node_id=%i'%(node.node_id))}" title="${_('Move down')}"><i class="icon-g-down-arrow"></i></a>
              <a href="${tg.url('/create_document?parent_id=%i'%(node.node_id))}" title="${_('Add child document')}"><i class="icon-g-circle-plus"></i></a>
            </div>
          </td>
        </tr>
        ${node_treeview(node.getChildren(), indentation+1)}
      % endfor
    % endif
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

<%def name="title()">
Learning TurboGears 2.3: Quick guide to the Quickstart pages.
</%def>

  <div class="row">
    <div class="span3">
      <legend>
        Documents
      </legend>

      <div>
        <table class="table table-striped table-hover table-condensed">
          ${node_treeview(root_node_list)}
        </table>
      </div>
    </div>
    <div class="span5">
      <div class="page-header">
        <h3 id="current-document-title">${current_node.data_label}</h3>
        <form id="current-document-title-edit-form" method='post' action='${tg.url('/edit_label')}'>
          <div class="input-prepend input-append">
            <input type='hidden' name='node_id' value='${current_node.node_id}'/>
            <button id="current-document-title-edit-cancel-button" type="button" class="btn" title="${_('Cancel editing')}"><i class="icon-g-ban"></i></button>
            <input type='text' name='data_label' value='${current_node.data_label}' class="span2" />
            <button id='current-document-title-save-cancel-button' type="button" class="btn" title="${_('Save')}"><i class="icon-g-edit"></i></button>
          </div>
        </form>
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
        <button id='current-document-content-edit-button' class="btn"><i class='icon-g-edit'></i> ${_('Edit')}</button>
      </div>
      <div class="btn-group">
        <a href='${tg.url('/force_delete_node?node_id=%i'%(current_node.node_id))}' id='current-document-force-delete-button' class="btn btn-danger"><i class="icon-g-white icon-g-remove"></i> ${_('Delete')}</a>
      </div>
      <p>
        <div id='current-document-content' class="">
          ${current_node.data_content|n}
        </div>
        <form id="current-document-content-edit-form" method='post' action='${tg.url('/edit_content')}'>
          <input type='hidden' name='node_id' value='${current_node.node_id}'/>
          <textarea id="current_node_textarea" name='data_content' spellcheck="false" wrap="off" autofocus placeholder="Enter something ...">
            ${current_node.data_content|n}
          </textarea>
          <button id="current-document-content-edit-cancel-button" type="button" class="btn" title="${_('Cancel editing')}"><i class="icon-g-ban"></i> ${_('Cancel')}</button>
          <button id='current-document-content-edit-save-button' type="button" class="btn" title="${_('Save')}"><i class="icon-g-edit"></i>  ${_('Save')}</button>
        </form>
      </p>
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

