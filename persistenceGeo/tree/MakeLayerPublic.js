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
 * @required  persistenceGeo/widgets/GeoNetworkTool.js
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
PersistenceGeo.tree.MakeLayerPublic = Ext.extend(PersistenceGeo.widgets.GeoNetworkTool, {

    /** api: ptype = pgeo_makelayerpublic */
    ptype: "pgeo_makelayerpublic",

    /** i18n **/
    toolText: "Publish",
    toolTooltipText: "Make a publish request",
    toolWindowText: "Layer {0} publish request",
    formActionFieldText: "Target action",
    formNameFieldText: "Target name",
    formNameFieldValueText: "Name of the layer",
    metadataWindowText: "Metadata for layer {0} publish request",
    targetLayerWindowTitleText: "Target layer",
    targetFolderWindowTitleText: "Target folder",

    /** Tool default icon **/
    toolIconCls: 'gxp-icon-savelayers',

    /** api: config[KNOWN_ACTIONS]
     *  ``Object`` Actions for this component: ``NEW_LAYER`` | ``UPDATE_LAYER``.
     */
    KNOWN_ACTIONS:{
        NEW_LAYER: 1,
        UPDATE_LAYER: 2
    },

    /**
     * api: config[formActionFieldPosibleValues]
     *  ``Array`` Posible values for action field. 
     *  @see ``KNOWN_ACTIONS``.
     */
    formActionFieldPosibleValues: ["Publish as new layer", "Update layer"],

    /** Window sizes **/
    windowWidth: 400,
    windowHeight: 200,
    metadataWindowWidth: 800,
    metadataWindowHeight: 600,

    /** Selected target data **/
    selectedTargetId: null,
    selectedTargetName: null,
    layerSelected: null,

    /** Windows positions. Initilaized in showWindow function. **/
    publishRequestWindowPos: null,
    metadataWindowPos: null,
    targetWindowPos: null,

    /**
     * private: property[activeAction]
     * Action selected.
     *  @see ``KNOWN_ACTIONS``.
     */
    activeAction: null,

    /**
     * private: property[jsonData]
     * ``Object`` map with the form data
     */
    jsonData: null,

    /** api: config[checkUserInfo]
     *  ``Boolean``
     *  Check user logged info to active this tool. Default it's true
     */
    checkUserInfo: true,

    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Only enabled when the selected layer have metadata UUID
     */
    checkIfEnable: function(record) {

        var disable = true;

        if(record && record.getLayer()){
          var layer = record.getLayer();
          disable = !!layer.metadata && !!layer.metadata.metadataUuid;
         
            if (!disable && this.checkUserInfo) {
                // Obtain user info from persistenceGeoContext
                var userInfo = this.target.persistenceGeoContext.userInfo;
                if(!userInfo || !userInfo.id){
                    disable = true;
                } else {
                    // Only for the owned layers of not admin users
                    disable = userInfo.admin || !app.persistenceGeoContext.isOwner(layer);
                }
            }
        }

        this.launchAction.setDisabled(disable); 
    },

    /** private: method[constructor]
     *  Contructor method.
     */
    constructor: function (config) {

        // Call superclass constructor
        PersistenceGeo.tree.MakeLayerPublic.superclass.constructor.call(this, config);

        // Add default callbacks
        this.on({
            validate: this.validateForm,
            obtaindata: this.obtainCommonData,
            editorpanelaction: this.onEditorPanelAction,
            scope: this
        });

         // add any custom application events
        this.addEvents(
            /** api: event[obtaindata]
             *  Obtain multi window form data 
             *
             *  Returns:
             *
             *  Json data
             */
            "obtaindata",

            /** api: event[validate]
             *  Validate multi window form data
             *
             *  Returns:
             *
             *  True if the form data is valid or false otherwise
             */
            "validate",

            /** api: event[editorpanelaction]
             *  Called when an action in the editor panel is called
             */
            "editorpanelaction"
        );
    },

    /**

     * api: method[showWindow]
     * Show all windows of this component.
     */
    showWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();
        this.layerSelected = layerRecord;

        // Create and show first window
        var publishRequestWindow = this.getPublishRequestWindow(layerRecord);
        publishRequestWindow.show();

        // Position of the windows
        var position = publishRequestWindow.getPosition();
        var offset = publishRequestWindow.getWidth() + 20;
        var offsetY = (this.metadataWindowHeight - this.windowHeight) / 2;
        this.publishRequestWindowPos = [position[0] - this.windowWidth, position[1] - offsetY];
        this.metadataWindowPos = [position[0] - this.windowWidth + offset, position[1] - offsetY];
        this.targetWindowPos = [position[0] - this.windowWidth,  position[1] - offsetY + this.windowHeight + 20];
        publishRequestWindow.setPosition(this.publishRequestWindowPos[0],this.publishRequestWindowPos[1]);

        // Create and show auxiliary windows
        var metadataWindow = this.getMetadataWindow(layerRecord);
        var targetWindow = this.getTargetWindow(layerRecord, false);
        metadataWindow.show();
        targetWindow.show();

        this.activeAction = this.KNOWN_ACTIONS.NEW_LAYER;
    },

    /**
     * private: property[closing]
     * Auxiliary parameter to hide all windows
     */
    closing: false,

    /**
     * private: method[closeAll]
     * Close all windows of this component
     */
    closeAll: function(){
        if(!this.closing){
            this.closing = true;
            if(this.publishRequestWindow){
                this.publishRequestWindow.close();
                delete this.publishRequestWindow;
            }
            if(this.newMetadataWindow){
                this.newMetadataWindow.close();
                delete this.newMetadataWindow;
            }
            if(this.targetWindow){
                this.targetWindow.close();
                delete this.targetWindow;
            }
            this.selectedTargetId = null;
            this.selectedTargetName = null;
            this.closing = false;
        }
    },

    /**
     * private: method[getPublishRequestWindow]
     * Obtain publish request window
     */
    getPublishRequestWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        // Create a window 
        this.publishRequestWindow = new Ext.Window({
            title:  String.format(this.toolWindowText, layer.name),
            width: this.windowWidth,
            height: this.windowHeight,
            layout: 'fit',
            modal: false,
            items: this.getPanel(),
            closeAction: 'hide',
            constrain: true,
        });
        this.publishRequestWindow.on({
            "beforehide": this.closeAll,
            scope: this
        });

        return this.publishRequestWindow;
    },

    /**
     * private: method[getMetadataWindow]
     * Obtain metadata window
     */
    getMetadataWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        // Create a window to choose the template and the group
        var newMetadataPanel = new GeoNetwork.editor.NewMetadataPanel({
                    getGroupUrl: catalogue.services.getGroups,
                    catalogue: catalogue
                });
        
        this.newMetadataWindow = new Ext.Window({
            title:  String.format(this.metadataWindowText, layer.name),
            width: this.metadataWindowWidth,
            height: this.metadataWindowHeight,
            layout: 'fit',
            modal: false,
            items: newMetadataPanel,
            closeAction: 'hide',
            controller: this,
            constrain: true
        });
        this.newMetadataWindow.on({
            "beforehide": this.closeAll,
            scope: this
        });
        this.newMetadataWindow.setPosition(this.metadataWindowPos[0], this.metadataWindowPos[1]);

        return this.newMetadataWindow;
    },

    /**
     * private: method[getTargetWindow]
     * Obtain folder tree panel window to select a layer
     */
    getTargetWindow: function(layerRecord, showLayers) {
        var layer = layerRecord.getLayer();

        // Create a window
        var mapPanel = Viewer.getMapPanel();
        this.targetWindow = new PersistenceGeo.widgets.FolderTreeWindow({
            mapPanel: mapPanel,
            title: showLayers ? this.targetLayerWindowTitleText : this.targetFolderWindowTitleText,
            map: mapPanel.map,
            recursive: true,
            showLayers: showLayers,
            width: this.windowWidth,
            height: this.metadataWindowHeight - this.windowHeight - 20,
            modal: false,
            onlyFolders: !showLayers,
            leafAsCheckbox: false,
            persistenceGeoContext: this.target.persistenceGeoContext,
            cls: 'additional-layers-window'
        });
        this.targetWindow.on({
            "treenodeclick": this.onTargetSelected,
            "beforehide": this.closeAll,
            scope: this
        });

        // Position of the window
        this.targetWindow.setPosition(this.targetWindowPos[0], this.targetWindowPos[1]);

        return this.targetWindow;
    },

    /**
     * private: method[onTargetSelected]
     * Method called when one target has been selected on tree folder window
     */
    onTargetSelected: function(node, clicked){
        if(this.activeAction == this.KNOWN_ACTIONS.NEW_LAYER
            || node.leaf){
            this.selectedTargetId = node.id;
            this.selectedTargetName = node.text;   
        }
    },

    /**
     * private: method[getPanel]
     * Obtain default form panel initialized.
     * TODO: Make all fields as select fields localized
     */
    getPanel: function(layer){

        this.actionField = {
            xtype: 'radiogroup',
            fieldLabel: this.formActionFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            items: [
                {boxLabel: this.formActionFieldPosibleValues[0], name: 'rb-auto', inputValue: this.KNOWN_ACTIONS.NEW_LAYER, checked: true},
                {boxLabel: this.formActionFieldPosibleValues[1], name: 'rb-auto', inputValue: this.KNOWN_ACTIONS.UPDATE_LAYER}
            ],
            listeners: {
                change: this.updateActionValue,
                scope: this
            }
        };

        this.nameField = new Ext.form.TextField({
            fieldLabel: this.formNameFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            //validator: this.urlValidator.createDelegate(this),
            value: this.formNameFieldValueText
        });

        var items = [this.actionField, this.nameField];

        this.form = new Ext.form.FormPanel({
            items: items,
            border: false,
            labelWidth: 50,
            bodyStyle: "padding: 15px",
            autoWidth: true,
            height: 400
        });

        return this.form;
    },

    /**
     * private: method[updateActionValue]
     * Change action target
     */
    updateActionValue: function(radio, checked){
        this.activeAction = radio.getValue().inputValue;
        this.selectedTargetId = null;
        this.selectedTargetName = null;   
        if(this.targetWindow){
            this.closing= true;
            this.targetWindow.close();
            this.closing= false;
        }
        if(this.activeAction == this.KNOWN_ACTIONS.NEW_LAYER){
            this.getTargetWindow(this.layerSelected, false).show();
        }else{
            // this.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER
            this.getTargetWindow(this.layerSelected, true).show();
        }
    },

    /** api: method[validateForm]
     *  Validate multi window form data
     *
     *  Returns:
     *
     *  True if the form data is valid or false otherwise
     */
    validateForm: function(){
        return this.layerSelected && this.selectedTargetId && this.selectedTargetName 
            && this.nameField && this.nameField.getValue() && this.activeAction 
            && (this.KNOWN_ACTIONS.NEW_LAYER == this.activeAction 
                || this.KNOWN_ACTIONS.UPDATE_LAYER == this.activeAction);
    }, 

    defaultCountry: 'España',
    
    /** private: method[obtainCommonData]
     *  Obtain multi window form data 
     */
    obtainCommonData: function(){
        // Init
        var layerUrl = this.layerSelected.getLayer().url;
        this.jsonData = {
            // common data
            layerSelected: this.layerSelected,
            selectedTargetId: this.selectedTargetId,
            selectedTargetName: this.selectedTargetName,
            name: this.nameField.getValue(),
            activeAction: this.activeAction,
            // Data to ovewrite metedata form @see PersistenceGeo.widgets.GeoNetworkEditorPanel
            formData:{
                // title for th layer
                title: this.nameField.getValue(),
                // Contact info
                contact_name: this.target.persistenceGeoContext.userInfo.nombreCompleto,
                contact_group: this.target.persistenceGeoContext.userInfo.authority,
                contact_phone: this.target.persistenceGeoContext.userInfo.telefono,
                contact_mail: this.target.persistenceGeoContext.userInfo.email,
                contact_country: this.defaultCountry,
                // Author info
                author_name: this.target.persistenceGeoContext.userInfo.nombreCompleto,
                author_group: this.target.persistenceGeoContext.userInfo.authority,
                author_phone: this.target.persistenceGeoContext.userInfo.telefono,
                author_mail: this.target.persistenceGeoContext.userInfo.email,
                author_country: this.defaultCountry,
                // Online (download) info
                online_url: layerUrl,
                // Online (get map) url
                get_map_url: layerUrl
            }
        };
        return this.getJsonData();
    },

    /** api: method[getJsonData]
     *  Obtain multi window form data 
     *
     *  Returns:
     *
     *  Json data
     */
    getJsonData: function(){
        return this.jsonData;
    },

    /** api: method[metadataEdit]
     *  :param uuid: ``String`` Uuid of the metadata record to edit
     *
     *  Open a metadata editor.
     */
    metadataEdit: function(metadataId, create, group, child){
        var jsonData = this.obtainCommonData();
        this.closeAll();

        Ext.getCmp('metadata-panel') && Ext.getCmp('metadata-panel').destroy();

        var editorPanel = new PersistenceGeo.widgets.GeoNetworkEditorPanel({
            defaultViewMode : GeoNetwork.Settings.editor.defaultViewMode,
            catalogue : catalogue,
            selectionPanelImgPath: GN_URL + '/apps/js/ext-ux/images',
            controller: this,
            layout : 'border',
            xlinkOptions : {
                CONTACT : true
            }
        });
        
        var mapPanelSize = this.target.mapPanel.getSize();

        var editorWindow = new Ext.Window({
            title: "Metadata editor", items:[editorPanel],
            closeAction: 'close',
            width: mapPanelSize.width,
            height: mapPanelSize.height
        });

        editorWindow.show();
        editorPanel.init(metadataId, create, group, child);
        editorPanel.doLayout(false);

        //editorPanel.initWithController(this);

    },

    saveUrl: '/persistenceGeo/saveLayerPublishRequest',

    onEditorPanelAction: function (action, arg1){
        console.log("Action --> "+action);
        if(action == "finish"){

            var targetFolder = this.jsonData.activeAction == this.KNOWN_ACTIONS.NEW_LAYER ?
                this.jsonData.selectedTargetId : null;
            var targetLayer = this.jsonData.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER ?
                this.jsonData.selectedTargetId : null;
            this.jsonData.metadataUuid = arg1;
            Ext.Ajax.request({
                url : this.target.defaultRestUrl + this.saveUrl,
                params:{
                    layerId: this.jsonData.layerSelected.getLayer().layerID,
                    layerName: this.jsonData.name,
                    metadataUrl: this.jsonData.metadataUuid,
                    targetFolder: targetFolder,
                    targetLayer: targetLayer
                },
                method: 'POST',
                success : this.handleSuccess,
                failure : this.handleFailure,
                scope : this
            });
        }
    },

    handleSuccess: function(response){
        if(response.responseText){
            var jsonData = Ext.decode(response.responseText);
            if(!jsonData.success){
                this.handleFailure(jsondata);
            }else{
                var layer = this.jsonData.layerSelected.getLayer();
                if(!layer.metadata){
                    layer.metadata = {};
                }
                layer.metadata.metadataUuid = this.jsonData.metadataUuid;
            }
        }
        console.log(response);
    },

    handleFailure: function(response){

    },

});

Ext.preg(PersistenceGeo.tree.MakeLayerPublic.prototype.ptype, PersistenceGeo.tree.MakeLayerPublic);