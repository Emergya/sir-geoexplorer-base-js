/*
 * ConfirmLayerPublic.js Copyright (C) 2013 This file is part of PersistenceGeo project
 * 
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 * 
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */

/**
 * @required  persistenceGeo/widgets/GeoNetworkMetadataPublisher.js
 */

/** api: (define)
 *  module = PersistenceGeo.tree
 *  class = MakeLayerPublic
 */
Ext.namespace("PersistenceGeo.tree");

/**
 * Class: PersistenceGeo.tree.ConfirmLayerPublic
 * 
 * Make a layer public. See #87023
 * 
 */
PersistenceGeo.tree.ConfirmLayerPublic = Ext.extend(PersistenceGeo.tree.GeoNetworkMetadataPublisher, {

    /** api: ptype = pgeo_confirmlayerpublic */
    ptype: "pgeo_confirmlayerpublic",

    /** i18n **/
    toolText: 'Confirm or reject publish request',
    toolTooltipText: 'Confirms or rejects a layer request publish',
    toolWindowText: "Layer {0} publish request confirmation",
    cancelButtonText: 'Confirm rejection',
    commentFieldLabelText: 'Rejection reasons',
    cancelWindowText: 'Reject publication of \'{0}\'',

    /** Save url for the layer publish request **/
    saveUrl: '/persistenceGeo/confirmPublishRequest',

    /** Cancel url for the layer publish request **/
    cancelUrl: '/persistenceGeo/cancelPublishRequest',
    
    /** api: config[isUpdate]
     *  ``Boolean`` Indicate if this instance is an update or not.
     */
    isUpdate: true,

    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Only enabled when the selected layer have metadata UUID and the user logged is admin
     */
    checkIfEnable: function(record) {

        var disable = true;

        if(record && record.getLayer()){
          var layer = record.getLayer();
          var userInfo = this.target.persistenceGeoContext.userInfo;
          if(!!userInfo && userInfo.admin){
              this.layerSelected = record;
              this.layerUuid = layer.metadata.metadataUuid;
              var pending = layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'ESTADO'] == "PENDIENTE";
              disable = !this.layerUuid && !pending;
          }
        }

        this.launchAction.setDisabled(disable);
    },

    /**

     * api: method[showWindow]
     * Show all windows of this component.
     */
    showWindow: function(layerRecord) {
        var layer = this.layerSelected.getLayer();  
        //TODO: Handle errors!!!
        var layerPublishRequestId = layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'ID'];
        var nameLayer = layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'NOMBREDESEADO'];
        this.activeAction = layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'ACTUALIZACION'] == 'true' ?
            this.KNOWN_ACTIONS.UPDATE_LAYER : this.KNOWN_ACTIONS.NEW_LAYER;
        var updatedLayerId = layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'UPDATEDLAYERID'];
        if(updatedLayerId){
            this.selectedTargetId = updatedLayerId;
        }else{
            //TODO folderID in this.selectedTargetId
            this.selectedTargetName = layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'PUBLISHEDFOLDER'];
        }
        PersistenceGeo.tree.ConfirmLayerPublic.superclass.showWindow.call(this, layerRecord);
        this.nameField.setValue(this.getJsonData().name);
    },


    /**
     * private: method[getTargetWindow]
     * Obtain folder tree panel window to select a layer
     */
    getTargetWindow: function(layerRecord, showLayers) {
        var targetWindow = PersistenceGeo.tree.ConfirmLayerPublic.superclass.getTargetWindow.call(this, layerRecord, showLayers);

        targetWindow.show();

        var treePanel = targetWindow.items.get(targetWindow.items.keys[0]);
        treePanel.on({
            append: function( tree, parent, node, index){
                console.log("append");
                node.on({
                    render: function(){
                        this.select();
                        console.log(node)
                    }, 
                    scope: node
                });
            },
            scope: this
        });
        console.log(treePanel);

        treePanel.doLayout();

        return targetWindow;
    },

    /** api: method[onEditorPanelAction]
     *  :param action: ``String`` action called in editor panel
     *  :param arg1: ``Object`` optional parameter from the panel (UUID, for example)
     *
     *  Called when an action is pressed in the editor panel. 
     *  For this widget we need to save the layer changes in a gis_layer_publish_request entry
     *  calling to this.saveUrl
     */
    onEditorPanelAction: function (action, arg1){
        if(action == "finish" || action =="validate"){
            // Action 'finish' | 'validate' --> save
            var targetFolder = this.jsonData.activeAction == this.KNOWN_ACTIONS.NEW_LAYER ?
                this.jsonData.selectedTargetId : null;
            var targetLayer = this.jsonData.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER ?
                this.jsonData.selectedTargetId : null;
            this.jsonData.metadataUuid = arg1;
            Ext.Ajax.request({
                url : this.target.defaultRestUrl + this.saveUrl,
                params:{
                    layerPublishRequestId: this.jsonData.layerPublishRequestId
                },
                method: 'POST',
                success : this.handleSuccess,
                failure : this.handleFailure,
                scope : this
            });
        }else if(action =="cancel"){
            this.closeAll();
            this.showCancelWindow();
        }else if(action =="reset"){
            // something todo if action is 'reset'
        }
    },

    showCancelWindow: function (){
        var layer = this.layerSelected.getLayer();  
        var nameLayer = layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'NOMBREDESEADO'];
         // Create a window 
        this.cancelPublishRequestWindow = new Ext.Window({
            title:  String.format(this.cancelWindowText, nameLayer),
            width: this.windowWidth,
            height: this.windowHeight,
            layout: 'fit',
            modal: true,
            items: new Ext.form.FormPanel({
                items: [
                    {
                        xtype: 'textarea',
                        fieldLabel: this.commentFieldLabelText,
                        allowBlank: false,
                        width: '100%',
                        heght: 250,
                        msgTarget: "under",
                        listeners: {
                            change: function(text, newValue){
                                this.comment = newValue;
                            },
                            scope: this
                        }
                    }
                ],
                border: false,
                labelWidth: 50,
                bodyStyle: "padding: 15px",
                autoWidth: true,
                height: 500,
                bbar:[
                    ['->'],
                    new Ext.Action({
                        text: this.cancelButtonText,
                        handler: function(){
                            this.submitCancel();
                        },
                        scope: this
                    })
                ]
            }),
            closeAction: 'hide',
            constrain: true,
        });

        this.cancelPublishRequestWindow.show();

        return this.cancelPublishRequestWindow;
    },

    submitCancel: function(){
        // Action 'cancel' -->  We need to remove the layer_request?!
        Ext.Ajax.request({
            url : this.target.defaultRestUrl + this.cancelUrl,
            params:{
                id: this.getJsonData().layerPublishRequestId + "" ,
                comment: this.comment + ""
            },
            method: 'POST',
            success : this.handleSuccessCancel,
            failure : this.handleFailureCancel,
            scope : this
        });
    },

    handleSuccessCancel: function(response){
        this.cancelPublishRequestWindow.close();
        if(response.responseText){
            var jsonData = Ext.decode(response.responseText);
            if(!jsonData.success){
                this.handleFailureCancel(response);
            }else{
                var layer = this.jsonData.layerSelected.getLayer();
                if(!layer.metadata){
                    layer.metadata = {};
                }
                //TODO REMOVE metadata this.jsonData.metadataUuid in GN
                layer.metadata.metadataUuid = null;
                console.log(jsonData.data.estado);
                layer.metadata.json.properties[this.PUBLISH_REQUET_DATA_PREFIX + 'ESTADO'] == jsonData.data.estado;
                //TODO: Show info success
            }
        }
    },

    handleFailureCancel: function(response){
        this.cancelPublishRequestWindow.close();
        console.error("TODO: Handle me!! Error in the layer publish request cancel!");
    },

    handleSuccess: function(response){
        if(response.responseText){
            var jsonData = Ext.decode(response.responseText);
            if(!jsonData.success){
                this.handleFailure(jsonData);
            }else{
                var layer = this.jsonData.layerSelected.getLayer();
                if(!layer.metadata){
                    layer.metadata = {};
                }
                layer.metadata.metadataUuid = this.jsonData.metadataUuid;
            }
        }
    },

    handleFailure: function(response){
        console.error("TODO: Handle me!! Error saving the layer!");
    }

});

Ext.preg(PersistenceGeo.tree.ConfirmLayerPublic.prototype.ptype, PersistenceGeo.tree.ConfirmLayerPublic);