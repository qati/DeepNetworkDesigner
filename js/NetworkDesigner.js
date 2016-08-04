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
    var layers = [], layersID;

    var layer_ids = {
        tanh: "layer_tanh",
        lin: "layer_lin"
    };

    var layer_color = d3.scale.linear()
        .domain([0, 5000]).range(["steelblue", "red"])
        .interpolate(d3.interpolateRgb);


    var getText = function(key){
        for(var k in layer_ids){
            if (key==layer_ids[k]) return k;
        }
    };

    var events = function(){
        var connection_queue = [];
        for(var key in layer_ids){
            $("#"+layer_ids[key]).on("click", function(){
                var id = $(this)[0].id + layersID++;

                $("#"+containerID).append("<div class='layer_box' id='div_"+id+"'></div>");
                var layer = $("#div_"+id);
                layer.html("<input type='button' id='button_"+id+"' value='0' /><span>"+getText($(this)[0].id)+"</span>");
                layer.css({
                    position: "relative",
                    top: "100px",
                    left: "100px"
                });
                layer.draggable();
                layer.droppable({
                    drop: function(){
                        var source;
                        if (connection_queue.length!=1) {
                            var helper = $("#drawConnectionHelper");
                            source = "#" + String(helper.text());
                            helper.remove();
                        } else {
                            source = "#" + String(connection_queue.pop());
                        }
                        $(this).connections({to: source});
                    }
                });
                layer.dblclick(function(e){
                    $("#"+containerID).append("<div id='drawConnectionHelper'>div_"+id+"</div>");
                    var helper = $("#drawConnectionHelper");
                    helper.css({
                        top: e.pageY + "px",
                        left: e.pageX+"px"
                    });
                    helper.draggable();
                    helper.on("mouseup", function () {
                        connection_queue.push($(this).text());
                        $(this).remove();
                    });
                    $(this).connections({to: "#drawConnectionHelper"});
                });
                layer.on("click", "#button_"+id, function(){
                    $("#neuronnum_layer_dialog").data('buttonID', id);
                    $("#neuronnum_layer_dialog").dialog("open");
                });
            });
        }
        $.repeat().add('connection').each($).connections('update').wait(0);

        $("#connect_layer").on("click", function () {
            $( "#connect_layer_dialog" ).dialog( "open" );
        });

        $("#"+containerID).append("<div class='layer_box' id='div_layer_input'></div>");
        var layer = $("#div_layer_input");
        layer.css({
            position: "relative",
            top: "100px",
            left: "10px",
            "background-color": "#00A000"
        });
        layer.draggable();
        layer.append("<center>Input layer</center>");
        layer.dblclick(function(e){
            $("#"+containerID).append("<div id='drawConnectionHelper'>div_layer_input</div>");
            var helper = $("#drawConnectionHelper");
            helper.css({
                top: e.pageY + "px",
                left: e.pageX+"px"
            });
            helper.draggable();
            helper.on("mouseup", function () {
                connection_queue.push($(this).text());
                $(this).remove();
            });
            $(this).connections({to: "#drawConnectionHelper"});
        });

        $("#"+containerID).append("<div class='layer_box' id='div_layer_output'></div>");
        var layer = $("#div_layer_output");
        layer.css({
            position: "relative",
            top: "100px",
            left: "500px",
            "background-color": "#F6BD00"
        });
        layer.draggable();
        layer.append("<center>Output layer</center>");
        layer.droppable({
            drop: function(){
                var source;
                if (connection_queue.length!=1) {
                    var helper = $("#drawConnectionHelper");
                    source = "#" + String(helper.text());
                    helper.remove();
                } else {
                    source = "#" + String(connection_queue.pop());
                }
                console.log(source)
                $(this).connections({to: source});
            }
        });

    };

    NetworkDesigner.init = function(id){
        containerID = id;
        layersID = 0;
        var position = {my: "left top", at: "left bottom+8"};

        $( "#menu" ).menu().menu({
            position: position,
            blur: function() {
                $(this).menu("option", "position", position);
            },
            focus: function(e, ui) {
                if ($("#menu").get(0) !== $(ui).get(0).item.parent().get(0)) {
                    $(this).menu("option", "position", {my: "left top", at: "left top"});
            }
        }
        });
        $("#"+containerID).append("<div id='connect_layer_dialog' title='Connect layers' style='display: none'>\
            <p>To connect two layer double click on first layer, grab the arrow and move inside the other layer.</p>\
            </div>");
        $( "#connect_layer_dialog" ).dialog({
            autoOpen: false,
            show: {
                effect: "blind",
                duration: 700
            },
            hide: {
                effect: "explode",
                duration: 700
            }
        });
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
                "Cancel": function() {
                    $(this).dialog("close");
                }
            }
        }).data('buttonID', '-1')
        ;
        events();
    };

    return NetworkDesigner;
});