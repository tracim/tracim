<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pod.templates.pod"/>

<%def name="HistoryTabContent(poNode)">
  <h4>${_('Revisions')}</h4>
  <ul>
  % for version in poNode.getHistory():
  	<li><a href="${tg.url('/document/%i/%i#tab-history'%(version.node_id, version.version_id))}">${version.created_at.strftime("%a %x %X")}</a></li>
  % endfor
  </ul>
</%def>

<%def name="AccessManagementTab(poNode, user_rights, user)">
    ######
    ##
    ## THIS WIDGET IS INTENDED TO BE USED ONE TIME ONLY IN A PAGE
    ##
    <h4>${_('Share options')}</h4> 
    <p>
      % if poNode.is_shared==False:
        <span class="pod-grey">${_('This document is not shared')}</span>
      % else:
        <span class="">${_('This document is shared.')}</span>
      % endif
    </p>
    <p>
      % if poNode.is_shared==True:
      <table class="table table-striped table-hover table-condensed">
        <thead>
          <tr>
            <th><i class="fa fa-group"></i> ${_('Groups')}</th>
            <th></th>
          </tr>
        </thead>
        % for loGroupRightsOnNode in real_group_rights:
            % if loGroupRightsOnNode.hasSomeAccess():
                <tr>
                    <td>${loGroupRightsOnNode.display_name}</td>
                    <td>
                        % if loGroupRightsOnNode.hasReadAccess():
                            <span class="label label-success">R</span>
                        % endif
                        % if loGroupRightsOnNode.hasWriteAccess():
                            <span class="label label-warning">W</span>
                        % endif
                    </td>
                </tr>
            % endif
        % endfor
        <thead>
            <tr>
                <th><i class="fa fa-user"></i> ${_('Individual users')}</th>
                <th></th>
            </tr>
        </thead>
        % for loGroupRightsOnNode in user_specific_group_rights:
            % if loGroupRightsOnNode.hasSomeAccess():
                <tr>
                    <td>${loGroupRightsOnNode.display_name}</td>
                    <td>
                        % if loGroupRightsOnNode.hasReadAccess():
                            <span class="label label-success">R</span>
                        % endif
                        % if loGroupRightsOnNode.hasWriteAccess():
                            <span class="label label-warning">W</span>
                        % endif
                    </td>
                </tr>
            % endif
        % endfor
      </table>
      
      % endif
    <p>

    ######
    ##
    ## 2014-05-06 - D.A. We do not share documents on internet yet.
    ##
    ##  <p>
    ##    % if poNode.is_public==False:
    ##      ${_('This document is not shared on internet')|n}
    ##    % else:
    ##      ${_('This document is <span class="label label-warning"><i class="fa fa-globe"></i><span>shared</span></span> on internet')|n}.
    ##      ${_('The associated url is:')} <a href="FIXME">${poNode.public_url_key}</a>
    ##    % endif
    ##  </p>
      <!-- Button to trigger modal -->
    % if user.user_id==poNode.owner_id or (user_rights and user_rights.hasWriteAccess()):
      <a href="#edit-document-share-properties" role="button" class="btn btn-success" data-toggle="modal">
        <i class="fa fa-edit"></i>
        ${_('Edit share options')}
      </a>
    % endif

    <!-- Modal -->
    <div
      id="edit-document-share-properties"
      class="modal hide"
      tabindex="-1"
      role="dialog"
      aria-labelledby="myModalLabel"
      aria-hidden="true">
      
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">Document sharing options</h3>
      </div>
      <div class="modal-body">

        <form id='document-share-form' method="GET" action="${tg.url('/api/set_access_management')}">
          <input type="hidden" name="node_id" value="${poNode.node_id}" />
          <input type="hidden" name="read" value="0" />
          <input type="hidden" name="write" value="0" />
          <fieldset>
            <label class="checkbox">
              <input name="is_shared" type="checkbox" id="document-share-selector" ${('', 'checked')[poNode.is_shared]}/>
              ${_('Share document with collaborators.')}
            </label>
            <div id="document-share-people-selector">
              <p>${_('Select read and write access for each group or people...')}</p>
              <script>
              function updateRights(psUserId, piNewValue) {
                if (typeof piNewValue === 'undefined') { piNewValue = -1; }
                var ACCESS_UNDEFINED = -1;
                var ACCESS_NONE = 0;
                var ACCESS_READ = 1;
                var ACCESS_WRITE = 2;
                
                var nodeIdForSelectedUser = 'user-'+psUserId+'-value';
                var widgetRead = $('#'+nodeIdForSelectedUser+'-read');
                var widgetWrite = $('#'+nodeIdForSelectedUser+'-write');
                var oldReadValue = widgetRead.val()
                var oldWriteValue = widgetWrite.val();
                
                if(oldReadValue=='' && oldWriteValue=='' && piNewValue==ACCESS_UNDEFINED || piNewValue==ACCESS_READ) {
  ## SET READ ACCESS
                  widgetRead.val(psUserId)
                  widgetWrite.val('')
                  newHtml = '<span class="label label-success" title="${'Allow to read the item'}">R</span>';
                } else if(oldReadValue==psUserId && oldWriteValue=='' && piNewValue==ACCESS_UNDEFINED || piNewValue==ACCESS_READ+ACCESS_WRITE) {
  ## SET READ + WRITE ACCESS
                  widgetRead.val(psUserId)
                  widgetWrite.val(psUserId)
                  newHtml = '<span class="label label-success" title="${'Allow to read the item'}">R</span> <span class="label label-warning" title="${'Allow to modify the item'}">W</span>';
                } else if (oldReadValue==psUserId && oldWriteValue==psUserId && piNewValue==ACCESS_UNDEFINED || piNewValue==ACCESS_NONE) {
  ## SET NO ACCESS
                  widgetRead.val('')
                  widgetWrite.val('')
                  newHtml = '';
                } else {
  ## SET READ ACCESS (default)
                  widgetRead.val(psUserId)
                  widgetWrite.val('')
                  newHtml = '<span class="label label-success" title="${'Allow to read the item'}">R</span>';
                }
                
                visibleid = 'user-'+psUserId+'-rights';
                $("#"+visibleid).html(newHtml);
              }
              </script>
              
              <table class="table table-striped table-hover table-condensed">
      ######
      ##
      ## REAL GROUPS LISTING HERE
      ##
                <thead>
                  <tr>
                    <th><i class="fa fa-group"></i></th>
                    <th>${_('Group')}</th>
                    <th>${_('Access')}</th>
                  </tr>
                </thead>
                % for loGroupRightsOnNode in real_group_rights:

                <tr id='user-${loGroupRightsOnNode.group_id}-rights-row'>
                  <td>
                    <a
                      class="btn btn-mini"
                      onclick="updateRights(${loGroupRightsOnNode.group_id})"
                    >
                      <i class="fa fa-key"></i>
                    </a>
                  </td>
                  <td class='pod-highlightable-access-management-cell'>
                    ${loGroupRightsOnNode.display_name}
                    <input type="hidden" id="user-${loGroupRightsOnNode.group_id}-value-read" name="read" value="" />
                    <input type="hidden" id="user-${loGroupRightsOnNode.group_id}-value-write" name="write" value="" />
                  </td>
                  <td id="user-${loGroupRightsOnNode.group_id}-rights" class="pod-right-cell"></td>
                </tr>
                % endfor
                
      ######
      ##
      ## INDIVIDUAL USERS LISTING HERE
      ##
                <thead>
                  <tr>
                    <th><i class="fa fa-user"></i></th>
                    <th>${_('Individual Users')}</th>
                    <th>${_('Access')}</th>
                  </tr>
                </thead>
                % for loGroupRightsOnNode in user_specific_group_rights:
                
                <tr id='user-${loGroupRightsOnNode.group_id}-rights-row'>
                  <td>
                    <a
                      class="btn btn-mini"
                      onclick="updateRights(${loGroupRightsOnNode.group_id})"
                    >
                      <i class="fa fa-key"></i>
                    </a>
                  </td>
                  <td class='pod-highlightable-access-management-cell'>
                    ${loGroupRightsOnNode.display_name}
                    <input type="hidden" id="user-${loGroupRightsOnNode.group_id}-value-read" name="read" value="" />
                    <input type="hidden" id="user-${loGroupRightsOnNode.group_id}-value-write" name="write" value="" />
                  </td>
                  <td id="user-${loGroupRightsOnNode.group_id}-rights" class="pod-right-cell"></td>
                </tr>
                % endfor
              </table>
            </div>
          </fieldset>
  ######
  ##
  ## 2014-05-06 - D.A. The documents are not yet sharable through internet
  ##
  ##        <fieldset>
  ##          <label class="checkbox">
  ##            <input name="is_public" type="checkbox" id="document-public-selector" ${('', 'checked')[poNode.is_public]}/>
  ##            ${_('Internet shared document')}
  ##            <i class="fa fa-globe"></i>
  ##          </label>
  ##          <label id="document-public-key-selector">
  ##            ${_('Key')}
  ##            <div class="input-append">
  ##              <input name="url_public_key" id="document-public-key" type="text">
  ##              <span id="document-public-key-refresh-button" class="add-on btn" title="${_('Regenerate key')}">
  ##                <i class="fa fa-refresh"></i>
  ##              </span>
  ##            </div>
  ##            <p><a id='document-public-key-url' href="">http://share.pod.com/document/azefnzeioguneriugnreiugnre</a></p>
  ##          </label>

          </fieldset>
  ####
  ## Button replaced by modal dialog button
  ##        <button type="submit" class="btn btn-success">
  ##          <i class="fa fa-check"></i>
  ##          ${_('Save')}
  ##        </button>
        </form>
      </div>
      <div class="modal-footer">
      <button class="btn" data-dismiss="modal" aria-hidden="true">
        <i class="fa fa-ban"></i> ${_('Cancel')}
      </button>
      <button class="btn btn-success" id="document-share-form-submit-button">
        <i class="fa fa-check"></i> ${_('Save changes')}
      </button>
      </div>
      <script>
  ##
  ## 2014-05-06 - D.A. - Documents are not yet sharable through internet
  ##
  ##        function refreshDocumentPublicKey(psNewPublicKey) {
  ##          var lsNewUrl = 'http://share.pod.com/document/'+psNewPublicKey;
  ##          $('#document-public-key').val(psNewPublicKey);
  ##          $('#document-public-key-url').attr('href', lsNewUrl);
  ##          $('#document-public-key-url').text(lsNewUrl);
  ##        }
        
        function toggleDocumentSharePeopleSelector(pbShowIt) {
          if (pbShowIt) {
            $('#document-share-people-selector').show();
            // $('#document-share-people-selector input').removeAttr("disabled");
          } else {
            $('#document-share-people-selector').hide();
            // $('#document-share-people-selector input').prop('disabled', 'disabled');
          }
        }

  ##
  ## 2014-05-06 - D.A. - Documents are not yet sharable through internet
  ##
  ##        function toggleDocumentPublicKeyGenerator(pbShowIt) {
  ##          if (pbShowIt) {
  ##            $('#document-public-key-selector input').removeAttr("disabled");
  ##            $('#document-public-key-refresh-button').removeProp('disabled');
  ##            $('#document-public-key-refresh-button').removeClass('btn-disabled');
  ##            $('#document-public-key-selector a').show();
  ##            $('#document-public-key-refresh-button').on("click").click(function () {
  ##              refreshDocumentPublicKey(generateStringId()); // New random 32-char id
  ##            });
  ##            if($('#document-public-key-selector input').val()=='') {
  ##              refreshDocumentPublicKey(generateStringId());
  ##            }
  ##          } else {
  ##            $('#document-public-key-refresh-button').prop('disabled', true);
  ##            $('#document-public-key-refresh-button').addClass('btn-disabled');
  ##            $('#document-public-key-selector input').prop('disabled', 'disabled');
  ##            $('#document-public-key-refresh-button').off("click");
  ##            $('#document-public-key-selector a').hide();
  ##          }
  ##        }
  ##
  ##
  ##

        // Callbacks setup
        $('#document-share-selector').change(function () {
          var checkedValue = $('#document-share-selector').prop("checked");
          toggleDocumentSharePeopleSelector(checkedValue);
        });

  ##        $('#document-public-selector').change(function () {
  ##          var checkedValue = $('#document-public-selector').prop("checked");
  ##          toggleDocumentPublicKeyGenerator(checkedValue);
  ##        });

        // Submit access-management modal dialog form
        $('#document-share-form-submit-button').click(function(){
          $("input[name='read'][value='']").remove();
          $("input[name='write'][value='']").remove();
          $('#document-share-form')[0].submit();
        });

        // Initial setup
        // Activate or disactivate users selector according
        // to current state of the is_shared property
        //
        // FIXME - 2014-05-06 - This is not working (should be done at document.ready time)
        // note: putting this in a document.ready callback does not work.
        //
  ##
  ## The following code is something like dirty ;)
  ## the goal of this piece of code is to setup view
  ## according to hidden input values
  ## for read/write access management
  ##

  ## FIXME      % for loGroupRightsOnNode in real_group_rights:
  ##      % for loCurrentGroup in real_group_rights + user_specific_group_rights:
        % for loGroupRightsOnNode in real_group_rights + user_specific_group_rights:
          % if loGroupRightsOnNode.hasSomeAccess()==False:
            updateRights(${loGroupRightsOnNode.group_id}, 0);
          % else:
  ##
  ## The following line should build some javascript code similar to this:
  ## updateRights(-5, 3);
            updateRights(${loGroupRightsOnNode.group_id}, ${loGroupRightsOnNode.rights});
          % endif
        % endfor

        toggleDocumentSharePeopleSelector($('#document-share-selector').prop("checked"));
  ##        toggleDocumentPublicKeyGenerator($('#document-public-selector').prop("checked"));  
  ##        
  ##        refreshDocumentPublicKey($('#document-public-key').val()); // First init

      </script>
    </div>
</%def>

<%def name="FileTabContent(poNode)">
  <h4>${_('Attachments')}</h4>
  
  % if len(poNode.getFiles())<=0:
    <p class="pod-grey">${_("There is currently no attachment.")}<br/></p>
    <p>${POD.OpenModalButton(h.ID.AddFileModalForm(poNode), _(' Attach first file'))}</p>
  % else:
    <p>${POD.OpenModalButton(h.ID.AddFileModalForm(poNode), _(' Attach a file'))}</p>
  % endif

  <div>
    % if len(poNode.getFiles())>0:
      % for loFile in poNode.getFiles():
        <p style="list-style-type:none; margin-bottom: 0.5em;">
          <i class="fa fa-paperclip"></i>
          <a
            href="${tg.url('/api/get_file_content/%s'%(loFile.node_id))}"
            title="${_('Download the file')}"
          >
            ${loFile.getTruncatedLabel(50)}
          </a>
          ## FIXME SHOW IMAGE THUMBNAIL <img src="${tg.url('/api/get_file_content_thumbnail/%i'%loFile.node_id)}"/>
          <a
            class="pull-right"
            href="${tg.url('/document/%i'%loFile.node_id)}"
            title="${_('View the attachment')}: ${loFile.getTruncatedLabel(-1)}"
          >
            <i class="fa fa-edit"></i>
          </a>
        </p>
      % endfor
    % endif
  </div>
</%def>

<%def name="SubdocumentContent(poNode)">
  <h4>${_('Sub-documents')}</h4>
  
  % if len(poNode.getChildren())<=0:
    <p class="pod-grey">${_("There is currently no child documents.")}</p>
  % endif
  <p>${POD.OpenModalButton(h.ID.AddDocumentModalForm(poNode), _('Add a document'))}</p>

  % if len(poNode.getChildren())>0:
    <div>
      % for subnode in poNode.getChildren():
        <p style="list-style-type:none;">
          <i class="fa-fw ${subnode.getIconClass()}"></i>
            <a href="${tg.url('/document/%i'%subnode.node_id)}">
            ${subnode.data_label}
            <span class="label ${subnode.getStatus().css} pull-right" title="${subnode.getStatus().label}">
              <i class="${subnode.getStatus().icon}"></i>
            </a>
        </p>
      % endfor
    </div>
  % endif
</%def>

<%def name="EventTabContent(current_user, poNode)">
  <h4>${_('Calendar')}</h4>
  
  % if len(poNode.getEvents())<=0:
    <p class="pod-grey">${_("The calendar is empty.")}<br/></p>
    <p>${POD.OpenModalButton(h.ID.AddEventModalForm(poNode), _(' Add first event'))}</p>
  % else:
    <p>${POD.OpenModalButton(h.ID.AddEventModalForm(poNode), _(' Add an event'))}</p>
  % endif

  % if len(poNode.getEvents())>0:
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
      % for event in poNode.getEvents():
        % if event.is_shared or event.owner_id==current_user.user_id:
##
## TODO - D.A. - Sharing groups are not checked here : a shared event is share with everybody
##
          <tr class="item-with-data-popoverable" data-content="${event.data_content}" rel="popover" data-placement="left" data-trigger="hover">
            <td>${event.getFormattedDate(event.data_datetime)}</td>
            <td>${event.getFormattedTime(event.data_datetime)}</td>
            <td>${event.data_label}</td>
          </tr>
        % endif
      % endfor
    </table>
  % endif
</%def>

<%def name="ContactTabContent(poNode)">
  <h4>${_('Address book')}</h4> 
  % if len(poNode.getContacts())<=0:
    <p class="pod-grey">${_("The address book is empty.")}<br/></p>
    <p>${POD.OpenModalButton(h.ID.AddContactModalForm(poNode), _('Add first contact'))}</p>
  % else:
    <p>${POD.OpenModalButton(h.ID.AddContactModalForm(poNode), _('Add a contact'))}</p>
  % endif

  <!-- LIST OF CONTACT NODES -->
  % for contact in poNode.getContacts():
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
</%def>

<%def name="CommentTabContent(current_user, poNode)">
  <h4>${_('Comment thread')}</h4>
  
  % if len(poNode.getComments())<=0:
    <p class="pod-grey">${_("The comment thread is empty.")}<br/></p>
  % endif

  % if len(poNode.getComments())>0:
    % if len(poNode.getComments())>5:
      ##
      ## We show a "direct down" button in case the page is too long
      ##
      <p>${POD.OpenLinkButton(h.ID.AddCommentInlineForm(), _('Add a comment'))}</p>
    % endif
    <div>
      % for comment in poNode.getComments():
         % if comment.is_shared or comment.owner_id==current_user.user_id:
##
## FIXME - 2014-05-29
## We do not check specific rights on comment but on document instead
## In the future full-API architecture, it should be fixed
##
          <p style="margin-bottom: 1em;">
            <i class="fa fa-comments-o"></i>
            <strong class="pod-grey">${comment._oOwner.display_name}</strong>

            <i class="pull-right">
              <span class="pod-grey">${_('the')}</span>
              ${comment.getFormattedDate(comment.updated_at)} 
              <span class="pod-grey">${_('at')}</span>
              ${comment.getFormattedTime(comment.updated_at)}
            </i>
            <br/>

            % if comment.owner_id==current_user.user_id:
              <a class="pull-right" href="${tg.url('/api/toggle_share_status', dict(node_id=comment.node_id))}">
                % if comment.is_shared:
                  <span class="label label-warning" title="${_('Shared comment. Click to make private.')}">${h.ICON.Shared|n}</span>
                % else:
                  <span class="label label-info" title="${_('Private comment. Click to share.')}">${h.ICON.Private|n}</span>
                % endif
              </a>
            % endif

            ${comment.data_content|n}
          </p>
        % endif
      % endfor
    </div>
  % endif

  <hr style="border-top: 1px dotted #ccc; margin: 0;"/>
  <form class="form" id="${h.ID.AddCommentInlineForm()}" action="${tg.url('/api/create_comment')}" method="POST">
    <input type="hidden" name='parent_id' value='${poNode.node_id}'/>
    <input type="hidden" name='data_label' value=""/>
    <input type="hidden" id="add_comment_data_content_textarea" name='data_content' />
    <label>
      ${_('Write your comment below:')}
      ${POD.RichTextEditor('add_comment_data_content_textarea_wysiwyg', '', 'boldanditalic')}
    </label>
    <label>
      <input type="checkbox" name='is_shared' checked /> ${_('Share this comment')}
    </label>
    <span class="pull-right">
      % if len(poNode.getComments())<=0:
        ${POD.SaveButton('current-document-add-comment-save-button', True, _('Add first comment'))}
      % else:
        ${POD.SaveButton('current-document-add-comment-save-button', True, _('Comment'))}
      % endif
    </span>
  </form>
  <script>
      $('#current-document-add-comment-save-button').on('click', function(e){
      e.preventDefault(); // We don't want this to act as a link so cancel the link action
      $('#add_comment_data_content_textarea_wysiwyg').cleanHtml();
      $('#add_comment_data_content_textarea').val($('#add_comment_data_content_textarea_wysiwyg').html());
      $('#current-document-add-comment-form').submit();
    });
  </script>
</%def>
