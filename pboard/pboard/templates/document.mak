<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

<%def name="title()">
pod :: document ${current_node.getTruncatedLabel(40)} [#${current_node.node_id} / ${current_node.getStatus().label}]
</%def>

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

#######
##
## HERE COMES THE BREADCRUMB
##
  <div class="row">
<ul class="breadcrumb span12">
  <li><span class="divider"> / Documents /</span></li>
  % for breadcrumb_node in current_node.getBreadCrumbNodes():
    <li><a href="${tg.url('/document/%s'%(breadcrumb_node.node_id))}">${breadcrumb_node.getTruncatedLabel(30)}</a> <span class="divider">/</span></li>
  % endfor
  <li class="active">${current_node.data_label}</li>
</ul>
  </div>

  <div class="row">
    <div id='application-left-panel' class="span3">
      <div>
        ${node_treeview(root_node_list)}
      </div>
    </div>
    <div id='application-main-panel' class="span9">

      <div class="row">
        <div id='application-document-panel' class="span5">
          <div id='current-document-content' class="">
######
##
## CURRENT DOCUMENT TOOLBAR - START
##
            <div id="current-document-toobar">
              <div class="btn-group">
          % if current_node.parent_id!=None and current_node.parent_id!=0:
                ${POD.EditButton('current-document-content-edit-button', True)}
          % endif
      ##        </div>
      ##        <div class="btn-group">
                <button class="btn btn-small"  data-toggle="dropdown" href="#"> 
                  <i class="fa  fa-signal"></i>
                  ${_("Change status")}
                </button>
                <a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">
                  <span class="caret"></span>
                </a>
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
                  ${node_treeview_for_set_parent_menu(current_node.node_id, root_node_list)}
                </ul>
                <a
                  class="btn btn-small btn-danger"
                  href='${tg.url('/api/edit_status?node_id=%i&node_status=%s'%(current_node.node_id, 'deleted'))}'
                  id='current-document-force-delete-button' onclick="return confirm('${_('Delete current document?')}');"
                  title="${_('Delete')}"
                  ><i class="fa fa-trash-o"></i></a>
              </div>
            </div>
##
## CURRENT DOCUMENT TOOLBAR - END
##
######

######
##
## CURRENT DOCUMENT CONTENT - START
##
            <h3 id="current-document-title">#${current_node.node_id} - ${current_node.data_label}
              <span class="label ${current_node.getStatus().css}" href="#">${current_node.getStatus().label}</a>
            </h3>
            % if len(keywords)>0 and keywords!='':
                ${current_node.getContentWithHighlightedKeywords(keywords.split(), current_node.getContentWithTags())|n}
            % else:
                ${current_node.getContentWithTags()|n}
            % endif
          </div>
          <form style='display: none;' id="current-document-content-edit-form" method='post' action='${tg.url('/api/edit_label_and_content')}'>
            <div>
              ${POD.CancelButton('current-document-content-edit-cancel-button-top', True)}
              ${POD.SaveButton('current-document-content-edit-save-button-top', True)}
            </div>
            <div style="padding: 0.5em 0 0 0">
              <input type='hidden' name='node_id' value='${current_node.node_id}'/>
              <input type="hidden" name='data_content' id="current_node_textarea" />
              <input type='text' name='data_label' value='${current_node.data_label}' class="span4" placeholder="document title" />
            </div>
            <div>
              ${POD.RichTextEditor('current_node_textarea_wysiwyg', current_node.data_content)}
            </div>
            <div class="pull-right">
              ${POD.CancelButton('current-document-content-edit-cancel-button', True)}
              ${POD.SaveButton('current-document-content-edit-save-button', True)}
            </div>
          </form>
        </div>
        ## FIXME - D.A - 2013-11-07 - The following div should be span4 instead of span3 but some bug make it impossible
        <div id='application-metadata-panel' class="span4">
          <div class="tabbable">
            <ul class="nav nav-tabs">
                <li><a href="#subdocuments" data-toggle="tab" title="${_('Subdocuments')}"><i class='pod-dark-grey fa fa-file-text-o'></i>
                
                ${POD.ItemNb(current_node.getChildren())}</a></li>
                
                <li class="active"><a href="#events" data-toggle="tab" title="${_('Calendar')}"><i class="pod-dark-grey fa fa-calendar"></i>${POD.ItemNb(current_node.getEvents())}</a></li>
                <li><a href="#contacts" data-toggle="tab" title="${_('Address book')}"><i class="pod-dark-grey fa fa-user"></i>${POD.ItemNb(current_node.getContacts())}</a></li>
                <li><a href="#comments" data-toggle="tab" title="${_('Comment thread')}"><i class="pod-dark-grey fa fa-comments-o"></i>${POD.ItemNb(current_node.getComments())}</a></li>
                <li><a href="#files" data-toggle="tab" title="${_('Attachments')}"><i class="pod-dark-grey fa  fa-paperclip"></i>${POD.ItemNb(current_node.getFiles())}</a></li>
                
                <li class="pull-right"><a href="#accessmanagement" data-toggle="tab" title="${_('Access Management')}"><i class="pod-dark-grey fa fa-key"></i>${POD.ItemNb(current_node.getFiles())}</a></li>
                 
            </ul>
            <div class="tab-content">
                ################################
                ##
                ## PANEL SHOWING LIST OF SUB DOCUMENTS
                ##
                ################################
                <!-- DEBUG - D.A. - 2013-11-07 - Not using tags for th moment -->
                <div class="tab-pane" id="subdocuments">
                % if len(current_node.getChildren())<=0:
                  <p class="pod-grey">
                    ${_("There is currently no child documents.")}<br/>
                  </p>
                  <p>
                    <a class="btn btn-success btn-small" href="${tg.url('/api/create_document?parent_id=%i'%current_node.node_id)}">
                      <i class="fa fa-plus"></i> ${_("Add one")}
                    </a>
                  </p>
                % else:
                  <p>
                    <a class="btn btn-success btn-small" href="${tg.url('/api/create_document?parent_id=%i'%current_node.node_id)}">
                      <i class="fa fa-plus"></i> ${_("Add new document")}
                    </a>
                  </p>

                  <div>
                    % for subnode in current_node.getChildren():
                      <p style="list-style-type:none;">
                        <i class="fa-fw ${subnode.getIconClass()}"></i>
                          <a href="${tg.url('/document/%i'%subnode.node_id)}">
                            ${subnode.data_label}
                          </a>
                      </p>
                    % endfor
                  </div>
                % endif
                </div>
                
                ################################
                ##
                ## PANEL SHOWING LIST OF EVENTS
                ##
                ################################
                <div class="tab-pane active" id="events">
                % if len(current_node.getEvents())<=0:
                  <p class="pod-grey">${_("The calendar is empty.")}<br/></p>
                  <p>${POD.AddButton('current-document-add-event-button', True, _(' Add first event'))}</p>
                % else:
                  <p>${POD.AddButton('current-document-add-event-button', True, _(' Add an event'))}</p>
                % endif
                
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

                % if len(current_node.getEvents())>0:
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
                % if len(current_node.getContacts())<=0:
                  <p class="pod-grey">${_("The address book is empty.")}<br/></p>
                  <p>${POD.AddButton('current-document-add-contact-button', True, _(' Add first contact'), True)}</p>
                % else:
                  <p>${POD.AddButton('current-document-add-contact-button', True, _(' Add a contact'))}</p>
                % endif

                  <!-- ADD CONTACT FORM -->
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
                % if len(current_node.getComments())<=0:
                  <p class="pod-grey">${_("The comment thread is empty.")}<br/></p>
                  <p>${POD.AddButton('current-document-add-comment-button', True, _('Add first comment'), True)}</p>
                % else:
                  <p>${POD.AddButton('current-document-add-comment-button', True, _('Add a comment'))}</p>
                % endif

                  <!-- ADD COMMENT FORM -->
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
                % if len(current_node.getComments())>0:
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
                % if len(current_node.getFiles())<=0:
                  <p class="pod-grey">${_("There is currently no attachment.")}<br/></p>
                  <p>${POD.AddButton('current-document-add-file-button', True, _(' Attach first file'))}</p>
                % else:
                  <p>${POD.AddButton('current-document-add-file-button', True, _(' Attach a file'))}</p>
                % endif

                  <!-- ADD FILE FORM -->
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
                  <div>
                % if len(current_node.getFiles())>0:
                    % for current_file in current_node.getFiles():
                      <p style="list-style-type:none; margin-bottom: 0.5em;">
                        <i class="fa fa-paperclip"></i>
                        <a
                          href="${tg.url('/document/%i'%current_file.node_id)}"
                          title="${_('View the attachment')}: ${current_file.data_label}"
                        >
                          ${current_file.getTruncatedLabel(50)}
                        </a>
                        <a
                          class="pull-right"
                          href="${tg.url('/api/get_file_content/%s'%(current_file.node_id))}"
                          title="${_('View the attachment')}"
                        >
                          <i class="fa fa-download"></i>
                        </a>
                      </p>
                    % endfor
                % endif
                  </div>
                </div>
                
                
                ################################
                ##
                ## PANEL SHOWING ACCESS MANAGEMENT
                ##
                ################################
                <div class="tab-pane" id="accessmanagement">
                  blabla
                </div>
                
                
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

