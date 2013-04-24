/**
 * Copyright (C) 2012
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Moisés Arcos Santiago <marcos@emergya.com>
 */
 /**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = Viewer.plugins
 *  class = addTagToMap
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: addTagToMap(config)
 *
 *    Plugin for exporting a selected layer to shape file.
 *    TODO Make this plural - selected layers
 */
gxp.plugins.AddTagToMap = Ext.extend(gxp.plugins.Tool, {

	/** api: ptype = gxp_addtagtomap */
	ptype: "gxp_addtagtomap",
	/** private: property[iconCls]*/
    iconCls: 'vw-icon-draw-tag',

    layerRemoved: false,

    toggleGroup : null,

	/** i18n **/
	addTagToMapTooltipText: "Add tag to map",
	titlePrompt: "Write",
	promptText: "Enter the label text",
	labelTitleLayer: "Label Layer",

	/** private: method[constructor]*/
    constructor: function(config) {
    	//this.createLabelLayer();
        gxp.plugins.AddTagToMap.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.AddTagToMap.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

	/** api: method[addActions] */
	addActions: function(){
		var tagAction = this.createAction();
    	gxp.plugins.AddTagToMap.superclass.addActions.apply(this, [tagAction]);
	},

	/** private: method[featureAddedHandler] */
	featureAddedHandler: function(options){
		Ext.MessageBox.prompt(
			// The window title
			this.handlerOptions.scope.titlePrompt, 
			// The content window
			this.handlerOptions.scope.promptText, 
			// The handler function
			this.handlerOptions.scope.addLabelToMap,
			// The element
			options);
	},

	/** privat: method[addLabelToMap] */
	addLabelToMap: function(btn, text){
		var featureAddedToMap = null;
		var labelFeatures = this.layer.features;
		for(var i=0; i<labelFeatures.length; i++){
			if(labelFeatures[i].geometry.equals(this.geometry)){
				featureAddedToMap = labelFeatures[i];
				break;
			}
		}
		if(btn == "ok"){
			featureAddedToMap.style = {
				label: text,
				fillOpacity: 0,
            	pointRadius: 0.01
			};
			this.layer.redraw();
		}else if(btn == "cancel"){
			this.layer.removeFeatures([featureAddedToMap]);
		}
	},

	/** private: method[getActionFromTool] */
	getActionFromTool: function(){
		return this.actions[0];
	},

	/** private: method[createLabelLayer] */
	createLabelLayer: function(){
			var tagLayer = new OpenLayers.Layer.Vector(this.labelTitleLayer, {
			//displayInLayerSwitcher: false,
    		styleMap: new OpenLayers.StyleMap({
            	'default': {
            		label: "T",
            		fillOpacity: 0,
            		pointRadius: 0.01,
					fontFamily: "Arial",
					fontSize: 10
            	},
            	'select': {
            		label: "T",
            		fillOpacity: 0,
            		pointRadius: 0.01,
					fontFamily: "Arial",
					fontSize: 10,
					fontColor: "blue"
            	},
            	'temporary': {
            		label: "T",
            		fillOpacity: 0,
            		pointRadius: 0.01,
					fontFamily: "Arial",
					fontSize: 16
            	}
        	}),
        	style: ""
    	});
    	tagLayer.metadata = {
    		labelLayer: true
    	};


    	this.tagLayer = tagLayer;
	},

	/** private: method[createControl] */
	createControl: function(){
		this.createLabelLayer();
		
		var tagControl = new OpenLayers.Control.DrawFeature(this.tagLayer, OpenLayers.Handler.Point);
		tagControl.featureAdded = this.featureAddedHandler;
		tagControl.handlerOptions = {scope: this};
		tagControl.setMap(Viewer.getMapPanel().map);
		tagControl.events.register("activate", this, this.activateHandler);
		return tagControl;
	},

	/** private: method[createAction] */
	createAction: function(){
		this.control = this.createControl();
		return new GeoExt.Action({
    		iconCls: this.iconCls,
            tooltip: this.addTagToMapTooltipText,    		
    		map: Viewer.getMapPanel().map,
    		enableToggle: true,
    		toggleGroup : this.toggleGroup,
    		control: this.control,
            pressed: false,
	         listeners : {
	            toggle: function(button, pressed) {
	            	if (pressed) {



	            		this.control.activate();
	                } else {
	                    this.control.deactivate();
	                }
	            },
	            scope: this
	        }
    	});
	},

	/** private: method[activateHandler] */
	activateHandler: function(){
		if(this.layerRemoved || !this.layerAdded){
			this.createLabelLayer();

			var map = Viewer.getMapPanel().map;
    		map.addLayer(this.tagLayer);

        	this.control.layer = this.tagLayer
        	this.layerRemoved = false;
        	this.layerAdded = true;
		}
	}
});

Ext.preg(gxp.plugins.AddTagToMap.prototype.ptype, gxp.plugins.AddTagToMap);
