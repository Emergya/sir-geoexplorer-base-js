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

    /** private: property[featureLayer]
     * Here we store the feature layer associated to the selected layer which we
     * will use to select features.
     */
    featureLayer: null,

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
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var featureManager = this._getFeatureManager();
        featureManager.on("layerchange", this._enableOrDisable, this);
        app.on("loginstatechange", this._enableOrDisable,this);

        
        var featureLayer = featureManager.featureLayer;      


        this.control = new OpenLayers.Control.SelectFeature(
                featureLayer, {  
                    multiple: true,
                    renderIntent:"temporary",
                    eventListeners: {
                        featurehighlighted: function(event) {
                            var popup =  new gxp.FeatureEditPopup({
                                allowDelete:true,
                                feature: featureManager.featureStore.getByFeature(event.feature),
                                width: 200,
                                height: 250,
                                readOnly: this.readOnly,
                                collapsible: true,
                                title: "Propiedades de "+ event.feature.fid
                            });

                            popup.on({
                                "close": function(){
                                    this._onPopupClosed(event.feature)
                                },
                                "featuremodified": function(popup, feature){
                                    this._onFeatureModified(popup, feature);
                                },
                                "canceledit": function(popup, feature) {
                                    featureStore.commitChanges();
                                },
                                scope: this
                            });
                            this.popup = popup;

                            popup.show();
                        },
                        scope: this
                    }
                });

        this.control.setMap(Viewer.getMapPanel().map);
        Viewer.getMapPanel().map.addControl(this.control);

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
                Viewer.getController('Map').toggleSelectFeature(state);


                if(state) {
                    this._applyStyles();
                    this.control.initLayer(this.featureLayer);
                    this.control.activate();
                } else {
                   this._restoreStyles();
                   this.control.deactivate();
                }

            },
            scope: this
        }]);

        this.toolAction = actions[0];

        this._enableOrDisable();

        return actions;
    },

    _onFeatureModified : function(popup, feature) {
        var featureManager = this._getFeatureManager();
        var featureStore = featureManager.featureStore;
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
                    if (this.commitMessage === true) {
                        if (!this._commitMsg) {
                            var fn = arguments.callee;
                            Ext.Msg.show({
                                prompt: true,
                                title: this.commitTitle,
                                msg: this.commitText,
                                buttons: Ext.Msg.OK,
                                fn: function(btn, text) {
                                    if (btn === 'ok') {
                                        this._commitMsg = text;
                                        featureStore.un('beforesave', fn, this);
                                        featureStore.save();
                                    }
                                },
                                scope: this,
                                multiline: true
                            });
                            return false;
                        }
                    }
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
                    }
                    var layer = featureManager.layerRecord;
                    this.target.fireEvent("featureedit", featureManager, {
                        name: layer.get("name"),
                        source: layer.get("source")
                    });
                },
                single: true
            },
            exception: {
                fn: function(proxy, type, action, options, response, records) {
                    var msg = this.exceptionText;
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

    _onPopupClosed: function(feature) {
        if (this.readOnly === false) {
            this.control.activate();
        }
        if(feature.layer && feature.layer.selectedFeatures.indexOf(feature) !== -1) {
            //this.control.unselect(feature);
        }
    },

    _applyStyles : function() {
        this.styleBackup = this.featureLayer.styleMap;
        this.featureLayer.styleMap= new OpenLayers.StyleMap({
            styles:{
                default : {
                    defaultStyle: {
                        cursor: "inherit",
                        fillColor: "#ee9900",
                        fillOpacity: 0.4,
                        fontColor: "#000000",
                        hoverFillColor: "white",
                        hoverFillOpacity: 0.8,
                        hoverPointRadius: 1,
                        hoverPointUnit: "%",
                        hoverStrokeColor: "red",
                        hoverStrokeOpacity: 1,
                        hoverStrokeWidth: 0.2,
                        labelAlign: "cm",
                        labelOutlineColor: "white",
                        labelOutlineWidth: 3,
                        pointRadius: 6,
                        pointerEvents: "visiblePainted",
                        strokeColor: "#ee9900",
                        strokeDashstyle: "solid",
                        strokeLinecap: "round",
                        strokeOpacity: 1,
                        strokeWidth: "2"
                    }
                },
                delete : {
                    defaultStyle: {
                        display: "none"
                    }
                },
                select : {
                    defaultStyle: {
                       cursor: "pointer",
                        fillColor: "blue",
                        fillOpacity: 0.4,
                        fontColor: "#000000",
                        hoverFillColor: "white",
                        hoverFillOpacity: 0.8,
                        hoverPointRadius: 1,
                        hoverPointUnit: "%",
                        hoverStrokeColor: "red",
                        hoverStrokeOpacity: 1,
                        hoverStrokeWidth: 0.2,
                        labelAlign: "cm",
                        labelOutlineColor: "white",
                        labelOutlineWidth: 3,
                        pointRadius: 6,
                        pointerEvents: "visiblePainted",
                        strokeColor: "blue",
                        strokeDashstyle: "solid",
                        strokeLinecap: "round",
                        strokeOpacity: 1,
                        strokeWidth: 2
                    }
                }
            }
          

        });
        this.featureLayer.redraw();
    },

    _restoreStyles : function() {
        if(this.styleBackup){
            this.featureLayer.styleMap= this.styleBackup;
            this.featureLayer.redraw();   
        }
         
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
        if(!!layerRecord && !!layerRecord.data && !!layerRecord.data.layer){
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

            this.featureLayer = mgr.featureLayer;

            
            if(this.control.active){
                this._applyStyles();  
            }
             this.control.initLayer(this.featureLayer);
            this.actions[0].enable();
        }else{
            // Disable the edit options
            this.actions[0].disable();

            var ds = Viewer.getComponent('NewElementFromCoords');
            if(ds && ds.isVisible()) {
                ds.hide();
            }
        }
    },

     /** private: method[_getFeatureManager]
     *  :arg mgr: :class:`gxp.plugins.FeatureManager`
     *  :arg layer: ``GeoExt.data.LayerRecord``
     *  :arg schema: ``GeoExt.data.AttributeStore``
     */
    _getFeatureManager: function() {
        var  manager = window.app.tools[this.featureManager];
        if(!manager){
            throw new Error("Unable to access feature manager by id: " + this.featureManager);
        }
        return manager;
    },
        
});

Ext.preg(gxp.plugins.SelectFeatureAction.prototype.ptype, gxp.plugins.SelectFeatureAction);
