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
 *  class = addPointToMap
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: addPointToMap(config)
 *
 *    Plugin for adding a point in a layer on the map.
 */
gxp.plugins.AddPointToMap = Ext.extend(gxp.plugins.Tool, {
	/** api: ptype = gxp_addpointtomap */
	ptype: "gxp_addpointtomap",
	/** private: property[iconCls]*/
    iconCls: 'vw-icon-add-point',
    /** private: property[featuremanager]*/
    featureManager: "featuremanager",
    /** private: method[constructor]*/
    constructor: function(config) {
        gxp.plugins.AddPointToMap.superclass.constructor.apply(this, arguments);
    },
    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.AddPointToMap.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },
    /** api: method[addActions] */
	addActions: function(){
		var featureManager = this.getFeatureManager();
		var featureLayer = featureManager.featureLayer;
		featureManager.schemaCache = {};
		featureManager = this.updateFeatureManager(featureManager);
		var control = new OpenLayers.Control.DrawFeature(
	            featureLayer,
	            OpenLayers.Handler.Point, 
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
            enableToggle: true,
            allowDepress: true,
            control: control,
            deactivateOnDisable: true,
            map: this.target.mapPanel.map
		}));
		actions = gxp.plugins.AddPointToMap.superclass.addActions.apply(this, actions);
		featureManager.on("layerchange", this.onLayerChange, this);
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
    /** private: method[onLayerChange]
     *  :arg mgr: :class:`gxp.plugins.FeatureManager`
     *  :arg layer: ``GeoExt.data.LayerRecord``
     *  :arg schema: ``GeoExt.data.AttributeStore``
     */
    onLayerChange: function(mgr, layer, schema) {
    	var geometryType = null;
    	var authIdLayer = null;
    	var authIdUser = null;
    	// Institución de la capa
    	if(!!layer && !!layer.data && !!layer.data.layer && layer.data.layer.authId){
    		authIdLayer = layer.data.layer.authId;
    	}
    	// Institución del usuario
    	if(!!app && !!app.persistenceGeoContext 
    			&& !!app.persistenceGeoContext.userInfo 
    			&& !!app.persistenceGeoContext.userInfo.authorityId){
    		authIdUser = app.persistenceGeoContext.userInfo.authorityId;
    	}
    	// Comprobamos si el usuario tiene permisos en la capa
    	if(!!authIdLayer && !!authIdUser && authIdLayer == authIdUser){
    		// There's a schema
        	if(!schema){
        		// Disable the edit options
        		this.actions[0].disable();
        	}else{
        		// Feature Types
        		if(!!mgr.geometryType){
        			if(mgr.geometryType.indexOf("Multi") != -1){
        				geometryType = mgr.geometryType.replace("Multi", "");
        			}else{
        				geometryType = mgr.geometryType;
        			}
        			if(!!geometryType && geometryType == "Point"){
        				this.setActionControlLayer(mgr.featureLayer);
        				this.actions[0].enable();
        			}else{
        				this.actions[0].disable();
        			}
        		}
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
    	var queryManager = this.getFeatureManager("querymanager");
    	featureManager.fetchSchema = queryManager.fetchSchema;
    	featureManager.getSchemaFromWMS = queryManager.getSchemaFromWMS;
    	featureManager.setFeatureStore = queryManager.setFeatureStore;
    	featureManager.getBaseParamsAndUrl = queryManager.getBaseParamsAndUrl;
    	featureManager.prepareWFS = queryManager.prepareWFS;
    	return featureManager;
    }
});

Ext.preg(gxp.plugins.AddPointToMap.prototype.ptype, gxp.plugins.AddPointToMap);