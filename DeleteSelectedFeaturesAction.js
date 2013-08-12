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
 * Author: Luis Román <lroman@emergya.com>
 */


/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = DeleteSelectedFeaturesAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: DeleteSelectedFeaturesAction(config)
 *
 *    Provides an action for showing the default search dialog.
 */
gxp.plugins.DeleteSelectedFeaturesAction = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_extendedtoolbar */
    ptype: "gxp_deleteselectedfeatures",
    
    /** api: config[buttonText]
     *  ``String`` Text to show next to the delete selected features button
     */
    buttonText: 'Delete selected features',
     
    /** api: config[menuText]
     *  ``String``
     *  Text for delete selected features menu item (i18n).
     */
    menuText: 'Delete selected features',

    /** api: config[tooltip]
     *  ``String``
     *  Text for delete selected features action tooltip (i18n).
     */
    tooltip: 'Delete selected features',

    waitText: "Please wait...",
    errorText: "There was an error. Please try again.",

    confirmQuestionText: "The selected features will be removed permanently. Do you want to continue?",
    deleteText: "Delete features",
    cancelText: "Don't delete",
    successText: "The selected features were deleted successfully.",

    
    /** private: property[iconCls]
     */
    iconCls: 'gxp-icon-removelayers',

    /** private: property[toolAction]
     */
    toolAction : null,   

    /** public: property[featureManager]*/
    featureManager: "featuremanager",

    /** public: property[featureSelector]*/
    featureSelector:  "featureselector",


    selectedFeatures : null,






    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.DeleteSelectedFeaturesAction.superclass.constructor.apply(this, arguments);
    },

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.DeleteSelectedFeaturesAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

        this.target.on('render', this._handleSelectionChange, this);

    },

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = gxp.plugins.DeleteSelectedFeaturesAction.superclass.addActions.apply(this, [{
            text: this.showButtonText ? this.buttonText : '',
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,   
            disabled: true,
            deactivateOnDisable: true,
            handler: this._confirmDeletion,
            scope: this
        }]);

        this.toolAction = actions[0];

        return actions;
    },

     /** api: method[_confirmDeletion]
     */
    _confirmDeletion : function() {
        Ext.Msg.show({
           title: '',
           msg: this.confirmQuestionText,
           buttons: {
                "yes": this.deleteText,
                "no": this.cancelText
           },
           fn: this._doDeletion,
           scope: this,
           modal: true
        });
    },

    _doDeletion : function(result) {
        if(result == "no") {
            // We do nothing.
            return;
        }

        var featureManager = this._getFeatureManager();
        var selectedLayer = featureManager.layerRecord.data.layer;

        var protocol = featureManager.featureStore.proxy.protocol;

        for(var idx = 0; idx < this.selectedFeatures.length; idx++) {
            // We mark the selected features for deletion.
            this.selectedFeatures[idx].state = OpenLayers.State.DELETE;
        }

        Ext.Msg.wait(this.waitText);
        // We perform the deletion.
        protocol.commit(
            this.selectedFeatures,{
            callback : function(response) {
                Ext.Msg.updateProgress(1);
                Ext.Msg.hide();

                if(response.error) {
                    Ext.Msg.alert("", this.errorText);
                    return;
                }
                

                // We remove the selection and reload the layer.
                this._getFeatureSelector().clearSelection();
                selectedLayer.redraw(true);

                Ext.Msg.alert("", this.successText);
            },
            scope: this
        })

    },

     /** api: method[addOptions]
     */
    _handleSelectionChange: function() {
        var featureSelector = this._getFeatureSelector();
        featureSelector.on("selectionchanged", this._onFeatureSelectionChange, this);
    },

    _onFeatureSelectionChange : function (featureSelector, features){
        this.selectedFeatures = features;

        if(!features.length) {
            this.toolAction.disable();
            return;
        }

        // If we have features we need to check if the user can edit the layer.

        var mgr = this._getFeatureManager();
        var layerRecord = mgr.layerRecord;

        var authIdLayer = null;
        var authIdUser = null;
        var isAdmin = null;
        var layerId = null;
        var isTemporal = null;
        var layer = null;

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
        
        if(!!app && !!app.persistenceGeoContext 
                && !!app.persistenceGeoContext.userInfo 
                && !!app.persistenceGeoContext.userInfo.authorityId){
            authIdUser = app.persistenceGeoContext.userInfo.authorityId;
            isAdmin = app.persistenceGeoContext.userInfo.admin
        }

        // We check if the user can edit the layer.
        var layerEditable = layer && (isTemporal || layerId && (isAdmin || !!authIdUser && authIdLayer == authIdUser));


        if(layerEditable) {
            this.toolAction.enable();
        } else {
            this.toolAction.disable();
        }
        
    },

    _getFeatureSelector : function() {
        return Viewer.getComponent(this.featureSelector);
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
        
});

Ext.preg(gxp.plugins.DeleteSelectedFeaturesAction.prototype.ptype, gxp.plugins.DeleteSelectedFeaturesAction);
