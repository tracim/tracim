<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>
<%namespace name="DOC" file="pboard.templates.document-widgets"/>

<%def name="AccessManagementTab(poNode)">
  ######
  ##
  ## THIS WIDGET IS INTENDED TO BE USED ONE TIME ONLY IN A PAGE
  ##
  <h4>${_('Share options')}</h4> 
  <p>
    This document is
    % if poNode.is_shared==False:
      <span class="label label-info">
        <i class="fa fa-user"></i>
        ${_('private')}
      </span>
    % else:
      <span class="label label-info">
        <i class="fa fa-group"></i>
        ${_('collaborative')}
      </span>
    % endif
  </p>
  <p>
    % if poNode.is_shared==True or poNode.is_shared==False:
      ${_('People working on it are:')}
######
##
## FIXME - SHOW LIST OF GROUPS ALLOWED TO WORK ON THE DOCUMENT
##
    <table class="table table-striped table-hover table-condensed">
      <thead>
        <tr>
          <th><i class="fa fa-group"></i> ${_('Groups')}</th>
          <th></th>
        </tr>
      </thead>
      <tr>
        <td>Recherche et Développement</td>
        <td>
          <span class="label label-success" title="${_('Read access')}">R</span>
          <span class="label label-warning" title="${_('Write access')}">W</span>
        </td>
      </tr>
      <thead>
        <tr>
          <th><i class="fa fa-user"></i> ${_('Users')}</th>
          <th></th>
        </tr>
      </thead>
      <tr>
        <td>Damien Accorsi</td>
        <td>
          <span class="label label-success">R</span>
        </td>
      </tr>
      <tr>
        <td>Sylvain Ferot</td>
        <td>
          <span class="label label-success">R</span>
          <span class="label label-warning">W</span>
        </td>
      </tr>
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
  <a href="#edit-document-share-properties" role="button" class="btn btn-success" data-toggle="modal">
    <i class="fa fa-edit"></i>
    ${_('Edit share options')}
  </a>
     
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

      <form id='document-share-form' method="GET" action="${tg.url('/api/set_access_management?node_id=%d'%poNode.node_id)}">
        <fieldset>
          <label class="checkbox">
            <input name="is_shared" type="checkbox" id="document-share-selector" ${('', 'checked')[poNode.is_shared]}/>
            ${_('Share document with collaborators.')} <i class="fa fa-group"></i>
          </label>
          <div id="document-share-people-selector">
            <p>
              ${_('Select read and write access for each group or people...')}</p>
            <script>
            function updateRights(psUserId) {
              var ACCESS_NONE = '';
              var ACCESS_READ = 'R';
              var ACCESS_WRITE = 'RW';
              
              var nodeIdForSelectedUser = 'user-'+psUserId+'-value';
              var widget = $('#'+nodeIdForSelectedUser);
              var oldValue = widget.val();
              var newValue = '';
              if(oldValue==ACCESS_NONE) {
                newValue = ACCESS_READ;
                newHtml = '<span class="label label-success">R</span>';
              } else if(oldValue==ACCESS_READ) {
                newValue = ACCESS_WRITE;
                newHtml = '<span class="label label-success">R</span> <span class="label label-warning">W</span>';
              } else if (oldValue==ACCESS_WRITE) {
                newValue = ACCESS_NONE;
                newHtml = '';
              } else {
                newValue = ACCESS_READ;
                newHtml = '<span class="label label-success">R</span>';
              }
              
              widget.val(newValue);
              visibleid = 'user-'+psUserId+'-rights';
              $("#"+visibleid).html(newHtml);
            }
            </script>
            
            <table class="table table-striped table-hover table-condensed">
              <thead>
                <tr>
                  <th></th>
                  <th>${_('Group')}</th>
                  <th>${_('Access')}</th>
                </tr>
              </thead>
    ######
    ##
    ## FIXME - SET A DYNAMIC SELECT LIST HERE
    ##
              % for loCurrentUser in ((3, 'Research and Development'), (4, 'Sylvain Ferot'), (5, 'Damien Accorsi')):
              <tr id='user-${loCurrentUser[0]}-rights-row'>
                <td>
                  <a
                    class="btn btn-mini"
                    onclick="updateRights(${loCurrentUser[0]})"
                  >
                    <i class="fa fa-key"></i>
                  </a>
                </td>
                <td class='pod-highlightable-access-management-cell'>
                  ${loCurrentUser[1]}
                  <input
                    type="hidden"
                    id="user-${loCurrentUser[0]}-value"
                    name="user[${loCurrentUser[0]}]"
                    value=""
                  />
                </td>
                <td id="user-${loCurrentUser[0]}-rights" class="pod-right-cell"></td>
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
        $('#document-share-form')[0].submit();
      });

      // Initial setup
      // Activate or disactivate users selector according
      // to current state of the is_shared property
      //
      // FIXME - 2014-05-06 - This is not working (should be done at document.ready time)
      // note: putting this in a document.ready callback does not work.
      //
      $('#document-share-form')[0].reset();
      toggleDocumentSharePeopleSelector($('#document-share-selector').prop("checked"));
##        toggleDocumentPublicKeyGenerator($('#document-public-selector').prop("checked"));  
##        
##        refreshDocumentPublicKey($('#document-public-key').val()); // First init

    </script>
  </div>
</%def>

<%def name="FilesTabContent(poNode)">
  <h4>${_('Attachments')}</h4> 
% if len(poNode.getFiles())<=0:
  <p class="pod-grey">${_("There is currently no attachment.")}<br/></p>
  <p>${POD.OpenModalButton('create-new-file-modal-form', _(' Attach first file'))}</p>
% else:
  <p>${POD.OpenModalButton('create-new-file-modal-form', _(' Attach a file'))}</p>
% endif

  ${DOC.FileEditModalDialog(poNode.node_id, None, tg.url('/api/create_file'), 'create-new-file-modal-form', 'Add a new file')}


  <!-- LIST OF FILES -->
  <div>
    % if len(poNode.getFiles())>0:
      % for loFile in poNode.getFiles():
        <p style="list-style-type:none; margin-bottom: 0.5em;">
          <i class="fa fa-paperclip"></i>
          <a
            href="${tg.url('/document/%i'%loFile.node_id)}"
            title="${_('View the attachment')}: ${loFile.getTruncatedLabel(-1)}"
          >
            ${loFile.getTruncatedLabel(50)}
          </a>
          <a
            class="pull-right"
            href="${tg.url('/api/get_file_content/%s'%(loFile.node_id))}"
            title="${_('View the attachment')}"
          >
            <i class="fa fa-download"></i>
          </a>
        </p>
      % endfor
    % endif
  </div>
</%def>
