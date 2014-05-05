  function toggleFullScreen(outerWidgetId, innerWidgetId) {
    if($(outerWidgetId).hasClass('full-size-overlay')) {
      // Toggle from fullscreen to "normal"
      $(outerWidgetId).removeClass('full-size-overlay');
      $(innerWidgetId).removeClass('full-size-overlay-inner');
      $('.pod-toggle-full-screen-button > i').removeClass('fa-compress')
      $('.pod-toggle-full-screen-button > i').addClass('fa-expand')
    } else {
      // Toggle from normal to fullscreen
      $(outerWidgetId).addClass('full-size-overlay');
      $(innerWidgetId).addClass('full-size-overlay-inner');
      $('.pod-toggle-full-screen-button > i').removeClass('fa-expand')
      $('.pod-toggle-full-screen-button > i').addClass('fa-compress')
    }
  }

  function initToolbarBootstrapBindings(richTextEditorId) {
    // $('a[title]').tooltip({container:'body'});
    $(richTextEditorId+' > .dropdown-menu input').click(function() {return false;})
      .change(function () {$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');})
      .keydown('esc', function () {this.value='';$(this).change();});

    $('[data-role=magic-overlay]').each(function () { 
      var overlay = $(this), target = $(overlay.data('target')); 
      overlay.css('opacity', 0).css('position', 'absolute').offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
    });
    if ("onwebkitspeechchange" in document.createElement("input")) {
      var editorOffset = $(richTextEditorId).offset();
      $('#voiceBtn').css('position','absolute').offset({top: editorOffset.top, left: editorOffset.left+$(richTextEditorId).innerWidth()-35});
    } else {
      $('#voiceBtn').hide();
    }
  };
  function showErrorAlert (reason, detail) {
    var msg='';
    if (reason==='unsupported-file-type') { msg = "Unsupported format " +detail; }
    else {
      console.log("error uploading file", reason, detail);
    }
    $('<div class="alert"> <button type="button" class="close" data-dismiss="alert">&times;</button>'+ 
     '<strong>File upload error</strong> '+msg+' </div>').prependTo('#alerts');
  };

  $(document).ready(function() {

    $('#create_document_save_button').on('click', function(e){
      // We don't want this to act as a link so cancel the link action
      e.preventDefault();

      // Find form and submit it
      $('#create_document_form').submit();
    });

// ## FIXME                $('#current_node_textarea').wysihtml5({
// ## FIXME                  "font-styles": true, //Font styling, e.g. h1, h2, etc. Default true
// ## FIXME                  "emphasis": true, //Italics, bold, etc. Default true
// ## FIXME                  "lists": true, //(Un)ordered lists, e.g. Bullets, Numbers. Default true
// ## FIXME                  "html": true, //Button which allows you to edit the generated HTML. Default false
// ## FIXME                  "link": true, //Button to insert a link. Default true
// ## FIXME                  "image": true, //Button to insert an image. Default true,
// ## FIXME                  // "color": true //Button to change color of font  
// ## FIXME                });
// ## FIXME                $('#current_node_textarea').css('margin-bottom', '0');
// ## FIXME                $('#current_node_textarea').css("min-height", "12em");
// ## FIXME                $('#current_node_textarea').addClass("span5");

// ###################
// ##
// ## HERE
// ##
// ###################

// ##
// ## RE-IMPLEMENT THIS SOON !!!
// ##
// ##                /* Edit title form */
// ##                $("#current-document-title-edit-form" ).css("display", "none");
// ##                $("#current-document-title" ).dblclick(function() {
// ##                  $("#current-document-title" ).css("display", "none");
// ##                  $("#current-document-title-edit-form" ).css("display", "block");
// ##                });
// ##                $("#current-document-title-edit-cancel-button" ).click(function() {
// ##                  $("#current-document-title" ).css("display", "block");
// ##                  $("#current-document-title-edit-form" ).css("display", "none");
// ##                });
// ##                $('#current-document-title-save-cancel-button').on('click', function(e){
// ##                  // We don't want this to act as a link so cancel the link action
// ##                  e.preventDefault();
// ##                  $('#current-document-title-edit-form').submit();
// ##                });


    /* EDIT CONTENT FORM */
    $("#current-document-content-edit-form" ).css("display", "none");
    $("#current-document-content-edit-button" ).click(function() {
      $("#current-document-content" ).css("display", "none");
      $("#current-document-content-edit-form" ).css("display", "block");
      $("#current-document-toobar").css("display", "none");
    });
    $("#current-document-content" ).dblclick(function() {
      $("#current-document-content" ).css("display", "none");
      $("#current-document-content-edit-form" ).css("display", "block");
    });
    $("#current-document-content-edit-cancel-button, #current-document-content-edit-cancel-button-top" ).click(function() {
      $("#current-document-content" ).css("display", "block");
      $("#current-document-content-edit-form" ).css("display", "none");
      $("#current-document-toobar").css("display", "block");
    });
    $('#current-document-content-edit-save-button, #current-document-content-edit-save-button-top').on('click', function(e){
      // We don't want this to act as a link so cancel the link action
      e.preventDefault();
      $('#current_node_textarea_wysiwyg').cleanHtml();
      $('#current_node_textarea').val($('#current_node_textarea_wysiwyg').html());
      $('#current-document-content-edit-form').submit();
    });

    /* ADD EVENT => FORM */
    $('#add_event_data_content_textarea').wysiwyg();
    $('#add_event_data_content_textarea').css('margin-bottom', '0');
    $('#add_event_data_content_textarea').css("height", "4em");
    $('#add_event_data_content_textarea').addClass("span3");
    /* ADD EVENT => SHOW/HIDE/SUBMIT BUTTONS */
    $("#current-document-add-event-button" ).click(function() {
      $("#current-document-add-event-form" ).css("display", "block");
      $("#current-document-add-event-button" ).css("display", "none");
    });
    $('#current-document-add-event-cancel-button').on('click', function(e){
      $("#current-document-add-event-form" ).css("display", "none");
      $("#current-document-add-event-button" ).css("display", "block");
    });
    $('#current-document-add-event-save-button').on('click', function(e){
      e.preventDefault(); // We don't want this to act as a link so cancel the link action
      $('#add_event_data_content_textarea_wysiwyg').cleanHtml();
      $('#add_event_data_content_textarea').val($('#add_event_data_content_textarea_wysiwyg').html());
      $('#current-document-add-event-form').submit();
    });

    /* ADD CONTACT => FORM */
    $('#add_contact_data_content_textarea').wysiwyg();
    $('#add_contact_data_content_textarea').css('margin-bottom', '0');
    $('#add_contact_data_content_textarea').css("height", "4em");
    $('#add_contact_data_content_textarea').addClass("span3");
    /* ADD CONTACT => SHOW/HIDE/SUBMIT BUTTONS */
    $("#current-document-add-contact-button" ).click(function() {
      $("#current-document-add-contact-form" ).css("display", "block");
      $("#current-document-add-contact-button" ).css("display", "none");
    });
    $('#current-document-add-contact-cancel-button').on('click', function(e){
      $("#current-document-add-contact-form" ).css("display", "none");
      $("#current-document-add-contact-button" ).css("display", "block");
    });
    $('#current-document-add-contact-save-button').on('click', function(e){
      e.preventDefault(); // We don't want this to act as a link so cancel the link action
      $('#add_contact_data_content_textarea_wysiwyg').cleanHtml();
      $('#add_contact_data_content_textarea').val($('#add_contact_data_content_textarea_wysiwyg').html());
      $('#current-document-add-contact-form').submit();
    });


    /* ADD COMMENT => FORM */
    $('#add_comment_data_content_textarea').wysiwyg();
    $('#add_comment_data_content_textarea').css('margin-bottom', '0');
    $('#add_comment_data_content_textarea').css("height", "4em");
    $('#add_comment_data_content_textarea').addClass("span3");
    /* ADD COMMENT => SHOW/HIDE/SUBMIT BUTTONS */
    $("#current-document-add-comment-button" ).click(function() {
      $("#current-document-add-comment-form" ).css("display", "block");
      $("#current-document-add-comment-button" ).css("display", "none");
    });
    $('#current-document-add-comment-cancel-button').on('click', function(e){
      $("#current-document-add-comment-form" ).css("display", "none");
      $("#current-document-add-comment-button" ).css("display", "block");
    });
    $('#current-document-add-comment-save-button').on('click', function(e){
      e.preventDefault(); // We don't want this to act as a link so cancel the link action
      $('#add_comment_data_content_textarea_wysiwyg').cleanHtml();
      $('#add_comment_data_content_textarea').val($('#add_comment_data_content_textarea_wysiwyg').html());
      $('#current-document-add-comment-form').submit();
    });

    /* ADD FILE => FORM */
    $('#add_file_data_content_textarea').wysiwyg();
    $('#add_file_data_content_textarea').css('margin-bottom', '0');
    $('#add_file_data_content_textarea').css("height", "4em");
    $('#add_file_data_content_textarea').addClass("span3");
    /* ADD FILE => SHOW/HIDE/SUBMIT BUTTONS */
    $("#current-document-add-file-button" ).click(function() {
      $("#current-document-add-file-form" ).css("display", "block");
      $("#current-document-add-file-button" ).css("display", "none");
    });
    $('#current-document-add-file-cancel-button').on('click', function(e){
      $("#current-document-add-file-form" ).css("display", "none");
      $("#current-document-add-file-button" ).css("display", "block");
    });
    $('#current-document-add-file-save-button').on('click', function(e){
      e.preventDefault(); // We don't want this to act as a link so cancel the link action
      $('#add_file_data_content_textarea_wysiwyg').cleanHtml();
      $('#add_file_data_content_textarea').val($('#add_file_data_content_textarea_wysiwyg').html());
      $('#current-document-add-file-form').submit();
    });

    $(function() {
      $('.datetime-picker-input-div').datetimepicker({
        language: 'fr-FR',
        pickSeconds: false
      });
    });

/*
    // Allow to go directly to required tab on load
    // Javascript to enable link to tab
    var url = document.location.toString();
    if (url.match('#')) {
      $('.nav-tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
    } 

    // Change hash for page-reload
    $('.nav-tabs a').on('shown', function (e) {
      window.location.hash = e.target.hash;
    })
*/
    // #################################
    // ##
    // ## The following JS code allow t
    // ##
    // ##
    // Javascript to enable link to tab
    var hash = document.location.hash;
    var prefix = "tab-";
    if (hash) {
        $('.nav-tabs a[href='+hash.replace(prefix,"")+']').tab('show');
    } 

    // Change hash for page-reload
    $('.nav-tabs a').on('shown', function (e) {
        window.location.hash = e.target.hash.replace("#", "#" + prefix);
    });

  
    // #################################
    // ##
    // ## Show/hide behavior
    // ## for the main menu
    // ##
    // ##
    $('a.toggle-child-menu-items').on('click', function (e) {
      parent_id    = $(this).parent().attr('id');
      child        = $('#'+parent_id+'-children');
      togglebutton = $(this).children('i:first')
      if(child.css('display')=='none'){
        child.css("display", "block");
        togglebutton.removeClass('icon-g-folder-plus');
        togglebutton.attr('class', 'icon-g-folder-open');
        console.log("class is: "+togglebutton.attr('class'));
      } else {
        child.css("display", "none");
        togglebutton.removeClass('icon-g-folder-open');
        togglebutton.addClass('icon-g-folder-plus');
        console.log("class is: "+togglebutton.attr('class'));
      }
    });

    // #################################
    // ##
    // ## large / small view of the document
    // ## (toggle visibility of the left panel)
    // ##
    // ##
    $('a#view-size-toggle-button-small').on('click', function (e) {
      console.log("Toggle view mode");
      $('#view-size-toggle-button-small').css('display', 'none');
      $('#view-size-toggle-button-medium').css('display', 'block');
      $('#view-size-toggle-button-large').css('display', 'none');
  
      left_panel_id     = '#application-left-panel'; // is span3 by default (to be hidden in fullscreen mode)
      main_panel_id     = '#application-main-panel'; // is span9 by default (to be 12 in fullscreen mode)
      docu_panel_id     = '#application-document-panel'; // is span5 by default (to be span8 in fullscreen mode)
      metadata_panel_id = '#application-metadata-panel';
      
      left_panel = $(left_panel_id);
      main_panel = $(main_panel_id);
      docu_panel = $(docu_panel_id);
      metadata_panel = $(metadata_panel_id);

      console.log("Toggle from small (default) to medium (no left tab)");
      left_panel.css('display', 'block');
      metadata_panel.css('display', 'block');
      main_panel.removeClass('span9');
      main_panel.removeClass('span12');
      main_panel.addClass('span9');
      
      docu_panel.removeClass('span5');
      docu_panel.removeClass('span8');
      docu_panel.removeClass('span12');
      docu_panel.addClass('span5');
    });

    $('a#view-size-toggle-button-medium').on('click', function (e) {
      console.log("Toggle view mode to: MEDIUM");
      $('#view-size-toggle-button-small').css('display', 'none');
      $('#view-size-toggle-button-medium').css('display', 'none');
      $('#view-size-toggle-button-large').css('display', 'block');

      left_panel_id     = '#application-left-panel'; // is span3 by default (to be hidden in fullscreen mode)
      main_panel_id     = '#application-main-panel'; // is span9 by default (to be 12 in fullscreen mode)
      docu_panel_id     = '#application-document-panel'; // is span5 by default (to be span8 in fullscreen mode)
      metadata_panel_id = '#application-metadata-panel';
      
      left_panel = $(left_panel_id);
      main_panel = $(main_panel_id);
      docu_panel = $(docu_panel_id);
      metadata_panel = $(metadata_panel_id);

      left_panel.css('display', 'none');
      metadata_panel.css('display', 'block');
      
      main_panel.removeClass('span9');
      main_panel.addClass('span12');
      
      docu_panel.removeClass('span5');
      docu_panel.removeClass('span12');
      docu_panel.addClass('span8');

    });

    $('a#view-size-toggle-button-large').on('click', function (e) {
      console.log("Toggle view mode to: LARGE");
      $('#view-size-toggle-button-small').css('display', 'block');
      $('#view-size-toggle-button-medium').css('display', 'none');
      $('#view-size-toggle-button-large').css('display', 'none');

      left_panel_id     = '#application-left-panel'; // is span3 by default (to be hidden in fullscreen mode)
      main_panel_id     = '#application-main-panel'; // is span9 by default (to be 12 in fullscreen mode)
      docu_panel_id     = '#application-document-panel'; // is span5 by default (to be span8 in fullscreen mode)
      metadata_panel_id = '#application-metadata-panel';
      
      left_panel = $(left_panel_id);
      main_panel = $(main_panel_id);
      docu_panel = $(docu_panel_id);
      metadata_panel = $(metadata_panel_id);

      left_panel.css('display', 'none');
      metadata_panel.css('display', 'none');
      
      main_panel.removeClass('span9');
      main_panel.addClass('span12');
      
      docu_panel.removeClass('span5');
      docu_panel.removeClass('span8');
      docu_panel.addClass('span12');

    });

    // ALLOW TO SHOW POPOVER WITH SPECIFIC DATA
    $('.item-with-data-popoverable').popover({ html: true});

    /** Make calculator available on all pages */
    $('#keyboard span').on('click', function (e) {
      current_value = $(this).text()
      if(current_value=='C') {
        $('#calculation').val('');
        $('#result').val('');
      } else if(current_value=='=') {
        string = $('#calculation').val().replace(/[^0-9+-/\*\%\(\)]/gi, ''); // replace('/[^0-9()*/-+]/g', "");
        console.log("Compute value of "+string)
        calculation = eval(string);
        console.log("Result is: "+calculation)
        $('#result').val(calculation)
      } else {
        field = $('#calculation')
        field.oldval = field.val();
        field.val(field.oldval+current_value)
      }
    });
  });

