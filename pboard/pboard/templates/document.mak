<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

<%def name="title()">
pod :: document ${current_node.getTruncatedLabel(40)} [#${current_node.node_id} / ${current_node.getStatus().label}]
</%def>

<%def name="node_treeview_for_set_parent_menu(node_id, node_list, indentation=-1)">
  % if indentation==-1:
    <li><a href="${tg.url('/api/set_parent_node?node_id=%i&new_parent_id=0'%(current_node.node_id))}">${_('Home')}</a>
      ${node_treeview_for_set_parent_menu(node_id, node_list, 0)}
    </li>
  % else:
    % if len(node_list)>0:
      <ul>
      % for new_parent_node in node_list:
        <li>
          <a href="${tg.url('/api/set_parent_node?node_id=%i&new_parent_id=%i'%(node_id, new_parent_node.node_id))}">${new_parent_node.getTruncatedLabel(40-indentation*2)}</a>
          ${node_treeview_for_set_parent_menu(node_id, new_parent_node.getStaticChildList(), indentation+1)}
        </li>
      % endfor
      </ul>
    % endif
  % endif
</%def>

<%def name="node_treeview(node_list, indentation=-1)">
  % if indentation==-1:
    <div id='pod-menu-item-0' class="pod-toolbar-parent" style="padding-left: 0.5em; position: relative;">
      <a class="toggle-child-menu-items"><i class='fa fa-folder-open'></i></a>
      <a href="?node=0" title="${_('Root')}">
        ${_('Root')}
      </a>
      <div class="pod-toolbar">
        <a href="${tg.url('/api/create_document?parent_id=0')}" title="${_('Add child document')}"><i class="fa fa-plus-circle"></i></a>
      </div>
    </div>
    <div id="pod-menu-item-0-children">${node_treeview(node_list, 0)}</div>
    
  % else:
    % if len(node_list)>0:
      % for node in node_list:
        <div id='pod-menu-item-${node.node_id}' class="pod-toolbar-parent ${'pod-status-active' if node.node_id==current_node.node_id else ''}" style="padding-left: ${(indentation+2)*0.5}em; position: relative;">
          <a class="toggle-child-menu-items"><i class='${node.getIconClass()}'></i></a>
          <a href="${tg.url('/document/%s'%(node.node_id))}" title="${node.data_label}">
            % if node.getStatus().status_family=='closed' or node.getStatus().status_family=='invisible':
              <strike>
            % endif
                ${node.getTruncatedLabel(32-0.8*(indentation+1))}
            % if node.getStatus().status_family=='closed' or node.getStatus().status_family=='invisible':
              </strike>
            % endif
          </a>
          <div class="pod-toolbar">
            <a href="${tg.url('/api/move_node_upper?node_id=%i'%(node.node_id))}" title="${_('Move up')}"><i class="fa fa-arrow-up"></i></a>
            <a href="${tg.url('/api/move_node_lower?node_id=%i'%(node.node_id))}" title="${_('Move down')}"><i class="fa fa-arrow-down"></i></a>
            <a href="${tg.url('/api/create_document?parent_id=%i'%(node.node_id))}" title="${_('Add child document')}"><i class="fa  fa-plus-circle"></i></a>
          </div>
          <div class="pod-status ${node.getStatus().css}" title='${node.getStatus().label}'>
             <i class='${node.getStatus().icon}'></i>
          </div>
        </div>
        <div id="pod-menu-item-${node.node_id}-children">${node_treeview(node.getStaticChildList(), indentation+1)}</div>
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

  <div class="row">
    <div id='application-left-panel' class="span3">
      <div>
        ${node_treeview(root_node_list)}
      </div>
    </div>
    <div id='application-main-panel' class="span9">
    % if current_node.parent_id!=None and current_node.parent_id!=0:
      <div class="btn-group">
        <a class="btn " href="${tg.url('/document/%i'%current_node.parent_id)}" title="${_("Go to parent document")}"><i class="fa fa-hand-o-left"></i></a>
      </div>
    % endif
      <div class="btn-group">
        <button class="btn"  data-toggle="dropdown" href="#">${_("Change status")}</button>
        <a class="btn dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>
        <ul class="dropdown-menu">
        % for node_status in node_status_list:
          % if node_status.status_id==current_node.getStatus().status_id:
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
        ${POD.EditButton('current-document-content-edit-button', True)}
        <a class="btn" href="#" data-toggle="dropdown"><i class="icon-g-move"></i> ${_('Move to')} <span class="caret"></span></a>
        <ul class="dropdown-menu">
          ${node_treeview_for_set_parent_menu(current_node.node_id, root_node_list)}
        </ul>

        <a href='${tg.url('/api/edit_status?node_id=%i&node_status=%s'%(current_node.node_id, 'deleted'))}' id='current-document-force-delete-button' class="btn" onclick="return confirm('${_('Delete current document?')}');"><i class="fa fa-trash-o"></i> ${_('Delete')}</a>
        
      </div>

      <div class="row">
        <div id='application-document-panel' class="span5">
          <p>
            <div id='current-document-content' class="">
              <h3 id="current-document-title">#${current_node.node_id} - ${current_node.data_label}
                <span class="label ${current_node.getStatus().css}" href="#">${current_node.getStatus().label}</a>
              
              </h3>
              ${current_node.getContentWithTags()|n}
            </div>
            <form style='display: none;' id="current-document-content-edit-form" method='post' action='${tg.url('/api/edit_label_and_content')}'>
              <input type='hidden' name='node_id' value='${current_node.node_id}'/>
              <input type="hidden" name='data_content' id="current_node_textarea" />
              <input type='text' name='data_label' value='${current_node.data_label}' class="span4" placeholder="document title" />
              ${POD.RichTextEditor('current_node_textarea_wysiwyg', current_node.data_content)}
              ${POD.CancelButton('current-document-content-edit-cancel-button', True)}
              ${POD.SaveButton('current-document-content-edit-save-button', True)}


            </form>
          </p>
        </div>
        ## FIXME - D.A - 2013-11-07 - The following div should be span4 instead of span3 but some bug make it impossible
        <div id='application-metadata-panel' class="span4">
          <div class="tabbable">
            <ul class="nav nav-tabs">
                ## FIXME - D.A. - 2013-11-07 - TO REMOVE OR TO REACTIVATE  <li class="active"><a href="#tags" data-toggle="tab" title="${_('Tags')}"><i class='icon-g-tags'></i></a></li>
                <li class="active"><a href="#events" data-toggle="tab" title="History"><i class="pod-dark-grey fa fa-calendar"></i>${POD.ItemNb(current_node.getEvents())}</a></li>
                <li><a href="#contacts" data-toggle="tab" title="Contacts"><i class="pod-dark-grey fa fa-user"></i>${POD.ItemNb(current_node.getContacts())}</a></li>
                <li><a href="#comments" data-toggle="tab" title="Comments"><i class="pod-dark-grey fa fa-comments-o"></i>${POD.ItemNb(current_node.getComments())}</a></li>
                <li><a href="#files" data-toggle="tab" title="Files"><i class="pod-dark-grey fa  fa-file-text-o"></i>${POD.ItemNb(current_node.getFiles())}</a></li>
            </ul>
            <div class="tab-content">
                ################################
                ##
                ## PANEL SHOWING LIST OF TAGS
                ##
                ################################
                <!-- DEBUG - D.A. - 2013-11-07 - Not using tags for th moment
                <div class="tab-pane" id="tags">
                  <div class="well">
                    <p>
                      <i>
                        ${_('Tags are automatically extracted from document content:')}
                        <ul>
                          <li>${_('<code>@visible_keyword</code> is a visible keyword generating a tag.')|n}</li>
                          <li>
                            ${_('<code>@invisible_keyword</code> is an <u>invisible</u> keyword generating a tag.')|n}</li>
                        </ul>
                      </i>
                    </p>
                    % for tag in current_node.getTagList():
                      ${POD.Badge(tag)}
                    % endfor
                  </div>
                </div>
                -->
                ################################
                ##
                ## PANEL SHOWING LIST OF EVENTS
                ##
                ################################
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
                      <label>
                        <div>
                          <input type="hidden" id="add_event_data_content_textarea" name='data_content' />
                          ${POD.RichTextEditor('add_event_data_content_textarea_wysiwyg', '', 'boldanditalic|undoredo|fullscreen')}
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

                % if len(current_node.getEvents())<=0:
                  <p><i>${_('No history for the moment.')}</i></p>
                % else:
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
                      <tr class="item-with-data-popoverable" data-content="${event.data_content}" rel="popover" data-placement="left" data-trigger="hover">
                        <td>${event.getFormattedDate(event.data_datetime)}</td>
                        <td>${event.getFormattedTime(event.data_datetime)}</td>
                        <td>${event.data_label}</td>
                      </tr>
  ## FIXME                    <script>
  ##                      $('.item-with-data-popoverable').popover({ html: true});
  ##                    </script>

                    % endfor
                  </table>
                % endif
                </div>
                ##############################
                ## 
                ## PANEL SHOWING LIST OF CONTACTS
                ##
                ##############################
                <div class="tab-pane" id="contacts">
                
                  <!-- ADD CONTACT FORM -->
                  ${POD.AddButton('current-document-add-contact-button', True, _(' Add contact'))}
                  <form style='display: none;' id='current-document-add-contact-form' action='${tg.url('/api/create_contact')}' method='post' class="well">
                    <input type="hidden" name='parent_id' value='${current_node.node_id}'/>
                    <fieldset>
                      <legend>${_('Add a contact')}</legend>
                      <label>
                        <input type="text" name='data_label' placeholder="Title"/>
                      </label>
                      <label>
                        <div>
                          <input type="hidden" id="add_contact_data_content_textarea" name='data_content' />
                          ${POD.RichTextEditor('add_contact_data_content_textarea_wysiwyg', '', 'boldanditalic|undoredo|fullscreen')}
                        </div>
                      </label>
                      ${POD.CancelButton('current-document-add-contact-cancel-button', True)}
                      ${POD.SaveButton('current-document-add-contact-save-button', True)}
                    </fieldset>
                  </form>

                  <!-- LIST OF CONTACT NODES -->
                  % for contact in current_node.getContacts():
                    <div class="well">
                      <legend class="text-info">
                        ${contact.data_label}
                        ## TODO - 2013-11-20 - Use the right form in order to update meta-data
                        <a class="pull-right" href="${tg.url('/document/%i'%contact.node_id)}"><i class="fa fa-edit"></i></a>
                      </legend>
                      
                      <div>
                        ## FIXME - D.A. - 2013-11-15 - Implement localisation stuff <a style='float: right;' href="" title='${_('Search on google maps')}'><i class='icon-g-google-maps'></i></a>
                        ${contact.data_content|n}
                      </div>
                    </div>
                  % endfor


                </div>
                ################################
                ##
                ## PANEL SHOWING LIST OF COMMENTS
                ##
                ################################
                <div class="tab-pane" id="comments">
                  <!-- ADD COMMENT FORM -->
                  ${POD.AddButton('current-document-add-comment-button', True, _(' Add comment'))}
                  <form style='display: none;' id='current-document-add-comment-form' action='${tg.url('/api/create_comment')}' method='post' class="well">
                    <input type="hidden" name='parent_id' value='${current_node.node_id}'/>
                    <fieldset>
                      <legend>${_('Add a comment')}</legend>
                      <label>
                        <input type="text" name='data_label' placeholder="Title"/>
                      </label>
                      <label>
                        <div>
                          <input type="hidden" id="add_comment_data_content_textarea" name='data_content' />
                          ${POD.RichTextEditor('add_comment_data_content_textarea_wysiwyg', '', 'boldanditalic|undoredo|fullscreen')}
                        </div>
                      </label>
                      ${POD.CancelButton('current-document-add-comment-cancel-button', True)}
                      ${POD.SaveButton('current-document-add-comment-save-button', True)}
                    </fieldset>
                  </form>

                  <!-- LIST OF COMMENTS -->
                % if len(current_node.getComments())<=0:
                  <p><i>${_('No comments.')}</i></p>
                % else:
                  <table class="table table-striped table-hover table-condensed">
                    % for comment in current_node.getComments():
                      <tr title="Last updated: ${comment.updated_at}">
                        <td>
                          <i>The ${comment.getFormattedDate(comment.updated_at)} at ${comment.getFormattedTime(comment.updated_at)}: </i><br/>
                          <b>${comment.data_label}</b>
                          ## TODO - 2013-11-20 - Use the right form in order to update meta-data
                          <a class="pull-right" href="${tg.url('/document/%i'%comment.node_id)}"><i class="fa fa-edit"></i></a>
                          <br/>
                          <p>
                            ${comment.data_content|n}
                          </p>
                        </td>
                      </tr>
                    % endfor
                  </table>
                % endif
                </div>
                ################################
                ##
                ## PANEL SHOWING LIST OF FILES
                ##
                ################################
                <div class="tab-pane" id="files">
                  <!-- ADD FILE FORM -->
                  ${POD.AddButton('current-document-add-file-button', True, _(' Add file'))}
                  <form style='display: none;' id='current-document-add-file-form' enctype="multipart/form-data" action='${tg.url('/api/create_file')}' method='post' class="well">
                    <input type="hidden" name='parent_id' value='${current_node.node_id}'/>
                    <fieldset>
                      <legend>${_('Add a file')}</legend>
                      <label>
                        <input type="text" name='data_label' placeholder="Title"/>
                      </label>
                      <label>
                        <input type="file" name='data_file' placeholder="choose a file..."/>
                      </label>
                      <label>
                        <div>
                          <input type="hidden" id="add_file_data_content_textarea" name='data_content' />
                          ${POD.RichTextEditor('add_file_data_content_textarea_wysiwyg', '', 'boldanditalic|undoredo|fullscreen')}
                        </div>
                      </label>
                      ${POD.CancelButton('current-document-add-file-cancel-button', True)}
                      ${POD.SaveButton('current-document-add-file-save-button', True)}
                    </fieldset>
                  </form>

                  <!-- LIST OF FILES -->
                % if len(current_node.getFiles())<=0:
                  <p><i>${_('No files.')}</i></p>
                % else:
                  <table class="table table-striped table-hover table-condensed">
                    % for current_file in current_node.getFiles():
                      <tr title="Last updated: ${current_file.updated_at}">
                        <td>
                          <a href="${tg.url('/api/get_file_content/%s'%(current_file.node_id))}" title="${_("Download file")}">
                            <i class="fa fa-2x fa-file-text-o"></i>
                          </a>
                          ## FIXME - SHOW THUMBNAIL WHEN IT WILL BE OK<img src="${tg.url('/api/get_file_content_thumbnail/%s'%(current_file.node_id))}" class="img-polaroid">
                        </td>
                        <td>
                          <b>${current_file.data_label}</b>
                          <a class="pull-right" href="${tg.url('/api/get_file_content/%s'%(current_file.node_id))}" title="${_("Download file")}">
                            <i class="fa fa-download"></i>
                          </a>
                          <a class="pull-right" href="${tg.url('/document/%i'%current_file.node_id)}" title="${_("Edit title or comment")}"><i class="fa fa-edit"></i></a>

                          <br/>
                          <p>
                            ${current_file.data_content|n}
                          </p>
                        </td>
                      </tr>
                    % endfor
                  </table>
                % endif
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

