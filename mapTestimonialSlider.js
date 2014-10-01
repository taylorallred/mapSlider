/***************************************************************************
  mapTestimonialSlider.js
  There are three parts to this script:

  1. SVG Map - initializeSVG()
    1.1 Load US Map
    1.2 Add Map to DOM
    1.3 Attach Event Listeners
      1.3.1 Click - fires mapClick event
      1.3.2 Hover - fires mapHover event8
  2. Messages Box - 
    2.1 Load Data from JSON
    2.2 Enable updates of DOM elements - Img, text, name, city, state
    2.3
  3. Slide Functionality
    3.1 Cycle map & Message
    3.2 Update buttons

'_varName' means the variable is defined in the 'Developer variables' section and can be adjusted to fit any svg/message combo

***************************************************************************/


jQuery(function($){
/***************************************************************************
  // Developer variables
***************************************************************************/
  //1.1 Load SVG & set size
    var _paths = usa.paths, // SVG paths
        _mapId = 'map', // CSS ID 'map'
        _mapW  = 500,   // Map width in pixels
        _mapH  = 350,   // Map Height in pixels
        _svgX = 250, //use y value to position svg within _mapH & _mapW
        _svgY = -50, //use y value to position svg within _mapH & _mapW
        _zoom = 2, // use + values to zoom in and make svg bigger; use - values to zoom out and make svg smaller;
  //1.2 Configure styling
        _pathFillColor     = '#fff',
        _pathFillOpacity   = '0',
        _pathStrokeColor   = '#fff',
        _pathStrokeOpacity = '1',
        _pathStrikeWidth   = 1,
  //1.3 Configure slider
        _slideInterval = 4, // seconds
        _enableClick = false, // enable/disable click on map and slider.
        _imgPath = '//assets.cdn.aws.vivint.com/global/vivint.com/sections/renewal/', // used like: _imgPath + 'imageName.png';
        _enableSliderTimer = true; // turn timer off. i.e. click only or display only one path/message
  //1.4 Configure Messages
    var _messagesList = testimonialsList, // message
        _commonKey = 'state-abbreviation'; //used to match svg path objects to message
  //1.5 Other Variables needed - Don't touch these, generally.
    var pathElements = [], // this is an array of path elements that have been added to the paper in addPathsToPaper();
        $slideCircles = $('.slide-circles'),
        $circles; //   = $('.slide-circles .circle') - defined in initializeSliderTimer after circles are created.
/***************************************************************************
  // 0. Start
***************************************************************************/  

if (_paths) initializeSVG();

if (_messagesList) initializeCircles();

if (_enableSliderTimer) {
  $(document).ready(initializeSliderTimer);
  //$(window).on(_initialSliderOn, initializeSliderTimer);
}
/***************************************************************************
  // 1. SVG Map - 
***************************************************************************/
    function initializeSVG () {    
      var paper = Raphael(_mapId, _mapW, _mapH);
      var attr = { fill               : _pathFillColor,
                    'fill-opacity'     : _pathFillOpacity,
                    stroke             : _pathStrokeColor,
                    'stroke-opacity'   : _pathStrokeOpacity,
                    'stroke-width'     : _pathStrikeWidth,
                    'stroke-linejoin'  : 'round'
                  };
      var width = _zoom * _mapW,
          height = _zoom * _mapH;
      paper.setViewBox(_svgX, _svgY, width, height, true);
      //papaer.canvas.setAttribute('preserveAspectRatio', 'none');
      paper.safari(); // fixes rendering bug in safari

      addPathsToPaper(_paths, paper, attr);
    }


    function addPathsToPaper(paths, paper, attr) {
      var attr  = attr || {};

      for (var i in paths) {
        var obj = paths[i], // get the object
             el = paper.path(obj.path); // Add all paths to Paper
        
        pathElements.push(el); // Add all elements to an array to use later
        
        el.data(obj); // add the object itself as data
        
        if (obj.hasOwnProperty('id')) el.node.id = obj.id; // add obj.id as html/css #id
        
        el.attr(attr); // add styling to elements

        if (_enableClick) {
          el.click(onSVGClick);
        }
        // el.hover();
        // el.unHover();
      }
    }   

    function onSVGClick (){
      var message = getMessageFromSVG(_messagesList, this, _commonKey);
      
      if (message) {
        updateMap.apply(this);
        updateMessages.apply(message);

        var circle = getCircleFromMessage($circles, message, _commonKey);
        if (circle) {
          updateCircle.apply(circle);
          initializeSliderTimer();
        }
      }
    }

    function updateMap () {
      // BUG FIX HACK - to ensure the hover state is removed
      $(pathElements).each(function(){
        onUnHover.apply(this);
      });

      this.animate({
          'fill-opacity': '1'
      }, 300);
    }

    function onUnHover () {
      this.animate({
          'fill-opacity': '0'
      }, 100);
    }

/***************************************************************************
  // 2. message Box - 
***************************************************************************/

    function updateMessages () {  // this = the object clicked which will have data attributes
      var    img = $('.message-box img'),
           quote = $('.message-box h5'),
            name = $('.message-box .name');

      img.attr('src', _imgPath + (this.imgName || 'default.png') );
      quote.text(this.quote || 'Default Quote');
      name.html('<span>' + (this.name || 'Customer Name') + '</span> ' + this.city + ' ' + this['state-abbreviation']);
    }

/***************************************************************************
  // 3. Slide Functionality - 
***************************************************************************/

    function initializeCircles () {
      var $circle;

      $.each( _messagesList ,function(){
          $circle = $('<div class="circle"></div>');
          $circle.data(this);
          if (_enableClick){ 
            $circle.on('click', onCircleClick);
          }
          $slideCircles.append($circle);
      });
    }

    function onCircleClick () {
      updateCircle.apply($(this));
      
      var message = getMessageFromButton(_messagesList, $(this), _commonKey);
      updateMessages.apply(message);
      
      var svg = getSVGFromButton(pathElements, $(this), _commonKey);
      updateMap.apply(svg);
    }

    function updateCircle () {
      $slideCircles.children().each(function(){
        $(this).removeClass('active');
      });

      $(this).toggleClass('active');
    }
/***************************************************************************
  // 4. Slider Timer - 
***************************************************************************/

function initializeSliderTimer () {
  var circles = $('.slide-circles .circle'), // circles are loaded after initializeSlide creates the correct # of circles.
      i = 0,
      sliderHasStarted = null;
  
  if (i === 0) {
    onCircleClick.apply( $(circles[i]) );
  }

  if (sliderHasStarted) {
    clearInterval(sliderHasStarted);
    sliderHasStarted = null;
  }
  sliderHasStarted = setInterval(_triggerTimer, 1000*_slideInterval );


  function _triggerTimer(){
    onCircleClick.apply( $(circles[i]) );
    ++i;
    if (i == circles.length) i = 0;
  }
}
/***************************************************************************
  // 5. Helpers - 
***************************************************************************/

  function findObjectInListFromKeyValue (key, value, list){
    for (var l in list) {
      if(list[l].hasOwnProperty(key) && list[l][key].toUpperCase() == value.toUpperCase()) {
        return list[l];
      }
    }
  }

  function getMessageFromSVG (messages, svg, _commonKey) {
    var value = svg.data(_commonKey);   //state.data.state-abbreviaton 
    var message = findObjectInListFromKeyValue(_commonKey, value, messages); //TX, [obj,obj, ...]
     
    return message;    
  }

  function getCircleFromMessage(circles, message, _commonKey) {
    var button;

    button = $(circles).filter(function(){
      return $(this).data(_commonKey) === message[_commonKey];
    });
    
    //var button = findObjectInListFromKeyValue(_commonKey, value, circles );

    return button;
  }

  function getMessageFromButton(messages, button, _commonKey) {
    var value = button.data(_commonKey);   //state.data.state-abbreviaton 
    var message = findObjectInListFromKeyValue(_commonKey, value, messages); //TX, [obj,obj, ...]

    return message;
  }

  // Not being implemented 
  // function getButtonFromSVG (buttons, svg, _commonKey) {
  //   var button;

  //   button = $(buttons).filter(function(){
  //     $(this).data(_commonKey) === svg[_commonKey];
  //   });

  //   return button;
  // }

  function getSVGFromButton (svgs, button, _commonKey) {
    var svg;

    svg = $(svgs).filter(function() {
      return this.data(_commonKey) === button.data(_commonKey);
    });

    return svg[0];
  }


});