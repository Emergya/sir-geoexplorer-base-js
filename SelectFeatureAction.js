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
                    // The tool is added.
                    this.styleBackup = this.featureLayer.styleMap;
                    this.featureLayer.styleMap= new OpenLayers.StyleMap({
                        extendBase: true
                    });
                    this.featureLayer.redraw();
                } else {
                   this._restoreStyles();
                }

            },
            scope: this
        }]);

        this.toolAction = actions[0];

        this._enableOrDisable();

        return actions;
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

        if(this.featureLayer) {
            // We restore the styles if we change 
            this._restoreStyles();
        }
        


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
