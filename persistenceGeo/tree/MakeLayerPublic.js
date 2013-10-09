/*
 * MakeLayerPublic.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 * Class: PersistenceGeo.tree.MakeLayerPublic
 * 
 * Make a layer public. See #87022
 * 
 */
PersistenceGeo.tree.MakeLayerPublic = Ext.extend(PersistenceGeo.tree.GeoNetworkMetadataPublisher, {

    /** api: ptype = pgeo_makelayerpublic */
    ptype: "pgeo_makelayerpublic",

    /** Save url for the layer publish request **/
    saveUrl: '/persistenceGeo/saveLayerPublishRequest',
    checkUrl: '/persistenceGeo/checkCanCreateRequest',

    
    savingRequestError: "An error was found while saving the publication request.",
    savingRequestSuccessMsg: "The publication request was registered successfully. It will be attended by an admin as soon as possible.",
    publicationRequestText: "Publication Request",
    checkError : "An error was found while checking if the publication is possible.",
    existingPublicationRequestText: "There is already a publication request peding review for the selected layer, so no new publication requests for the layer can be made.",
    confirmPublicationRequest: "Do you really want to request the publication of the layer with the current metadata?",
    doPublicationRequestText:"Request publication",


    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Only enabled when the selected layer have metadata UUID and the user logged is admin
     */
    checkIfEnable: function(record) {

        var disable = true;

        if(record && record.getLayer()){
          var layer = record.getLayer();

          var tmpLayer = typeof(layer.layerID) == "undefined" && layer.metadata && layer.metadata.temporal;
          
          var userInfo = this.target.persistenceGeoContext.userInfo;
          var layerOwned =  !tmpLayer &&  !!userInfo && !userInfo.admin && !!layer.authId && userInfo.authorityId == layer.authId;
          disable = !layerOwned;
        }

        this.launchAction.setDisabled(disable);
    },

    /**
     * We override the default action handler because we need to check in the server if
     * there is already a publication request for the selected layer.
     */
    actionHandler : function() {
        var record = this._selectedLayer;
        if (record) {

            var layer = record.getLayer();

           Ext.Ajax.request({
              url : this.target.defaultRestUrl + this.checkUrl,
              params:{
                  layerId: layer.layerID
              },
              method: 'POST',
              success : this._onCheckSucess,
              failure : this._onCheckFail,
              scope : this
          });
        }
    },
    
    _onCheckFail : function() {
        Ext.Msg.alert("", this.checkError);
    },

    _onCheckSucess : function(response) {
        if(!response.responseText){
          this._onCheckFail();
          return;
        }

        var jsonData = Ext.decode(response.responseText);
        if(!jsonData.data){ // Contains a boolean indicating if the user can request the publication.            
            Ext.Msg.alert(this.publicationRequestText,this.existingPublicationRequestText);
            return;
        }

        this.showWindow(this._selectedLayer);
    },

    /** api: method[onEditorPanelAction]
     *  :param action: ``String`` action called in editor panel
     *  :param metadataInfo: ``Object`` optional parameter from the panel (UUID, for example)
     *
     *  Called when an action is pressed in the editor panel. 
     *  For this widget we need to save the layer changes in a gis_layer_publish_request entry
     *  calling to this.saveUrl
     */
    onEditorPanelAction: function (action, metadataInfo){
        if(action =="publicationRequest"){
            Ext.Msg.show({
                title: this.publicationRequestText,
                msg:this.confirmPublicationRequest,
                buttons: {
                  "ok": this.doPublicationRequestText,
                  "cancel": true
                },
                fn:function(btn) {
                  if(btn!="ok") {
                      return;
                  }
                  this._createPublicationRequest(metadataInfo);
                },
                scope:this
            });
           
        } else if(action =="cancel"){
            this.editorWindow.destroy();
        }
    },

    _createPublicationRequest : function(metadataInfo) {
        var targetFolder = this.requestData.activeAction == this.KNOWN_ACTIONS.NEW_LAYER ?
                 this.requestData.targetId : null;
            var targetLayer = this.requestData.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER ?
                this.requestData.targetId : null;
            this.jsonData.metadataUuid = metadataInfo.metadataUuid;
            this.jsonData.metadataId = metadataInfo.metadataId;

            this._createRequestMask = new Ext.LoadMask(Ext.getBody());
            this._createRequestMask.show();

            Ext.Ajax.request({
                url : this.target.defaultRestUrl + this.saveUrl,
                params:{
                    layerId: this.jsonData.layerSelected.getLayer().layerID,
                    layerName:  this.requestData.layerTitle,
                    metadataUrl: this.jsonData.metadataUuid,
                    metadataId: this.jsonData.metadataId,
                    targetFolder: targetFolder,
                    targetLayer: targetLayer
                },
                method: 'POST',

                success : this.handleSuccess,
                failure : this.handleFailure,
                scope : this
            });
    },

    handleSuccess: function(response){
        this._createRequestMask.hide();
        if(response.responseText){
            var jsonData = Ext.decode(response.responseText);
            if(!jsonData.success){
                this.handleFailure(jsonData);
            }else{
                var layer = this.jsonData.layerSelected.getLayer();
                if(!layer.metadata){
                    layer.metadata = {};
                }
               

                Ext.Msg.alert(this.publicationRequestText, this.savingRequestSuccessMsg);
                this.launchAction.setDisabled(true);

                this.editorWindow.destroy();
            }
        }
    },

    handleFailure: function(response){
        this._createRequestMask.hide();
        Ext.Msg.alert(this.publicationRequestText, this.savingRequestError);
    },

    onTargetSelected: function(node, clicked) {
        PersistenceGeo.tree.MakeLayerPublic.superclass.onTargetSelected.call(this,node, clicked);

        if(this.selectedTargetId && this.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER) {
            // We use the selected target layer's name as 'proposed' title for the updated layer.
            this.form.nameField.setValue(node.attributes.text);
        }
    }

});

Ext.preg(PersistenceGeo.tree.MakeLayerPublic.prototype.ptype, PersistenceGeo.tree.MakeLayerPublic);