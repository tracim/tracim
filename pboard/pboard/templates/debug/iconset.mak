<%inherit file="local:templates.master"/>

<%def name="title()">
  debug: icon set
</%def>

    <style>
        body{
            padding-top: 60px;
        }
        #icon_grid li{
            width: 23%;
        }
    </style>

    <div class="container">
      <h1>List of icons</h1>
      <div id="icon_grid">
        <ul class="inline">
        </ul>
      </div>
    </div>


    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script>
      $(document).ready(function() {
        function matchStyle(className) {
          var result = [];
          for (var id = 0; id < document.styleSheets.length; id++) {
            var classes = document.styleSheets[id].rules || document.styleSheets[id].cssRules;
            for (var x = 0; x < classes.length; x++) {
              // $('#icon_grid').append(classes[x].selectorText);
              // $('#icon_grid').append("<p>bob ---</p>");
              var item = classes[x];
              if (classes[x]!=null) {
                if(classes[x].selectorText!=null) {
                  if (-1 < classes[x].selectorText.indexOf(className)) {
                    result.push(classes[x].selectorText);
                  }
                }
              }
            }
          }
          return result;
        }

        var $iconList = matchStyle('.icon-g-');
        var $grid = $('#icon_grid ul');
        for (var key in $iconList) {
          var icon = $iconList[key];
          icon = icon.replace('.', '');
          $grid.append($('<li>').append($('<i>').addClass(icon)).append(" " + icon));
        }
      });</script>

