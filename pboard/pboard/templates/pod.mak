<%def name="Button(piId, pbWithLabel, psButtonCssClass, psButtonTitle, psButtonIcon, psButtonLabel)" >
  <button id='${piId}' type="button" class="${psButtonCssClass}" title="${psButtonTitle}"><i class="${psButtonIcon}"></i>${u'' if (pbWithLabel==False) else u' %s'%(psButtonLabel)}</button>
</%def>

<%def name="SaveButton(piId, pbWithLabel=False)" >
  ${Button(piId, pbWithLabel, 'btn btn-success', _('Save'), ' icon-g-ok-2 icon-g-white', _('Save'))}
</%def>
<%def name="EditButton(piId, pbWithLabel=False)" >
  ${Button(piId, pbWithLabel, 'btn', _('Edit'), 'icon-g-edit', _('Edit'))}
</%def>
<%def name='CancelButton(piId, pbWithLabel=False)'>
  ${Button(piId, pbWithLabel, 'btn ', _('Cancel'), 'icon-g-ban', _('Cancel'))}
</%def>
<%def name='AddButton(piId, pbWithLabel=False, psLabel=None)'>
  ${Button(piId, pbWithLabel, 'btn', psLabel or _('New'), 'icon-g-circle-plus', psLabel or _('New'))}
</%def>
<%def name='Badge(psLabel, psCssClass="")'>
  <span class='badge ${psCssClass}'>${psLabel}</span>
</%def>

<%def name='ItemNb(plItemList)'>
  % if len(plItemList)>0:
  <sup class="pod-item-nb-sup-block"> ${len(plItemList)}</sup>
  % endif
</%def>

<%def name='RichTextEditorToolbar(psRichTextEditorNodeId, psMenuOptions="styles|boldanditalic|lists|justifiers|links|images|undoredo|fullscreen")'>
      <div class="btn-toolbar" data-role="${psRichTextEditorNodeId}-toolbar" data-target="${psRichTextEditorNodeId}">
      % if psMenuOptions.find('styles')>=0:
        <div class="btn-group">
          <a class="btn" data-edit="formatBlock p"   title="Normal paragraph">§</h1></a></li>
          <a class="btn" data-edit="formatBlock pre" title="Fixed width (code)">C</h1></a>
          <a class="btn" data-edit="formatBlock h1"  title="Title - level 1">h1</a>
          <a class="btn" data-edit="formatBlock h2"  title="Title - level 2">h2</a>
          <a class="btn" data-edit="formatBlock h3"  title="Title - level 3">h3</a>
          <a class="btn" data-edit="formatBlock h4"  title="Title - level 4">h4</a>
          <a class="btn" data-edit="formatBlock h5"  title="Title - level 5">h5</a>
          <a class="btn" data-edit="formatBlock h6"  title="Title - level 6">h6</a>
        </div>
      % endif
      % if psMenuOptions.find('boldanditalic')>=0:
        <div class="btn-group">
          <a class="btn" data-edit="bold" title="Bold (Ctrl/Cmd+B)"><i class="fa fa-bold"></i></a>
          <a class="btn" data-edit="italic" title="Italic (Ctrl/Cmd+I)"><i class="fa fa-italic"></i></a>
          <a class="btn" data-edit="strikethrough" title="Strikethrough"><i class="fa fa-strikethrough"></i></a>
          <a class="btn" data-edit="underline" title="Underline (Ctrl/Cmd+U)"><i class="fa fa-underline"></i></a>
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
      % if psMenuOptions.find('links')>=0:
        <div class="btn-group">
          <a class="btn dropdown-toggle" data-toggle="dropdown" title="Hyperlink"><i class="fa fa-link"></i></a>
          <div class="dropdown-menu input-append">
            <input class="span2" placeholder="URL" type="text" data-edit="createLink"/>
            <button class="btn" type="button">Add</button>
          </div>
          <a class="btn" data-edit="unlink" title="Remove Hyperlink"><i class="fa fa-cut"></i></a>
        </div>
      % endif
      % if psMenuOptions.find('images')>=0:
        <div class="btn-group">
          <a class="btn" title="Insert picture (or just drag & drop)" id="pictureBtn"><i class="fa fa-picture-o"></i></a>
          <input type="file" data-role="magic-overlay" data-target="#pictureBtn" data-edit="insertImage" />
        </div>
      % endif
      % if psMenuOptions.find('undoredo')>=0:
        <div class="btn-group">
          <a class="btn" data-edit="undo" title="Undo (Ctrl/Cmd+Z)"><i class="fa fa-undo"></i></a>
          <a class="btn" data-edit="redo" title="Redo (Ctrl/Cmd+Y)"><i class="fa fa-repeat"></i></a>
        </div>
      % endif
      % if psMenuOptions.find('fullscreen')>=0:
        <div class="btn-group">
          <a class="btn btn-primary pod-toggle-full-screen-button"
             title="Toggle fullscreen"
             onclick="toggleFullScreen('#${psRichTextEditorNodeId}-widget', '#${psRichTextEditorNodeId}-widget-inner')"
            >
            ## TODO - D.A. - 2013-11-13 - Use jQuery instead of static JS call
            ## >The previous button "onclick" should be replaced by a jquery dynamic link finding parent node with the right id
            <i class="fa fa-expand"></i>
          </a>
        </div>
      % endif
        <input type="text" data-edit="inserttext" id="voiceBtn" x-webkit-speech="">
      </div>
</%def>

<%def name='RichTextEditor(psRichTextEditorNodeId, psRichTextEditorContent="", psMenuOptions="styles|boldanditalic|lists|justifiers|links|images|undoredo|fullscreen")'>
  <div id="${psRichTextEditorNodeId}-widget" class="rich-text-editor-widget">
    <div id="${psRichTextEditorNodeId}-widget-inner" class="rich-text-editor-widget-inner">
      <div id="${psRichTextEditorNodeId}-alert-container"></div>
      ${RichTextEditorToolbar(psRichTextEditorNodeId, psMenuOptions)}
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

