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

<%def name="node_treeview(node_list, indentation=-1)">
  % if indentation==-1:
    <div id='pod-menu-item-0' class="pod-toolbar-parent" style="padding-left: 0.5em; position: relative;">
      <a class="toggle-child-menu-items"><i class='fa fa-folder-open'></i></a>
      <a href="${tg.url('/document')}" title="${_('Root')}">
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
        <div id='pod-menu-item-${node.node_id}' class="pod-toolbar-parent ${'pod-status-active' if current_node!=None and node.node_id==current_node.node_id else ''}" style="padding-left: ${(indentation+2)*0.5}em; position: relative;">
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
    ${DOC.BreadCrumb(current_node)}
  </div>

  <div class="row">
    <div id='application-left-panel' class="span3">
      <div>
        ${node_treeview(root_node_list)}
      </div>
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
            ${DOC.Toolbar(current_node, node_status_list, root_node_list, 'current-document-toobar')}
            ${DOC.ShowTitle(current_node, keywords, 'current-document-title')}
            ${DOC.ShowContent(current_node, keywords)}
          </div>
          ${DOC.EditForm(current_node)}
        </div>
        <div id='application-metadata-panel' class="span4">
          <div class="tabbable">
            <ul class="nav nav-tabs" style="margin-bottom: 0em;">
                <li>${DOC.MetadataTab('#subdocuments', 'tab', _('Subdocuments'), 'fa-file-text-o', current_node.getChildren())}</li>
                <li class="active">${DOC.MetadataTab('#events', 'tab', _('Calendar'), 'fa-calendar', current_node.getEvents())}</li>
                <li>${DOC.MetadataTab('#contacts', 'tab', _('Address book'), 'fa-user', current_node.getContacts())}</li>
                <li>${DOC.MetadataTab('#comments', 'tab', _('Comment thread'), 'fa-comments-o', current_node.getComments())}</li>
                <li>${DOC.MetadataTab('#files', 'tab', _('Attachments'), 'fa-paperclip', current_node.getFiles())}</li>
                <li class="pull-right">${DOC.MetadataTab('#accessmanagement', 'tab', _('Access Management'), 'fa-key', [])}</li>
            </ul>
            <div class="tab-content">
                ################################
                ##
                ## PANEL SHOWING LIST OF SUB DOCUMENTS
                ##
                ################################
                <!-- DEBUG - D.A. - 2013-11-07 - Not using tags for th moment -->
                <div class="tab-pane" id="subdocuments">
                  <h4>${_('Sub-documents')}</h4>
                  ${DOC.DocumentEditModalDialog(current_node.node_id, None, tg.url('/api/create_document'), 'add-subdocument-modal-%i'%current_node.node_id, _('New Sub-document'))}
                  
                % if len(current_node.getChildren())<=0:
                  <p class="pod-grey">
                    ${_("There is currently no child documents.")}<br/>
                  </p>
                  <p>
                    <a href="#add-subdocument-modal-${current_node.node_id}" role="button" class="btn btn-success btn-small" data-toggle="modal">
                      <i class="fa fa-plus"></i>
                      ${_("Add one")}
                    </a>
                  </p>
                % else:
                  <p>
                    <a href="#add-subdocument-modal-${current_node.node_id}" role="button" class="btn btn-success btn-small" data-toggle="modal">
                      <i class="fa fa-plus"></i> ${_("Add one")}
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
                  <h4>${_('Calendar')}</h4> 
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
                  <h4>${_('Address book')}</h4> 
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
                <div class="tab-pane" id="comments" style="margin: 0;">
                  <h4>${_('Comment thread')}</h4>
                % if len(current_node.getComments())<=0:
                  <p class="pod-grey">${_("The comment thread is empty.")}<br/></p>
                % endif
                  <!-- LIST OF COMMENTS -->
                % if len(current_node.getComments())>0:
                  <div>
                    % for comment in current_node.getComments():
                      <p>
                        <a href="${tg.url('/api/toggle_share_status', dict(node_id=comment.node_id))}">
                          % if comment.is_shared:
                            <span class="label label-warning" title="${_('Shared comment. Click to make private.')}"><i class="fa fa-group"></i></span>
                          % else:
                            <span class="label label-info" title="${_('Private comment. Click to share.')}"><i class="fa fa-key"></i></span>
                          % endif
                        </a>
                        <strong>${comment._oOwner.display_name}</strong>
                        <i class="pull-right">
                          The ${comment.getFormattedDate(comment.updated_at)} 
                          at ${comment.getFormattedTime(comment.updated_at)}
                        </i>
                        <br/>
                        ${comment.data_content|n}
                        <hr style="border-top: 1px dotted #ccc; margin: 0;"/>
                      </p>
                    % endfor
                  </div>
                % endif

                  <!-- ADD COMMENT FORM -->
                  <form class="form" id='current-document-add-comment-form' action='${tg.url('/api/create_comment')}' method='post'>
                    <input type="hidden" name='parent_id' value='${current_node.node_id}'/>
                    <input type="hidden" name='data_label' value=""/>
                    <input type="hidden" id="add_comment_data_content_textarea" name='data_content' />
                    ${POD.RichTextEditor('add_comment_data_content_textarea_wysiwyg', '', '')}
                    <label>
                      <input type="checkbox" name='is_shared'/> ${_('Share this comment')}
                    </label>
                    <span class="pull-right">
                      % if len(current_node.getComments())<=0:
                        ${POD.SaveButton('current-document-add-comment-save-button', True, _('Add first comment'))}
                      % else:
                        ${POD.SaveButton('current-document-add-comment-save-button', True, _('Comment'))}
                      % endif
                    </span>
                  </form>

                </div>
                ################################
                ##
                ## PANEL SHOWING LIST OF FILES
                ##
                ################################
                <div class="tab-pane" id="files">
                  ${DOCTABS.FilesTabContent(current_node)}
                </div>

                <div class="tab-pane" id="files">
                  <h4>${_('Attachments')}</h4> 
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
                  ${DOCTABS.AccessManagementTab(current_node)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      % endif
    </div>
  </div>
</div>
