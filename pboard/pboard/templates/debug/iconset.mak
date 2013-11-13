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
      <h1>icon set</h1>
      <h2>Sizes</h2>
      <div>
        normal <i class="fa fa-bullseye"></i>
        fa-2x <i class="fa fa-2x fa-picture-o"></i>
        fa-3x <i class="fa fa-3x fa-picture-o"></i>
        fa-4x <i class="fa fa-4x fa-picture-o"></i>
        fa-5x <i class="fa fa-5x fa-picture-o"></i>
      </div>
      <h2>Orientation</h2>
      <div>
        normal <i class="fa fa-picture-o"></i>
        90° <i class="fa fa-rotate-90 fa-picture-o"></i>
        180° <i class="fa fa-rotate-180 fa-picture-o"></i>
        270° <i class="fa fa-rotate-270 fa-picture-o"></i>
        spin <i class="fa fa-spin fa-picture-o"></i>
      </div>
      <h2>Icons</h2>
      <div id="icon_grid">
        <ul class="inline">
        </ul>
      </div>
    </div>


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

        // var $iconList = matchStyle('.icon-g-');
        var $iconList = matchStyle('.fa-');
        var $completeIconList = new Array();
        for (var key in $iconList) {
          styleExploded = $iconList[key].trim().split(', ')
          for (var subkey in styleExploded) {
            var $currentStyle = styleExploded[subkey];
            console.log("Found style "+$currentStyle)
            $currentStyle.trim()
            $completeIconList.push($currentStyle)
          
          }
        }
        $completeIconList.sort()
        
        var $grid = $('#icon_grid ul');
        for (var key in $completeIconList) {
          var icon = $completeIconList[key];
          icon = icon.replace('.', '').replace(':before', '');
          $grid.append($('<li>').append($('<i>').addClass("fa fa-1x "+icon)).append(" " + icon));
        }
      });</script>

