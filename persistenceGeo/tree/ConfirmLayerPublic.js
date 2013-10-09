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
    rejectWindowTitleText: 'Reject layer publication',
    publicationTitleText:"Layer publication",
    publicationSuccessText: 'The layer was published successfully.',
    rejectionSuccessText: "Publication of the layer was rejected successfully.",
    rejectionErrorText: "An error happened while rejecting the layer's publication.",
    publicationErrorText: "An error happened while publishing the layer.",
    confirmationTitleText: "Confirmation",
    confirmationQuestionText: "Do you really wish to pulish the layer with the current metadata?",

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

        if (record && record.getLayer()) {
            var layer = record.getLayer();
            var userInfo = this.target.persistenceGeoContext.userInfo;
            if ( !! userInfo && userInfo.admin) {
                this.layerSelected = record;
                var pending = false;
                if(!!layer.metadata.json.properties){
                    var status = layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'ESTADO'];
                    if(!!status && status =="PENDIENTE") {
                        pending = true;
                    }
                }
                disable = !!layer.layerID || !pending;
            }
        }

        this.launchAction.setDisabled(disable);
    },

    onTreeNodeLoaded: function(node, selectionModel) {
       
        node.expand();
        node.expandChildNodes();
       
        // We selected the recevided node if we are editing.
        var checkId = node.id;
        if(node.attributes.type!="FolderDto" 
            && checkId > PersistenceGeo.widgets.FolderTreePanel.prototype.LEAF_ID_OFFSET) {
            checkId -= PersistenceGeo.widgets.FolderTreePanel.prototype.LEAF_ID_OFFSET;
        }
        
        if (checkId == +this.selectedTargetId){
            selectionModel.select(node);
            node.ui.focus();
        }
    },

    /**
     
     * api: method[showWindow]
     * Show all windows of this component.
     */
    showWindow: function(layerRecord) {
        var layer = this.layerSelected.getLayer();
        //TODO: Handle errors!!!
        var layerPublishRequestId = layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'ID'];
        var nameLayer = layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'NOMBREDESEADO'];
        this.activeAction = layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'ACTUALIZACION'] == 'true' ?
            this.KNOWN_ACTIONS.UPDATE_LAYER : this.KNOWN_ACTIONS.NEW_LAYER;
        var updatedLayerId = layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'UPDATEDLAYERID'];
        if (updatedLayerId) {
            this.selectedTargetId = updatedLayerId;
        } else {
            // The folder id comes as a string so we need to conver it.
            this.selectedTargetId = +layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'PUBLISHEDFOLDER'];
        }
        PersistenceGeo.tree.ConfirmLayerPublic.superclass.showWindow.call(this, layerRecord);
        this.nameField.setValue(this.getJsonData().name);
    },

    /** api: method[onEditorPanelAction]
     *  :param action: ``String`` action called in editor panel
     *  :param metadataInfo: ``Object`` optional parameter from the panel (UUID, for example)
     *
     *  Called when an action is pressed in the editor panel.
     *  For this widget we need to save the layer changes in a gis_layer_publish_request entry
     *  calling to this.saveUrl
     */
    onEditorPanelAction: function(action, metadataInfo) {
        if (action == "doPublication") {

            var self  =this;
            Ext.MessageBox.confirm(this.confirmationTitleText, this.confirmationQuestionText, function(btn) {
                if (btn != 'yes') {
                    // We do nothing;
                    return;
                }

                if(!self.validateForm()) {
                    return;
                }

                self._doPublicationRequest(metadataInfo);    
            });
        } else if (action == "doRejection") {
            this.showCancelWindow();
        } else if (action == "cancel")  {
            this.closeAll();
        }
    },

    _doPublicationRequest: function(metadataInfo) {
         // Action 'finish' | 'validate' --> save
        var targetFolder = this.requestData.activeAction == this.KNOWN_ACTIONS.NEW_LAYER ?
            this.requestData.targetId : null;
        var targetLayer = this.requestData.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER ?
            this.requestData.targetId : null;
        
        // save metadata id and Uuid
        this.jsonData.metadataUuid = metadataInfo.metadataUuid;
        this.jsonData.metadataId = metadataInfo.metadataId;
        

        // Loading indicator.
        this._proccessMask = new Ext.LoadMask(Ext.getBody());
        this._proccessMask.show();

        Ext.Ajax.request({
            url: this.target.defaultRestUrl + this.saveUrl,
            params: {
                layerPublishRequestId: this.jsonData.layerPublishRequestId,
                layerTitle: this.requestData.layerTitle,
                targetFolder: targetFolder,
                targetLayer: targetLayer
            },
            method: 'POST',
            success: this.handleSuccess,
            failure: this.handleFailure,
            scope: this
        });
    },

    showCancelWindow: function() {
        var layer = this.layerSelected.getLayer();
        var nameLayer = layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'NOMBREDESEADO'];
        // Create a window 
        this.cancelPublishRequestWindow = new Ext.Window({
            title:  this.rejectWindowTitleText,
            width: this.windowWidth,
            height: this.windowHeight,
            layout: 'fit',
            modal: true,
            items: new Ext.form.FormPanel({
                items: [{
                    xtype: 'textarea',
                    fieldLabel: this.commentFieldLabelText,
                    allowBlank: false,
                    width: '100%',
                    heght: 250,
                    msgTarget: "under",
                    listeners: {
                        change: function(text, newValue) {
                            this.comment = newValue;
                        },
                        scope: this
                    }
                }],
                border: false,
                labelWidth: 50,
                bodyStyle: "padding: 15px",
                autoWidth: true,
                height: 500,
                bbar: [
                    ['->'],
                    new Ext.Action({
                        text: this.rejectButtonText,
                        handler: function() {
                            this.submitCancel();
                        },
                        scope: this
                    }),
                    new Ext.Action({
                        text: this.cancelButtonText,
                        handler: function() {
                            this.cancelPublishRequestWindow.hide();
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

    submitCancel: function() {

        this._proccessMask = new Ext.LoadMask(Ext.getBody());
        this._proccessMask.show();
        // Action 'cancel' -->  We need to remove the layer_request?!
        Ext.Ajax.request({
            url: this.target.defaultRestUrl + this.cancelUrl,
            params: {
                id: this.getJsonData().layerPublishRequestId + "",
                comment: this.comment + ""
            },
            method: 'POST',
            success: this.handleSuccessCancel,
            failure: this.handleFailureCancel,
            scope: this
        });
    },

    handleSuccessCancel: function(response) {
        this.closeAll();
        this.cancelPublishRequestWindow.close();
        this._proccessMask.hide();
        if (response.responseText) {
            var jsonData = Ext.decode(response.responseText);
            if (!jsonData.success) {
                this.handleFailureCancel(response);
            } else {
                var layer = this.jsonData.layerSelected.getLayer();
                if (!layer.metadata) {
                    layer.metadata = {};
                }
                //TODO REMOVE metadata this.jsonData.metadataUuid in GN
                layer.metadata.metadataUuid = null;
                console.log(jsonData.data.estado);
                layer.metadata.json.properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'ESTADO'] == jsonData.data.estado;                

                // The rejected layer is removed from the toc.
                app.mapPanel.map.removeLayer(layer);

                Ext.Msg.alert(this.rejectWindowTitleText, this.rejectionSuccessText);
            }
        }
    },

    handleFailureCancel: function(response) {
        this._proccessMask.hide();
        Ext.Msg.alert(this.rejectWindowTitleText, this.rejectionErrorText);
    },

    handleSuccess: function(response) {
        this._proccessMask.hide();
        if (response.responseText) {
            var jsonData = Ext.decode(response.responseText);
            if (!jsonData.success) {
                this.handleFailure(jsonData);
            } else {
                var layer = this.jsonData.layerSelected.getLayer();
                if (!layer.metadata) {
                    layer.metadata = {};
                }
                layer.metadata.metadataUuid = this.jsonData.metadataUuid;

                // The rejected layer is removed from the toc.
                app.mapPanel.map.removeLayer(layer);

                this.closeAll();
                Ext.Msg.alert(this.publicationTitleText, this.publicationSuccessText);

            }
        }
    },

    handleFailure: function(response) {
        this._proccessMask.hide();
        Ext.Msg.alert(this.publicationTitleText, this.publicationErrorText);
    },
    /** This function make the metadata public!! **/
    makeMetadataPublic: function(){

        var firstUrl = GN_URL + '/srv/eng/metadata.select?id='+this.jsonData.metadataUuid + '&selected=add';
        var secondUrl = GN_URL + '/srv/eng/metadata.batch.admin.form';
        var thirdUrl = GN_URL + '/srv/eng/metadata.batch.update.privileges?&timeType=on&_1_0=on&_0_0=on&_-1_0=on';

        Ext.Ajax.request({
            url : firstUrl,
            method: 'GET',
            success : function(){
                 Ext.Ajax.request({
                    url : secondUrl,
                    method: 'GET',
                    success : function(){
                       Ext.Ajax.request({
                            url : thirdUrl,
                            method: 'GET',
                            disableCaching: false, //we need this parameter because gn try to parse _dc as _${idGropup}
                            success : function(){
                                //console.log("OK!!");
                            },
                            scope : this
                        }); 
                    },
                    scope : this
                });
            },
            scope : this
        });
    }
});

Ext.preg(PersistenceGeo.tree.ConfirmLayerPublic.prototype.ptype, PersistenceGeo.tree.ConfirmLayerPublic);