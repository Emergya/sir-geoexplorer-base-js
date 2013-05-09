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
 *  class = AddDataColumnAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: AddDataColumnAction(config)
 *
 *    Provides an action for showing the default search dialog.
 */
gxp.plugins.AddDataColumnAction = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_extendedtoolbar */
    ptype: "gxp_adddatacolumn",
    
    /** api: config[buttonText]
     *  ``String`` Text to show next to the zoom button
     */
    buttonText: 'Nuevo elemento',
     
    /** api: config[menuText]
     *  ``String``
     *  Text for zoom menu item (i18n).
     */
    menuText: 'Nuevo elemento',

    /** api: config[tooltip]
     *  ``String``
     *  Text for zoom action tooltip (i18n).
     */
    tooltip: 'Nuevo elemento',

    /**
     * public: property[featureManager]
     */
    featureManager: "featuremanager",
    
    /** private: property[iconCls]
     */
    iconCls: 'vw-icon-new-column',

    /** public; public[toggleGroup]*/
    toggleGroup : null,
 
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.AddDataColumnAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.AddDataColumnAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
        window.app.on({
            layerselectionchange: this._enableOrDisable,
            loginstatechange: this._enableOrDisable,
            scope: this
        });
    },

    /** api: method[addActions]
     */
    addActions: function() {

        this.actions =  gxp.plugins.AddDataColumnAction.superclass.addActions.apply(this, [{
            text: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            enableToggle: true,
            allowDepress: true,           
            toggleGroup: this.toggleGroup,
            deactivateOnDisable: true,
             handler: function(action, evt) {

                var ds = Viewer.getComponent('AddDataColumn');
               if (ds === undefined) {
                    var mapPanel = Viewer.getMapPanel();
                    ds = new Viewer.dialog.AddDataColumn({
                        mapPanel: mapPanel,
                        map: mapPanel.map,
                        action: this
                    });
                    Viewer.registerComponent('AddDataColumn', ds);
                    ds.on("hide", function() {
                        // We deactivate the tool if we close the window.
                        if(this.actions[0].items[0].pressed){
                            this.actions[0].items[0].toggle();    
                        }
                    },this);
                }
                if (action.pressed) {                    
                    ds.show();
                } else {
                    ds.hide();
                }
            },
             listeners : {
                toggle: function(button, pressed) {
                    var ds = Viewer.getComponent('AddDataColumn');
                    if (!pressed && ds) {
                        ds.close();
                        Viewer.unregisterComponent('AddDataColumn');
                    } 
                },
                scope: this
            },
            scope: this
            
        }]);

        this._enableOrDisable();

        return this.actions;
    },


    /** private: method[getFeatureManager]
     *  :returns: :class:`gxp.plugins.FeatureManager`
     */
     _enableOrDisable : function() {
        var mgr = this.getFeatureManager();
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
             this.actions[0].enable();
        }else{
            // Disable the edit options
            this.actions[0].disable();

            var ds = Viewer.getComponent('AddDataColumn');
            if(ds && ds.isVisible()) {
                ds.hide();
            }
        }
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
        
});

Ext.preg(gxp.plugins.AddDataColumnAction.prototype.ptype, gxp.plugins.AddDataColumnAction);
