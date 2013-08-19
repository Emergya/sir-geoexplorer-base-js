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

    /** public: api[errorText] */
    errorText: "An error has occurred. Please try again.",
    /** public: api[waitText] */
    waitText: "Please wait...",

    /** public: api[outputTarget] */
    outputTarget: "map",

    /** private: property[actionTool] */
    actionTool : null,

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
        var popup= null;

		var featureManager = this.getFeatureManager();
		var featureLayer = featureManager.featureLayer;
		//featureManager.schemaCache = {};
		//featureManager = this.updateFeatureManager(featureManager);
		var control = new OpenLayers.Control.DrawFeature(
	            featureLayer,
                this.geometryHandler, 
	            {  map: Viewer.getMapPanel().map,
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

        this.drawControl = control;

         this.selectControl = new OpenLayers.Control.SelectFeature(featureLayer, {
            clickout: false,
            multipleKey: "fakeKey",
            map: Viewer.getMapPanel().map,
            eventListeners: {
                "activate": function() {                
                    featureManager.showLayer(
                        this.id, this.showSelectedOnly && "selected"
                    );
                    this.selectControl.unselectAll(
                        popup && popup.editing && {except: popup.feature}
                    );
                },
                "deactivate": function() {
                   if (popup) {
                        if (popup.editing) {
                            popup.on("cancelclose", function() {
                                this.selectControl.activate();
                            }, this, {single: true});
                        }
                        popup.on("close", function() {
                            featureManager.hideLayer(this.id);
                        }, this, {single: true});
                         popup.feature.state=null;
                        popup.close();
                    } else {
                        featureManager.hideLayer(this.id);
                    }
                },
                scope: this
            }
        });

		var actions = [];
		actions.push(new Ext.Action({
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
                        this.drawControl.activate();
                    } else {
                        this.drawControl.deactivate();
                        this.selectControl.deactivate();
                    }
                },
                scope: this
            }
		}));

		actions = gxp.plugins.AddFeatureToMap.superclass.addActions.apply(this, actions);

        this.actionTool = actions[0];
		
        featureManager.on("layerchange", this._enableOrDisable, this);
        window.app.on({
            layerselectionchange: this._enableOrDisable,
            loginstatechange: this._enableOrDisable,
            scope: this
        });


        featureManager.featureLayer.events.on({
            "beforefeatureremoved": function(evt) {
                if (this.popup && evt.feature === this.popup.feature) {
                    this.selectControl.unselect(evt.feature);
                }
            },
            "featureunselected": function(evt) {
                var feature = evt.feature;
                if (feature && feature.geometry && popup && !popup.hidden) {
                    popup.feature.state=null;
                    popup.close();
                }
            },
            "beforefeatureselected": function(evt) {
                //TODO decide if we want to allow feature selection while a
                // feature is being edited. If so, we have to revisit the
                // SelectFeature/ModifyFeature setup, because that would
                // require to have the SelectFeature control *always*
                // activated *after* the ModifyFeature control. Otherwise. we
                // must not configure the ModifyFeature control in standalone
                // mode, and use the SelectFeature control that comes with the
                // ModifyFeature control instead.
                if(popup) {
                    return !popup.editing;
                }
            },
            "featureselected": function(evt) {
                var feature = evt.feature;
                var featureStore = featureManager.featureStore;
                if(this.selectControl.active && feature.geometry !== null) {
                    
                    featureManager.showLayer(this.id, false);
                    
                    popup = this.addOutput({
                        xtype: "gxp_featureeditpopup",
                        collapsible: false,
                        feature: featureStore.getByFeature(feature),
                        vertexRenderIntent: "vertex",
                        readOnly: false,
                        fields: null,
                        excludeFields: null,
                        editing: feature.state === OpenLayers.State.INSERT,
                        schema: featureManager.schema,
                        allowDelete: true,
                        width: 200,
                        height: 250
                    });
                    popup.on({
                        "close": function() {
                            if(this.actionTool.items[0].pressed) {                             
                                // We only start the drawing control if the tool is still selected.
                                this.drawControl.activate();    
                            }
                            
                            this.selectControl.deactivate();
                        },
                        "featuremodified": function(popup, feature) {
                            featureStore.on({
                                beforewrite: {
                                    fn: function(store, action, rs, options) {
                                        if (this.commitMessage === true) {
                                            options.params.handle = this._commitMsg;
                                            delete this._commitMsg;
                                        }
                                    },
                                    single: true
                                },
                                beforesave: {
                                    fn: function() {
                                        if (popup && popup.isVisible()) {
                                            popup.disable();                                            
                                        }
                                        
                                        Ext.Msg.wait(this.waitText);
                                    },
                                    single: this.commitMessage !== true
                                },
                                write: {
                                    fn: function() {
                                        if (popup) {
                                            if (popup.isVisible()) {
                                                popup.enable();
                                            }
                                            if (this.closeOnSave) {
                                                popup.close();
                                            }

                                            Ext.Msg.updateProgress(1);
                                            Ext.Msg.hide();

                                            this.selectControl.unselect(feature);
                                            featureManager.featureLayer.removeAllFeatures();
                                        }
                                    },
                                    single: true
                                },
                                exception: {
                                    fn: function(proxy, type, action, options, response, records) {
                                        Ext.Msg.updateProgress(1);
                                        Ext.Msg.hide();


                                        var msg = this.errorText;
                                        if (type === "remote") {
                                            // response is service exception
                                            if (response.exceptionReport) {
                                                msg = gxp.util.getOGCExceptionText(response.exceptionReport);
                                            }
                                        } else {
                                            // non-200 response from server
                                            msg = "Status: " + response.status;
                                        }
                                        // fire an event on the feature manager
                                        featureManager.fireEvent("exception", featureManager, 
                                            response.exceptionReport || {}, msg, records);
                                        // only show dialog if there is no listener registered
                                        if (featureManager.hasListener("exception") === false && 
                                            featureStore.hasListener("exception") === false) {
                                                Ext.Msg.show({
                                                    title: this.exceptionTitle,
                                                    msg: msg,
                                                    icon: Ext.MessageBox.ERROR,
                                                    buttons: {ok: true}
                                                });
                                        }
                                        if (popup && popup.isVisible()) {
                                            popup.enable();
                                            popup.startEditing();
                                        }
                                    },
                                    single: true
                                },
                                scope: this
                            });                                
                            if(feature.state === OpenLayers.State.DELETE) {
                                /**
                                 * If the feature state is delete, we need to
                                 * remove it from the store (so it is collected
                                 * in the store.removed list.  However, it should
                                 * not be removed from the layer.  Until
                                 * http://trac.geoext.org/ticket/141 is addressed
                                 * we need to stop the store from removing the
                                 * feature from the layer.
                                 */
                                featureStore._removing = true; // TODO: remove after http://trac.geoext.org/ticket/141
                                featureStore.remove(featureStore.getRecordFromFeature(feature));
                                delete featureStore._removing; // TODO: remove after http://trac.geoext.org/ticket/141
                            }
                            featureStore.save();
                        },
                        "canceledit": function(popup, feature) {
                            featureStore.commitChanges();
                        },
                        scope: this
                    });
                    this.popup = popup;
                }
            },
            "sketchcomplete": function(evt) {
                // Why not register for featuresadded directly? We only want
                // to handle features here that were just added by a
                // DrawFeature control, and we need to make sure that our
                // featuresadded handler is executed after any FeatureStore's,
                // because otherwise our selectControl.select statement inside
                // this handler would trigger a featureselected event before
                // the feature row is added to a FeatureGrid. This, again,
                // would result in the new feature not being shown as selected
                // in the grid.
                if(!this.drawControl.active) {
                    // We are not drawing with this tool.
                    return;
                }
                featureManager.featureLayer.events.register("featuresadded", this, function(evt) {
                    featureManager.featureLayer.events.unregister("featuresadded", this, arguments.callee);

                    this.drawControl.deactivate();
                    this.selectControl.activate();
                    this.selectControl.select(evt.features[0]);
                });
            },
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
                // We need to manually toggle before disabling.
                if(this.actionTool.items[0].pressed) {
                    this.actionTool.items[0].toggle();
                }
                this.actionTool.disable();
                return;
            } 

            if(mgr.geometryType.indexOf("Multi") != -1){
                geometryType = mgr.geometryType.replace("Multi", "");
            }else{
                geometryType = mgr.geometryType;
            }
            if(!!geometryType && this.geometryTypes.indexOf(geometryType)>=0){
                this.setActionControlLayer(mgr.featureLayer);
                this.actionTool.enable();
            }else{
                // We need to manually toggle before disabling.
                if(this.actionTool.items[0].pressed) {
                    this.actionTool.items[0].toggle();
                }
                this.actionTool.disable();
            }
        }else{
        
            // We need to manually toggle before disabling.
            if(this.actionTool.items[0].pressed) {
                this.actionTool.items[0].toggle();
            }

            // Disable the edit options
            this.actionTool.disable();
        }
    },

    /** private: method[setActionControlLayer]
     *  :arg layer: OpenLayers.Layer
     */
    setActionControlLayer: function(layer){
        this.selectControl.layer = layer;
        this.drawControl.layer = layer;
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
        this.actionTool.control.handler.destroy();

        var handler = this.geometryHandler;

        this.actionTool.control.handler = new handler(this.actionTool.control, this.actionTool.control.callbacks,
                Ext.apply(this.actionTool.control.handlerOptions, {multi: multi}));
    }
});

Ext.preg(gxp.plugins.AddFeatureToMap.prototype.ptype, gxp.plugins.AddFeatureToMap);