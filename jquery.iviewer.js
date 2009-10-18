(function($){
    var defaults = {
        zoom: 0,
        zoom_max: 5,
        zoom_min: -5,
        zoom_delta: 1,
        ui_disabled: false,
        //event is triggered, when zoom is changed
        //first parameter is zoom delta
        onZoom: null
    };

    var settings = {};
    /* object containing actual information about image
    *   @img_object.object - jquery img object
    *   @img_object.orig_{width|height} - original dimensions
    *   @img_object.display_{width|height} - actual dimensions
    */
    var img_object = {};
    var zoom_object; //object to show zoom status
    var current_zoom;
    var container; //div containing image
    
    //drag variables
    var dx; 
    var dy;
    var dragged = false;
    
    //fit image in the container
    function fit(){
        var aspect_ratio = img_object.orig_width / img_object.orig_height;
        var window_ratio = settings.width /  settings.height;
        var choose_left = (aspect_ratio > window_ratio);

        if(choose_left){
            img_object.display_width = settings.width;
            img_object.display_height = settings.width / aspect_ratio;
        }
        else {
            img_object.display_width = settings.height * aspect_ratio;
            img_object.display_height = settings.height;
        }
        img_object.object.attr("width",img_object.display_width)
                         .attr("height",img_object.display_height);

        center();
        current_zoom = -Math.floor(img_object.orig_height/img_object.display_height);
        update_status();
    }
    
    //center image in container
    function center(){
       img_object.object.css("top",-Math.round((img_object.display_height - settings.height)/2))
                        .css("left",-Math.round((img_object.display_width - settings.width)/2));
    }
    
    /**
    *   move a point in container to the center of display area
    *   @param x a point in container
    *   @param y a point in container
    **/
    function moveTo(x,y){
        var dx = x-Math.round(settings.width/2);
        var dy = y-Math.round(settings.height/2);
        
        var new_x = parseInt(img_object.object.css("left"),10) - dx;
        var new_y = parseInt(img_object.object.css("top"),10) - dy;
        
        setCoords(new_x, new_y);
    }
    
    /**
    * set coordinates of upper left corner of image object
    **/
    function setCoords(x,y)
    {
        //check new coordinates to be correct (to be in rect)
        if(y > 0){
            y = 0;
        }
        if(x > 0){
            x = 0;
        }
        if(y + img_object.display_height < settings.height){
            y = settings.height - img_object.display_height;
        }
        if(x + img_object.display_width < settings.width){
            x = settings.width - img_object.display_width;
        }
        if(img_object.display_width <= settings.width){
            x = -(img_object.display_width - settings.width)/2;
        }
        if(img_object.display_height <= settings.height){
            y = -(img_object.display_height - settings.height)/2;
        }
        
        img_object.object.css("top",y + "px")
                         .css("left",x + "px");
    }
    
    
    /**
    * set image scale to the new_zoom
    * @param new_zoom image scale. 
    * if new_zoom == 0 then display image in original size
    * if new_zoom < 0 then scale = 1/new_zoom * 100 %
    * if new_zoom > 0 then scale = 1*new_zoom * 100 %
    **/
    function set_zoom(new_zoom)
    {
        if(new_zoom <  settings.zoom_min)
        {
            new_zoom = settings.zoom_min;
        }
        else if(new_zoom > settings.zoom_max)
        {
            new_zoom = settings.zoom_max;
        }
        
        var new_x;
        var new_y;
        var new_width;
        var new_height;
        
        var old_x = -parseInt(img_object.object.css("left"),10) + Math.round(settings.width/2);
        var old_y = -parseInt(img_object.object.css("top"),10) + Math.round(settings.height/2);
        if (current_zoom < 0){
            old_x *= (Math.abs(current_zoom)+1);
            old_y *= (Math.abs(current_zoom)+1);
        } else if (current_zoom > 0){
            old_x /= (Math.abs(current_zoom)+1);
            old_y /= (Math.abs(current_zoom)+1);
        }
        
        if (new_zoom < 0){
            new_x = old_x / (Math.abs(new_zoom)+1);
            new_y = old_y / (Math.abs(new_zoom)+1);
            new_width = img_object.orig_width /  (Math.abs(new_zoom)+1);
            new_height = img_object.orig_height /  (Math.abs(new_zoom)+1);
        } else if (new_zoom > 0){
            new_x = old_x * (Math.abs(new_zoom)+1);
            new_y = old_y * (Math.abs(new_zoom)+1);
            new_width = img_object.orig_width * (Math.abs(new_zoom)+1);
            new_height = img_object.orig_height * (Math.abs(new_zoom)+1);
        }
        else {
            new_x = old_x;
            new_y = old_y;
            new_width = img_object.orig_width;
            new_height = img_object.orig_height;
        }
        new_x = settings.width/2 - new_x;
        new_y = settings.height/2 - new_y;
        
        img_object.object.attr("width",new_width)
                         .attr("height",new_height);
        img_object.display_width = new_width;
        img_object.display_height = new_height;
                           
        setCoords(new_x, new_y);
        
        if(settings.onZoom !== null)
        {
            settings.onZoom(new_zoom - current_zoom);
        }
        
        current_zoom = new_zoom;
        update_status();
    }

    
    /* update scale info in the container */
    function update_status()
    {
        if(!settings.ui_disabled)
        {
            var percent = Math.round(100*img_object.display_height/img_object.orig_height);
            if(percent)
            {
                zoom_object.html(percent + "%");
            }
        }
    }
    
    function update_container_info()
    {
        settings.height = container.height();
        settings.width = container.width();
    }
    
    
    /**
    *   callback for handling mousdown event to start dragging image
    **/
    function drag_start(e)
    {
        /* start drag event*/
        dragged = true;
        container.addClass("iviewer_drag_cursor");

        dx = e.pageX - parseInt($(this).css("left"),10);
        dy = e.pageY - parseInt($(this).css("top"),10);
        return false;
    }
    
    
    /**
    *   callback for handling mousmove event to drag image
    **/
    function drag(e)
    {
        if(dragged){
            var ltop =  e.pageY -dy;
            var lleft = e.pageX -dx;
            
            setCoords(lleft, ltop);
            return false;
        }
    }
    
    
    /**
    *   callback for handling stop drag
    **/
    function drag_end(e)
    {
        container.removeClass("iviewer_drag_cursor");
        dragged=false;
    }
    
    /**
    *   create zoom buttons info box
    **/
    function createui()
    {
        $("<div>").addClass("iviewer_zoom_in").addClass("iviewer_common").
        addClass("iviewer_button").
        mousedown(function(){set_zoom(current_zoom + 1); return false;}).appendTo(container);
        
        $("<div>").addClass("iviewer_zoom_out").addClass("iviewer_common").
        addClass("iviewer_button").
        mousedown(function(){set_zoom(current_zoom - 1); return false;}).appendTo(container);
        
        $("<div>").addClass("iviewer_zoom_zero").addClass("iviewer_common").
        addClass("iviewer_button").
        mousedown(function(){set_zoom(0); return false;}).appendTo(container);
        
        $("<div>").addClass("iviewer_zoom_fit").addClass("iviewer_common").
        addClass("iviewer_button").
        mousedown(function(){fit(); return false;}).appendTo(container);
        
        zoom_object = $("<div>").addClass("iviewer_zoom_status").addClass("iviewer_common").
        appendTo(container);
        
        update_status(); //initial status update
    }
    
    $.fn.iviewer  = function(options)
    {
        settings = $.extend(defaults, options);
        
        if(settings.src === null){
            return;
        }
            
        current_zoom = settings.zoom;
        container = this;
        
        update_container_info();

        //init container
        this.css("overflow","hidden");
             
        $(window).resize(function()
        {
            update_container_info();
        });
                
        //init object
        img_object.object = $("<img>").load(function(){
            img_object.display_width = img_object.orig_width = this.width;
            img_object.display_height = img_object.orig_height = this.height;
            $(this).css("position","absolute")
                .css("top","0px") //this is needed, because chromium sets them
                   .css("left","0px") //auto otherwise
                   .prependTo(container);
                   
            container.addClass("iviewer_cursor");

            if((img_object.display_width > settings.width) ||
               (img_object.display_height > settings.height)){
                fit();
            } else {
                moveTo(img_object.display_width/2, img_object.display_height/2);
            }
            //src attribute is after setting load event, or it won't work
        }).attr("src",settings.src).
        mousedown(drag_start).
        mousemove(drag).
        mouseup(drag_end).
        mouseleave(drag_end).
        mousewheel(function(ev, delta)
        {
            //this event is there instead of containing div, because
            //at opera it triggers many times on div
            var zoom = (delta > 0)?1:-1;
            var new_zoom = current_zoom + zoom;
            set_zoom(new_zoom);
            return false;
        });
        
        if(!settings.ui_disabled)
        {
            createui();
        }
    };
    
    
    /**
    *   function for external control
    */
    $.fn.iviewer.zoom = function(delta) { set_zoom(current_zoom + delta); };
    $.fn.iviewer.fit  = function(delta) { fit(); };
    $.fn.iviewer.toOrig  = function(delta) { set_zoom(0); };
 
 })(jQuery);