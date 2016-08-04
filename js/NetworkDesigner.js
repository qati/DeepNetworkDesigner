/**
 * Created by qati on 8/3/2016.
 */

(function (factory) {
    require.config({
        paths: {
            "jquery": "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.min",
            "jquery-ui": "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.0/jquery-ui.min",
            "jquery-connections": "jquery.connections.min",
            "jquery-timing": "jquery-timing.min",
            "d3": "https://root.cern.ch/js/notebook/scripts/d3.v3.min"
        },
        shim: {
            "jquery-ui": {
                exports: "jquery.ui",
                deps: ['jquery']
            },
            "jquery-connections":{
                deps: ['jquery']
            },
            "jquery-timing": {
                deps: ['jquery']
            }
        }
    });
    define(['jquery', 'd3', 'jquery-ui', 'jquery-connections', 'jquery-timing'], function (jQ, d3) {
        return factory({}, jQ, d3);
    })
})(function (NetworkDesigner, $, d3) {

    var containerID;

    var layers = [];
    var layersID;
    var layer_ids = {
        Identity: "layer_identity",
        Sigmoid: "layer_sigmoid",
        TANH: "layer_tanh",
        LINEAR: "layer_linear",
        ReLU: "layer_relu",
        Chooser: "layer_chooser",
        Radial: "layer_radial"
    };

    var connection_queue = [];

    var helpMessages = [];

    var colors = {
        layer: {
            input: "#00A000",
            output: "#F6BD00",
            hidden: ["steelblue", "red"]
        }
    };

    var layer_color = d3.scale.linear()
        .domain([0, 5000]).range(colors.layer.hidden)
        .interpolate(d3.interpolateRgb);


    var getText = function(key){
        for(var k in layer_ids){
            if (key==layer_ids[k]) return k;
        }
    };

    var drawConnection = function(e, id){
        connection_queue = [];
        $("#"+containerID).append("<div id='drawConnectionHelper'>div_"+id+"</div>");
        var helper = $("#drawConnectionHelper");
        helper.css({
            top:  e.pageY + "px",
            left: e.pageX + "px"
        });
        helper.draggable();
        helper.on("mouseup", function () {
            connection_queue.push($(this).text());
            $(this).remove();
        });
        $("#div_"+id).connections({to: "#drawConnectionHelper"});
    };

    var connectLayers  = function(target){
        var source;
        if (connection_queue.length!=1) {
            var helper = $("#drawConnectionHelper");
            source = "#" + String(helper.text());
            helper.remove();
        } else {
            source = "#" + String(connection_queue.pop());
        }
        $(source).connections({to: "#"+target});
    };

    var addLayer = function(id, addButton, connectionSource, connectionTarget, addText){
        var lid = id + layersID++;
        $("#"+containerID).append("<div class='layer_box' id='div_"+lid+"'></div>");
        var layer = $("#div_"+lid);
        var bkg_color = id.indexOf("input")!=-1 ? colors.layer.input
                        : id.indexOf("output")!=-1 ? colors.layer.output
                        : colors.layer.hidden[0];
        layer.css({
            position: "relative",
            top: "100px",
            left: "100px",
            "background-color": bkg_color
        });
        layer.draggable();
        if (addButton) {
            layer.html("<input type='button' id='button_" + lid + "' value='0' /><span>"
                        + getText(id) + "</span>");
            layer.on("click", "#button_" + lid, function () {
                $("#neuronnum_layer_dialog").data('buttonID', lid);
                $("#neuronnum_layer_dialog").dialog("open");
            });
        }
        if (connectionSource){
            layer.dblclick(function(e){
                drawConnection(e, lid);
            });
        }
        if (connectionTarget) {
            layer.droppable({
                drop: function () {
                    connectLayers("div_" + lid);
                }
            });
        }
        if (addText){
            layer.append(addText);
        }
    };

    var addNeuronsToLayer = function(){
        $("#"+containerID).append("<div id='neuronnum_layer_dialog' title='Add neurons' style='display: none'>\
            <form>\
            <label>Enter the number of neurons you want to add to this layer</label>\
            <input type='text'>\
            </form>\
            </div>");
        $("#neuronnum_layer_dialog").dialog({
            autoOpen: false,
            show: {
                effect: "blind",
                duration: 500
            },
            hide: {
                effect: "blind",
                duration: 500
            },
            open: function(){
                $("#neuronnum_layer_dialog form input").val($("#button_"+$(this).data("buttonID")).val());
            },
            buttons: {
                "OK": function(){
                    var neuron_num = $("#neuronnum_layer_dialog form input").val();
                    var button = $("#button_"+$(this).data("buttonID"));
                    button.css({left: String(40-neuron_num.length*5)+"%"});
                    neuron_num = Number(neuron_num);
                    button.val(neuron_num);
                    button.parent().css({ "background":  layer_color(neuron_num)});
                    $(this).dialog("close");
                },
                "Close": function() {
                    $(this).dialog("close");
                }
            }
        }).data('buttonID', '-1');
    };

    var MessageBox = function(id, title, message){
        $("#"+containerID).append("<div id='"+id+"_dialog' title='"+title+"' style='display: none'>\
            <p>"+message+"</p></div>");
        $("#"+id+"_dialog").dialog({
            autoOpen: false,
            show: {
                effect: "blind",
                duration: 700
            },
            hide: {
                effect: "explode",
                duration: 700
            },
            buttons: {
                "Close": function() {
                    $(this).dialog("close");
                }
            }
        });

        this.openOnClick = function(){
            $("#"+id).on("click", function () {
                $("#"+id+"_dialog").dialog("open");
            });
        };

        this.menuEntry = function () {
            return "<li id='"+id+"'><div>"+title+"</div></li>";
        };
    };

    var createMenu = function(){
        var html = "";

        html += "<div id='nd_menu_div'><ul id='nd_menu'>";

        html += "<li><div>Add layer</div><ul>";
        for(var i in layer_ids){
            html += "<li id='"+layer_ids[i]+"'><div>"+getText(layer_ids[i])+"</div></li>";
        }
        html += "</ul></li>";

        for(var i in helpMessages){
            html += helpMessages[i].menuEntry();
        }

        html += "</ul></div>";

        $("#"+containerID).append(html);

        var position = {my: "left top", at: "left bottom+8"};
        $( "#nd_menu" ).menu().menu({
            position: position,
            blur: function() {
                $(this).menu("option", "position", position);
            },
            focus: function(e, ui) {
                if ($("#nd_menu").get(0) !== $(ui).get(0).item.parent().get(0)) {
                    $(this).menu("option", "position", {my: "left top", at: "left top"});
                }
            }
        });
    };

    var events = function(){
        for(var key in layer_ids){
            $("#"+layer_ids[key]).on("click", function(){
                addLayer($(this)[0].id, true, true, true);
            });
        }
        for(var i in helpMessages){
            helpMessages[i].openOnClick();
        }
        $.repeat().add('connection').each($).connections('update').wait(0);
    };

    NetworkDesigner.init = function(id){
        containerID = id;
        layersID    = 0;

        connection_queue = [];

        helpMessages.push(new MessageBox("connect_layer", "Connect layers",
            "To connect two layer double click on first layer, grab the arrow and move inside the other layer."));
        helpMessages.push(new MessageBox("addneurons", "Add neurons",
            "To add neurons to a layer click on the number inside the layer."));

        createMenu();

        events();

        addLayer("layer_input", false, true, false, "<center>Input layer</center>");
        addLayer("layer_output", false, false, true, "<center>Output layer</center>");

        addNeuronsToLayer();
    };

    return NetworkDesigner;
});