<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>


<%def name="node_treeview_for_set_parent_menu(node_id, node_list, indentation=-1)">
  % if indentation==-1:
    <li><a href="${tg.url('/api/set_parent_node?node_id=%i&new_parent_id=0'%(current_node.node_id))}">${_('Root')}</a>
      ${node_treeview_for_set_parent_menu(node_id, node_list, 0)}
    </li>
  % else:
    % if len(node_list)>0:
      <ul>
      % for new_parent_node in node_list:
        <li>
          <a href="${tg.url('/api/set_parent_node?node_id=%i&new_parent_id=%i'%(node_id, new_parent_node.node_id))}">${new_parent_node.getTruncatedLabel(40-indentation*2)}</a>
          ${node_treeview_for_set_parent_menu(node_id, new_parent_node.getChildren(), indentation+1)}
        </li>
      % endfor
      </ul>
    % endif
  % endif
</%def>

<%def name="node_treeview(node_list, indentation=-1)">
  % if indentation==-1:
    <div class="pod-toolbar-parent" style="padding-left: 0.5em; position: relative;">
      <a href="?node=0" title="${_('Root')}">
        <i class='icon-g-folder-open'></i>
        ${_('Root')}
      </a>
      <div class="pod-toolbar">
        <a href="${tg.url('/create_document?parent_id=0')}" title="${_('Add child document')}"><i class="icon-g-circle-plus"></i></a>
      </div>
    </div>
    ${node_treeview(node_list, 0)}
  % else:
    % if len(node_list)>0:
      % for node in node_list:
        <div class="pod-toolbar-parent" style="padding-left: ${(indentation+2)*0.5}em; position: relative;">
          <a href="?node=${node.node_id}" title="${node.data_label}">
            % if node.getStatus().status_family=='closed' or node.getStatus().status_family=='invisible':
              <strike>
            % endif
            <i class='${node.getIconClass()}'></i> ${node.getTruncatedLabel(32-0.8*(indentation+1))}
            % if node.getStatus().status_family=='closed' or node.getStatus().status_family=='invisible':
              </strike>
            % endif
          </a>
          <div class="pod-toolbar">
            <a href="${tg.url('/move_node_upper?node_id=%i'%(node.node_id))}" title="${_('Move up')}"><i class="icon-g-up-arrow"></i></a>
            <a href="${tg.url('/move_node_lower?node_id=%i'%(node.node_id))}" title="${_('Move down')}"><i class="icon-g-down-arrow"></i></a>
            <a href="${tg.url('/create_document?parent_id=%i'%(node.node_id))}" title="${_('Add child document')}"><i class="icon-g-circle-plus"></i></a>
          </div>
          <div class="pod-status ${node.getStatus().css}" title='${node.getStatus().label}'>
             <i class='${node.getStatus().icon}'></i>
          </div>
        </div>
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
POD :: ${current_node.getTruncatedLabel(40)} [${current_node.getStatus().label}]
</%def>

  <div class="row">
    <div class="span3">
      <div class="btn-group">
        <button class="btn">${_('Documents')}</button>
        <button class="btn" title="${_('Show current filtering state')}"><i class="  icon-g-eye-open"></i></button>
        
        <a class="btn dropdown-toggle" data-toggle="dropdown" href="#" title='${_('Adjust filtering')}'><i class=" icon-g-adjust"></i></a>
                <ul class="dropdown-menu">
          % for node_status in node_status_list:
            <li>
              <a class="${node_status.css}" href="${tg.url('/edit_status?node_id=%i&node_status=%s'%(current_node.node_id, node_status.status_id))}">
                <i class="${node_status.icon_id}"></i> ${node_status.label}
              </a>
            </li>
          % endfor
        </ul>
      </div>
      <p></p>
      <div>
        ${node_treeview(root_node_list)}
      </div>
    </div>
    <div class="span9">
        
        
        
      <div class="btn-group">
        <button class="btn">Status</button>
        <a class="btn ${current_node.getStatus().css}" href="#"><i class="${current_node.getStatus().icon}"></i> ${current_node.getStatus().getLabel()}</a>
        <a class="btn ${current_node.getStatus().css} dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>
        <ul class="dropdown-menu">
          % for node_status in node_status_list:
            <li>
              <a class="${node_status.css}" href="${tg.url('/edit_status?node_id=%i&node_status=%s'%(current_node.node_id, node_status.status_id))}">
                <i class="${node_status.icon_id}"></i> ${node_status.label}
              </a>
            </li>
          % endfor
        </ul>
      </div>
      <div class="btn-group">
        ${POD.EditButton('current-document-content-edit-button', True)}
        <a class="btn" href="#" data-toggle="dropdown"><i class="icon-g-move"></i> ${_('Move to')} <span class="caret"></span></a>
        <ul class="dropdown-menu">
          ${node_treeview_for_set_parent_menu(current_node.node_id, root_node_list)}
        </ul>


        <a href='${tg.url('/force_delete_node?node_id=%i'%(current_node.node_id))}' id='current-document-force-delete-button' class="btn" onclick="return confirm('${_('Delete current document?')}');"><i class="icon-g-remove"></i> ${_('Delete')}</a>
      </div>
      
            <!--</div> PAGE HEADER -->
      <h3 id="current-document-title">${current_node.data_label}</h3>
        <form style='display: none; margin-top: 1em;' id="current-document-title-edit-form" method='post' action='${tg.url('/edit_label')}'>
          <div class="input-prepend input-append">
            <input type='hidden' name='node_id' value='${current_node.node_id}'/>
            ${POD.CancelButton('current-document-title-edit-cancel-button')}
            <input type='text' name='data_label' value='${current_node.data_label}' class="span2" />
            ${POD.SaveButton('current-document-title-save-cancel-button')}
          </div>
        </form>
      </div>
      <div class="span5">
      <p>
        <div id='current-document-content' class="">
          ${current_node.getContentWithTags()|n}
        </div>
        <form style='display: none;' id="current-document-content-edit-form" method='post' action='${tg.url('/edit_content')}'>
          <input type='hidden' name='node_id' value='${current_node.node_id}'/>
          <textarea id="current_node_textarea" name='data_content' spellcheck="false" wrap="off" autofocus placeholder="Enter something ...">
            ${current_node.data_content|n}
          </textarea>
          ${POD.CancelButton('current-document-content-edit-cancel-button', True)}
          ${POD.SaveButton('current-document-content-edit-save-button', True)}
        </form>
      </p>
    </div>
    <div class="span4">
      <div class="tabbable">
        <ul class="nav nav-tabs">
            <li class=""><a href="#tags" data-toggle="tab" title="${_('Tags')}"><i class='icon-g-tags'></i></a></li>
            <li class="active">
              <a href="#events" data-toggle="tab" title="History"><i class="icon-g-history"></i></a>
            </li>
            <li><a href="#contacts" data-toggle="tab" title="Contacts"><i class="icon-g-phone""></i> </a></li>
            <li><a href="#comments" data-toggle="tab" title="Comments"><i class="icon-g-comments"></i> </a></li>
            <li><a href="#files" data-toggle="tab" title="Files"><i class="icon-g-attach"></i> </a></li>
            <li><a href="#contacts" data-toggle="tab" title="Users"><i class="icon-g-user""></i> </a></li>
        </ul>
        <div class="tab-content">
            <div class="tab-pane" id="tags">
              % for tag in current_node.getTagList():
                ${POD.Badge(tag)}
              % endfor
            </div>
            <div class="tab-pane active" id="events">

${POD.AddButton('current-document-add-event-button', True, _(' Add event'))}
<form style='display: none;' id='current-document-add-event-form' action='${tg.url('/api/create_event')}' method='post' class="well">
  <input type="hidden" name='parent_id' value='${current_node.node_id}'/>
  <fieldset>
    <legend>Add an event</legend>
    <label>
      <input type="text" name='data_label' placeholder="Event"/>
    </label>
    <label>
      <div class="datetime-picker-input-div input-append date">
        <input name='data_datetime' data-format="dd/MM/yyyy hh:mm" type="text" placeholder="date and time"/>
        <span class="add-on"><i data-time-icon="icon-g-clock" data-date-icon="icon-g-calendar"></i></span>
      </div>
    </label>
    <label class="checkbox">
      <input disabled name='add_reminder' type="checkbox"> add a reminder
    </label>
    <label>
      <div class="datetime-picker-input-div input-append date">
        <input disabled name='data_reminder_datetime' data-format="dd/MM/yyyy hh:mm" type="text" placeholder="date and time"/>
        <span class="add-on"><i data-time-icon="icon-g-clock" data-date-icon="icon-g-calendar"></i></span>
      </div>
    </label>

    ${POD.CancelButton('current-document-add-event-cancel-button', True)}
    ${POD.SaveButton('current-document-add-event-save-button', True)}
  </fieldset>
</form>

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

