/**
 * Copyright (C) 2013
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
 * Author: Luis Román Gutiérrez <lroman@emergya.com>
 */
 /**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = AddFeatureToMap
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: addFeatureToMap(config)
 *
 *    Plugin for adding a feature to the map. Cannot be instantiated directly, must be
 *    extended to define which kind of geometry will be added.
 */
gxp.plugins.AddFeatureToMap = Ext.extend(gxp.plugins.Tool, {

     /** api: ptype = gxp_addfeaturetomap */
    ptype: "gxp_addfeaturetomap",

    /** public: property[iconCls]*/
    iconCls: 'vw-icon-add-line',

	/** private: property[featuremanager]*/
    featureManager: "featuremanager",

    /** public: property[toggleGroup]*/
    toggleGroup: null,

    /** public: property[geometryHandler]
     * The OpenLayers.Handler sublclass that will handle feature creation.
     * Default value is OpenLayers.Handler.Point.
     */
    geometryHandler : OpenLayers.Handler.Point,

    /** public: property[geometryTypes]
     * The  geometry types that tool will be enabled for.
     * Dafault value is ["Point"]
     */    
    geometryTypes: ["Point"],

    /** private: method[constructor]*/
    constructor: function(config) {
          gxp.plugins.AddFeatureToMap.superclass.constructor
                .call(this, Ext.apply({                   
                }, config));

    },
    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.AddFeatureToMap.superclass.init.apply(this, arguments);   
        this.target.on('beforerender', this.addActions, this);

    },
    /** api: method[addActions] */
	addActions: function(){
		var featureManager = this.getFeatureManager();
		var featureLayer = featureManager.featureLayer;
		//featureManager.schemaCache = {};
		//featureManager = this.updateFeatureManager(featureManager);
		var control = new OpenLayers.Control.DrawFeature(
	            featureLayer,
                this.geometryHandler, 
	            {  
                    eventListeners: {
	                    featureadded: function(evt) {
	                        if (this.autoLoadFeature === true) {
	                            this.autoLoadedFeature = evt.feature;
	                        }
	                    },
	                    scope: this
	                }
	            }
	        );
		control.setMap(Viewer.getMapPanel().map);
		var actions = [];
		actions.push(new GeoExt.Action({
			tooltip: this.tooltip,
            iconCls: this.iconCls,
            disabled: true,
            control: control,
            enableToggle: true,
            allowDepress: true,           
            toggleGroup: this.toggleGroup,
            deactivateOnDisable: true,
            map: this.target.mapPanel.map,            
            listeners : {
                toggle: function(button, pressed) {
                    if (pressed) {
                        control.activate();
                    } else {
                        control.deactivate();
                    }
                },
                scope: this
            }
		}));

		actions = gxp.plugins.AddFeatureToMap.superclass.addActions.apply(this, actions);
		
        featureManager.on("layerchange", this._enableOrDisable, this);
        window.app.on({
            layerselectionchange: this._enableOrDisable,
            loginstatechange: this._enableOrDisable,
            scope: this
        });
        
        this._enableOrDisable();

		return actions;
	},

	/** private: method[getFeatureManager]
     *  :returns: :class:`gxp.plugins.FeatureManager`
     */
    getFeatureManager: function() {
        var manager = this.target.tools[this.featureManager];
        if (!manager) {
        	manager = window.app.tools[this.featureManager];
        	if(!manager){
        		throw new Error("Unable to access feature manager by id: " + this.featureManager);
        	}
        }
        return manager;
    },

     /** private: method[_enableOrDisable]
      */
    _enableOrDisable : function() {
        var mgr = this.getFeatureManager();
        var layerRecord = mgr.layerRecord;
        var schema = mgr.schema;


        var geometryType = null;
        var authIdLayer = null;
        var authIdUser = null;
        var isAdmin = null;
        var layerId = null;
        var isTemporal = null;
        var layer = null;
        // Institución de la capa
        if(!!layerRecord && !!layerRecord.data && !!layerRecord.data.layer && !!layerRecord.data.layer.params){
            layer = layerRecord.data.layer;
            if(layer.authId){
                authIdLayer = layer.authId;
            }

            if(layer.layerID) {
                layerId = layer.layerID;
            }

            if(layer.metadata && layer.metadata.temporal) {
                isTemporal = true;
            }
        } 
        // Institución del usuario
        if(!!app && !!app.persistenceGeoContext 
                && !!app.persistenceGeoContext.userInfo 
                && !!app.persistenceGeoContext.userInfo.authorityId){
            authIdUser = app.persistenceGeoContext.userInfo.authorityId;
            isAdmin = app.persistenceGeoContext.userInfo.admin
        }
        // Comprobamos si el usuario tiene permisos en la capa
        if(layer && (isTemporal || layerId && (isAdmin || !!authIdUser && authIdLayer == authIdUser))){
            // There's a schema
            if(!schema || !mgr.geometryType){
                this.actions[0].disable();
                return;
            } 

            if(mgr.geometryType.indexOf("Multi") != -1){
                geometryType = mgr.geometryType.replace("Multi", "");
            }else{
                geometryType = mgr.geometryType;
            }
            if(!!geometryType && this.geometryTypes.indexOf(geometryType)>=0){
                this.setActionControlLayer(mgr.featureLayer);
                this.actions[0].enable();
            }else{
                this.actions[0].disable();
            }
        }else{
            // Disable the edit options
            this.actions[0].disable();
        }
    },

    /** private: method[setActionControlLayer]
     *  :arg layer: OpenLayers.Layer
     */
    setActionControlLayer: function(layer){
    	if(this.actions.length > 0){
    		this.actions[0].control.layer = layer;
    	}
    },
    /** private: method[updateFeatureManager]
     *  :arg featureManager: :class:`gxp.plugins.FeatureManager`
     *  :returns: :class:`gxp.plugins.FeatureManager`
     */
    updateFeatureManager: function(featureManager){
    	var queryManager = this.getFeatureManager();
    	featureManager.fetchSchema = queryManager.fetchSchema;
    	featureManager.getSchemaFromWMS = queryManager.getSchemaFromWMS;
    	featureManager.setFeatureStore = queryManager.setFeatureStore;
    	featureManager.getBaseParamsAndUrl = queryManager.getBaseParamsAndUrl;
    	featureManager.prepareWFS = queryManager.prepareWFS;
    	return featureManager;
    },

    setHandler: function(multi){
        this.actions[0].control.handler.destroy();

        var handler = this.geometryHandler;

        this.actions[0].control.handler = new handler(this.actions[0].control, this.actions[0].control.callbacks,
                Ext.apply(this.actions[0].control.handlerOptions, {multi: multi}));
    }
});

Ext.preg(gxp.plugins.AddFeatureToMap.prototype.ptype, gxp.plugins.AddFeatureToMap);