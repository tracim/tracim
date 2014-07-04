<%def name="IconCssClass(psNodeType)" >
  % if psNodeType=='data':
    fa fa-file-text-o
  % elif  psNodeType=='folder':
    fa fa-folder-open
  % elif  psNodeType=='node':
    fa fa-file-text-o
  % elif  psNodeType=='file':
    fa fa-paperclip
  % elif  psNodeType=='event':
    fa fa-calendar
  % elif  psNodeType=='contact':
    fa fa-user
  % elif  psNodeType=='comment':
    fa fa-comments-o
  % endif
</%def>

<%def name="DocumentTypeLabel(psNodeType)" ><%
  labels = dict()
  labels['data'] = 'document'
  labels['folder'] = 'folder'
  labels['node'] = 'node'
  labels['file'] = 'file'
  labels['event'] = 'event'
  labels['contact'] = 'contact'
  labels['comment'] = 'comment'
  return labels[psNodeType]
%></%def>

<%def name="DocumentUrl(piNodeId, psHighlight)" >${tg.url('/document/%i?highlight=%s'%(piNodeId, psHighlight))}</%def>
<%def name="DocumentUrlWithAnchor(piNodeId, psHighlight, psAnchor)" >${tg.url('/document/%i?highlight=%s#%s'%(piNodeId, psHighlight, psAnchor))}</%def>

<%def name="Button(piId, pbWithLabel, psButtonCssClass, psButtonTitle, psButtonIcon, psButtonLabel)" >
  <button id='${piId}' type="button" class="${psButtonCssClass}" title="${psButtonTitle}"><i class="${psButtonIcon}"></i>${'' if (pbWithLabel==False) else ' %s'%(psButtonLabel)}</button>
</%def>

<%def name="SaveButton(piId, pbWithLabel=False, psLabel='Save')" >
## FIXME - Make the default value use _() in order to be translated
  ${Button(piId, pbWithLabel, 'btn btn-small btn-success', psLabel, ' icon-g-ok-2 icon-g-white', psLabel)}
</%def>
<%def name="EditButton(piId, pbWithLabel=False)" >
  ${Button(piId, pbWithLabel, 'btn btn-small', _('Edit'), 'fa fa-edit', _('Edit'))}
</%def>
<%def name='CancelButton(piId, pbWithLabel=False)'>
  ${Button(piId, pbWithLabel, 'btn btn-small', _('Cancel'), 'icon-g-ban', _('Cancel'))}
</%def>
<%def name='AddButton(piId, pbWithLabel=False, psLabel=None, pbIsCallToAction=True)'>
% if pbIsCallToAction:
  ${Button(piId, pbWithLabel, 'btn btn-small btn-success', psLabel or _('New'), 'fa fa-plus', psLabel or _('New'))}
% else:
  ${Button(piId, pbWithLabel, 'btn btn-small', psLabel or _('New'), 'fa fa-plus', psLabel or _('New'))}
% endif
</%def>

###
##
## GREEN CALL-TO-ACTION BUTTONS IN THE INTERFACE
##
##
<%def name="OpenModalButton(psModalAnchor, psLabel)">
  <a href="#${psModalAnchor}" role="button" class="btn btn-success btn-small" data-toggle="modal"><i class="fa fa-plus"></i> ${psLabel}</a>
</%def>
<%def name="OpenLinkButton(psModalAnchor, psLabel)">
  <a href="#${psModalAnchor}" class="btn btn-success btn-small"><i class="fa fa-plus"></i> ${psLabel}</a>
</%def>
## END OF GREEN CALL-TO-ACTION BUTTONS

<%def name='Badge(psLabel, psCssClass="")'>
  <span class='badge ${psCssClass}'>${psLabel}</span>
</%def>

<%def name='ItemNb(plItemList)'>
  % if len(plItemList)>0:
  <sup class="pod-item-nb-sup-block"> ${len(plItemList)}</sup>
  % endif
</%def>

<%def name='SignUpForm(psCssMinHeight="1em")'>
  <div class="span3 offset4">
    <form class="well" method="POST" style="min-height: ${psCssMinHeight};" action="${tg.url('/public_api/create_account')}">
      <fieldset>
        <legend>${_('Create an account')}</legend>
        <input type="text"     name="real_name"        id="real_name" placeholder="Name"><br/>
        <input type="text"     name="email"            id="email" placeholder="Email"><br/>
        <input type="password" name="password"         id="password" placeholder="Password"><br/>
        <input type="password" name="retyped_password" id="retyped_password" placeholder="Retype your password"><br/>
        <input type="submit"   id="submit" value="Create account" class="btn btn-success" style="width: 95%;"/><br/>
      </fieldset>
    </form>
  </div>
</%def>

<%def name='RichTextEditorToolbar(psRichTextEditorNodeId, psMenuOptions="styles|boldanditalic|lists|justifiers|links|images|undoredo|fullscreen")'>
      <div class="btn-toolbar" data-role="${psRichTextEditorNodeId}-toolbar" data-target="${psRichTextEditorNodeId}">
      % if psMenuOptions.find('styles')>=0:
      
        <div class="btn-group">
          <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
            <i class="fa fa-font"></i>
            <span class="caret"></span>
          </a>
          <ul class="dropdown-menu">
          <!-- dropdown menu links -->
            <li><a data-edit="formatBlock p"   title="Normal paragraph"><p style="margin: 0">text body</p></a></li>
            <li><a data-edit="formatBlock pre" title="Fixed width (code)"><pre style="margin: 0">quote</pre></a></li>
            <li><a data-edit="formatBlock h1"  title="Title - level 1"><h1 style="margin: 0">heading 1</h1></a></li>
            <li><a data-edit="formatBlock h2"  title="Title - level 2"><h2 style="margin: 0">heading 2</h2></a></li>
            <li><a data-edit="formatBlock h3"  title="Title - level 3"><h3 style="margin: 0">heading 3</h3></a></li>
            <li><a data-edit="formatBlock h4"  title="Title - level 4"><h4 style="margin: 0">heading 4</h4></a></li>
            <li><a data-edit="formatBlock h5"  title="Title - level 5"><h5 style="margin: 0">heading 5</h5></a></li>
            <li><a data-edit="formatBlock h6"  title="Title - level 6"><h6 style="margin: 0">heading 6</h6></a></li>
          </ul>
        </div>
      % endif
      % if psMenuOptions.find('boldanditalic')>=0:
        <div class="btn-group">
          <a class="btn" data-edit="bold" title="Bold (Ctrl/Cmd+B)"><i class="fa fa-bold"></i></a>
          <a class="btn" data-edit="italic" title="Italic (Ctrl/Cmd+I)"><i class="fa fa-italic"></i></a>
          <a class="btn" data-edit="strikethrough" title="Strikethrough"><i class="fa fa-strikethrough"></i></a>
          <a class="btn" data-edit="underline" title="Underline (Ctrl/Cmd+U)"><i class="fa fa-underline"></i></a>
        </div>
        <div class="btn-group">
          <a class="btn" data-edit="insertHTML <table class='pod-table-editor'><tr><td>Val1</td><td>Val2</td></tr></table>" ><i class="fa fa-table"></i></a>
        </div>
       % endif
      % if psMenuOptions.find('lists')>=0:
        <div class="btn-group">
          <a class="btn" data-edit="insertunorderedlist" title="Bullet list"><i class="fa fa-list-ul"></i></a>
          <a class="btn" data-edit="insertorderedlist" title="Number list"><i class="fa fa-list-ol"></i></a>
          <a class="btn" data-edit="outdent" title="Reduce indent (Shift+Tab)"><i class="fa fa-outdent"></i></a>
          <a class="btn" data-edit="indent" title="Indent (Tab)"><i class="fa fa-indent"></i></a>
        </div>
      % endif
      % if psMenuOptions.find('justifiers')>=0:
        <div class="btn-group">
          <a class="btn" data-edit="justifyleft" title="Align Left (Ctrl/Cmd+L)"><i class="fa fa-align-left"></i></a>
          <a class="btn" data-edit="justifycenter" title="Center (Ctrl/Cmd+E)"><i class="fa fa-align-center"></i></a>
          <a class="btn" data-edit="justifyright" title="Align Right (Ctrl/Cmd+R)"><i class="fa fa-align-right"></i></a>
          <a class="btn" data-edit="justifyfull" title="Justify (Ctrl/Cmd+J)"><i class="fa fa-align-justify"></i></a>
        </div>
      % endif
#######
##
## LINK MENU ; NOT WORKING FOR NOW (links are auto-generated at render time)
##
##      % if psMenuOptions.find('links')>=0:
##        <div class="btn-group">
##          <a class="btn dropdown-toggle" data-toggle="dropdown" title="Hyperlink"><i class="fa fa-link"></i></a>
##          <div class="dropdown-menu input-append">
##            <input class="span2" placeholder="URL" type="text" data-edit="createLink"/>
##            <button class="btn" type="button">Add</button>
##          </div>
##          <a class="btn" data-edit="unlink" title="Remove Hyperlink"><i class="fa fa-cut"></i></a>
##        </div>
##      % endif
#######
##
## IMAGES MENU ; NOT WORKING FOR NOW
##
##      % if psMenuOptions.find('images')>=0:
##        <div class="btn-group">
##          <a class="btn" title="Insert picture (or just drag & drop)" id="pictureBtn"><i class="fa fa-picture-o"></i></a>
##          <input type="file" data-role="magic-overlay" data-target="#pictureBtn" data-edit="insertImage" />
##        </div>
##      % endif
      % if psMenuOptions.find('undoredo')>=0:
        <div class="btn-group">
          <a class="btn" data-edit="undo" title="Undo (Ctrl/Cmd+Z)"><i class="fa fa-undo"></i></a>
          <a class="btn" data-edit="redo" title="Redo (Ctrl/Cmd+Y)"><i class="fa fa-repeat"></i></a>
        </div>
      % endif
      % if psMenuOptions.find('fullscreen')>=0:
        <div class="btn-group">
          <a class="btn btn-success pod-toggle-full-screen-button"
             title="Toggle fullscreen"
             onclick="toggleFullScreen('#${psRichTextEditorNodeId}-widget', '#${psRichTextEditorNodeId}-widget-inner')"
            >
            ## TODO - D.A. - 2013-11-13 - Use jQuery instead of static JS call
            ## >The previous button "onclick" should be replaced by a jquery dynamic link finding parent node with the right id
            <i class="fa fa-expand"></i>
          </a>
        </div>
      % endif
##
## FIXME - D.A. - 2013-11-15 - FIX THIS
## The voiceBtn button input field is visible in case we add the rich text editor multiple times in the same page
## This is probably due to the use of #voiceBtn id (which should be unique... and which is not)
## This fix will be required for mobile phone compatible user interface
## See bug #13 - https://bitbucket.org/lebouquetin/pod/issue/13/voicebtn-input-widget-shown-in-meta-data
##        <input type="text" data-edit="inserttext" id="voiceBtn" x-webkit-speech="">
      </div>
</%def>

<%def name='RichTextEditor(psRichTextEditorNodeId, psRichTextEditorContent="", psMenuOptions="styles|boldanditalic|lists|justifiers|links|images|undoredo|fullscreen")'>
  <div id="${psRichTextEditorNodeId}-widget" class="rich-text-editor-widget">
    ${RichTextEditorToolbar(psRichTextEditorNodeId, psMenuOptions)}
    <div id="${psRichTextEditorNodeId}-widget-inner" class="rich-text-editor-widget-inner">
      <div id="${psRichTextEditorNodeId}-alert-container"></div>
      <div id="${psRichTextEditorNodeId}" class="pod-rich-text-zone pod-input-like-shadow">
        ${psRichTextEditorContent|n}
      </div>
    </div>

    <script>
    ##########################
    ##
    ## Initializes the rich text editor widget with toolbar
    ##
      $(document).ready(function() {
        initToolbarBootstrapBindings('#${psRichTextEditorNodeId}');
        $('#${psRichTextEditorNodeId}').wysiwyg({
## FIXME - 2013-11-13 - D.A.
## The selector is now based on the id of the toolbar div
## according to the following bug report:
## https://github.com/mindmup/bootstrap-wysiwyg/issues/52
##           // toolbarSelector: '#${psRichTextEditorNodeId} [data-role=editor-toolbar]',
          toolbarSelector: '[data-role=${psRichTextEditorNodeId}-toolbar]',
          fileUploadError: showErrorAlert
        });
        window.prettyPrint && prettyPrint();
      });
    </script>

  </div>

</%def>

<%def name="AddDocumentModalFormId(poNode)">add-document-modal-form-${poNode.node_id if poNode!=None else ''}</%def>
