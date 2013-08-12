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
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */


/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = SelectFeatureAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: SelectFeatureAction(config)
 *
 *    Provides an action for showing the default search dialog.
 */
gxp.plugins.SelectFeatureAction = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_extendedtoolbar */
    ptype: "gxp_selectfeature",
    
    /** api: config[buttonText]
     *  ``String`` Text to show next to the zoom button
     */
    buttonText: 'Selección de elementos',
     
    /** api: config[menuText]
     *  ``String``
     *  Text for zoom menu item (i18n).
     */
    menuText: 'Selección de elementos',

    /** api: config[tooltip]
     *  ``String``
     *  Text for zoom action tooltip (i18n).
     */
    tooltip: 'Selección de elementos',
    
    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-select-item',

    /** private: property[toolAction]
     */
    toolAction : null,

    /** private: property[selectedLayer]
     */
    selectedLayer: null,

    /** public: property[toggleGroup] */
    toggleGroup: null,

    /** public: property[featureManager]*/
    featureManager: "featuremanager",

    /** public: property[readOnly]*/
    readOnly : false,

    exceptionTitle: "Save Failed",
    exceptionText: "Trouble saving features",

    waitText: "Please wait...",
    errorText: "There was an error. Please try again.",

    /** private: property[selectionLayer]
     * Here we store the feature layer associated to the selected layer which we
     * will use to select features.
     */
    selectionLayer: null,

    /**
     * private: property[styleBackup]
     * Used to store the initial style of the feature layer so we can restore it 
     * when finishing a layer's selection.
     */
    styleBackup: null,
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.SelectFeatureAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.SelectFeatureAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

        // We add the events that will notify other tools about features added.
        this.addEvents("selectionchanged");

        // We make the tool avalaible
        Viewer.registerComponent(this.id, this);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var featureManager = this._getFeatureManager();
        featureManager.on("layerchange", this._enableOrDisable, this);
        window.app.on({
            layerselectionchange: this._enableOrDisable,
            loginstatechange: this._enableOrDisable,
            scope: this
        });

        var style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style["pointRadius"]=10;
        style["display"]="block";
        style["strokeColor"] = 'red'; 
        style["fillColor"] = 'red';

        // We create a new feature layer invisible in to the TOC where we will be adding the retrieved features.
        this.selectionLayer =  new OpenLayers.Layer.Vector(
            "selection layer",{
               "displayInLayerSwitcher":false,
                "style": style
            });
        Viewer.getMapPanel().map.addLayer(this.selectionLayer);

        // We register events on the selection layer to launch our own event.
        this.selectionLayer.events.register("featuresadded", this, this._fireSelectionChanged);
        this.selectionLayer.events.register("featuresremoved", this, this._fireSelectionChanged);


        // We create a selection control for the temporal layer, so we can deselect features when we click the feature.
        this.selectionControl = new OpenLayers.Control.SelectFeature(
                this.selectionLayer, {  
                    renderIntent:"temporary",
                    eventListeners: {
                        featurehighlighted: function(event) {
                              this.selectionLayer.removeFeatures(event.feature);
                        },
                        scope: this
                    }
                });

        this.selectionControl.setMap(Viewer.getMapPanel().map);
        Viewer.getMapPanel().map.addControl(this.selectionControl);
     

        var actions = gxp.plugins.SelectFeatureAction.superclass.addActions.apply(this, [{
            text: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            enableToggle: true,
            toggleGroup : this.toggleGroup,
            deactivateOnDisable: true,
            disabled: true,
            pressed: false,
            toggleHandler: function(action, state) {

                // We change the cursor over the map to indicate selection.
                Ext.select(".olMap").setStyle("cursor", state?"crosshair":"default");
                var mapCtr = Viewer.getController('Map');

                mapCtr.toggleSelectFeature(state);

                // We clean the selection layer every time we deactivate, activate or reactivate the tool.
                this.clearSelection();


                if(state) {
                    // We handle clicks directly on the map to retrieve the feature.
                    mapCtr.mapPanel.map.events.register("click", this, this._onMapClicked);

                   
                    this.selectionControl.initLayer(this.selectionLayer);
                    this.selectionControl.activate();
                } else {

                    this.clearSelection();
                   mapCtr.mapPanel.map.events.unregister("click", this, this._onMapClicked);
                   this.selectionControl.deactivate();
                }

            },
            scope: this
        }]);

        this.toolAction = actions[0];

        this._enableOrDisable();

        return actions;
    },

    _fireSelectionChanged : function () {
        this.fireEvent("selectionchanged", this, this.selectionLayer.features);
    },

     /** private: method[_onMapClicked]
     *  :arg evt: ``Object``
     */
    _onMapClicked: function(evt) {

        var featureManager = this._getFeatureManager();
        var evtLL = this.target.mapPanel.map.getLonLatFromPixel(evt.xy);
        
        var page = featureManager.page;
        var layer = featureManager.layerRecord && featureManager.layerRecord.getLayer();
        if (!layer) {
            // if the feature manager has no layer currently set, do nothing
            return;
        }

        //this._getFeature(layer, evt);
        
        this._getFeatureInfo(featureManager, layer, evt);
    },

    _getFeatureInfo: function(featureMgr, layer, evt) {
        // construct params for GetFeatureInfo request
        // layer is not added to map, so we do this manually
        var map = this.target.mapPanel.map;
        var size = map.getSize();
        var params = Ext.applyIf({
            REQUEST: "GetFeatureInfo",
            BBOX: map.getExtent().toBBOX(),
            WIDTH: size.w,
            HEIGHT: size.h,
            X: parseInt(evt.xy.x),
            Y: parseInt(evt.xy.y),
            QUERY_LAYERS: layer.params.LAYERS,
            INFO_FORMAT: "application/vnd.ogc.gml",
            EXCEPTIONS: "application/vnd.ogc.se_xml",
            FEATURE_COUNT: 1
        }, layer.params);

        var projection = map.getProjectionObject();
        var layerProj = layer.projection;
        if (layerProj && layerProj.equals(projection)) {
            projection = layerProj;
        }
        if (parseFloat(layer.params.VERSION) >= 1.3) {
            params.CRS = projection.getCode();
        } else {
            params.SRS = projection.getCode();
        }
        
        if (typeof this.tolerance === "number") {
            for (var i=0, ii=this.toleranceParameters.length; i<ii; ++i) {
                params[this.toleranceParameters[i]] = this.tolerance;
            }
        }

        //Ext.Msg.wait(this.waitText);

        var store = new GeoExt.data.FeatureStore({
            fields: {},
            proxy: new GeoExt.data.ProtocolProxy({
                protocol: new OpenLayers.Protocol.HTTP({
                    url: (typeof layer.url === "string") ? layer.url : layer.url[0],
                    params: params,
                    format: new OpenLayers.Format.WMSGetFeatureInfo()
                })
            }),
            autoLoad: true,
            listeners: {
                "load": function(store, records) {
                      // Ext.Msg.updateProgress(1);
                      //   Ext.Msg.hide();
                    if (records.length > 0) {
                      
                        var fid = records[0].get("fid");

                        var existingFeature = this.selectionLayer.getFeatureByFid(fid);
                        if(existingFeature) {
                            this.selectionLayer.removeFeatures(existingFeature);
                            return;
                        }

                        var filter = new OpenLayers.Filter.FeatureId({
                            fids: [fid] 
                        });


                         featureMgr.loadFeatures(
                                filter, function(features) {
                                    if (features.length) {
                                        this.autoLoadedFeature = features[0];
                                        this.selectionLayer.addFeatures(features[0]);
                                    }
                                }, this);
                    }
                },
                scope: this
            }
        });
    },

    /** private: method[_enableOrDisable]
     */
     _enableOrDisable : function() {
        var mgr = this._getFeatureManager();
        var layerRecord = mgr.layerRecord;

        
        var authIdLayer = null;
        var authIdUser = null;
        var isAdmin = null;
        var layerId = null;
        var isTemporal = null;
        var layer = null;
        // Institución de la capa
        if(!!layerRecord && !!layerRecord.data && !!layerRecord.data.layer && layerRecord.data.layer.params && mgr.geometryType){
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
   
        this.clearSelection();
        // Comprobamos si el usuario tiene permisos en la capa
        if(layer) {
            this.toolAction.enable();
        }else{
            // We need to manually deactivate if disabled, as it seems
            // that the deactivateOnDisable property is not working here...
            if( this.toolAction.items[0].pressed) {
                this.toolAction.items[0].toggle();
            }
            // Disable the edit options
            this.toolAction.disable();
        }
    },


   

     /** private: method[_getFeatureManager]
     */
    _getFeatureManager: function() {
        var  manager = window.app.tools[this.featureManager];
        if(!manager){
            throw new Error("Unable to access feature manager by id: " + this.featureManager);
        }
        return manager;
    },

    /** public: method[clearSelection] 
     * Removes the current selection.
     */
    clearSelection : function() {
        this.selectionLayer.removeAllFeatures();
        this._getFeatureManager().clearFeatures();
    }
        
});

Ext.preg(gxp.plugins.SelectFeatureAction.prototype.ptype, gxp.plugins.SelectFeatureAction);
