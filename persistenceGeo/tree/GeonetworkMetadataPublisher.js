/*
 * GeoNetworkMetadataPublisher.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 *  class = GeoNetworkMetadataPublisher
 */
Ext.namespace("PersistenceGeo.tree");

/**
 * Class: PersistenceGeo.tree.GeonetworkMetadataViewer
 *
 * GN metadata publisher. See #87023
 *
 */
PersistenceGeo.tree.GeoNetworkMetadataPublisher = Ext.extend(PersistenceGeo.widgets.GeoNetworkTool, {

    /** api: ptype = pgeo_gnpublisher */
    ptype: "pgeo_gnpublisher",

    /** Tool default icon **/
    toolIconCls: 'gxp-icon-savelayers',

    /** i18n **/
    toolText: "Publish",
    toolTooltipText: "Make a publish request",
    toolWindowText: "Layer {0} publish request",
    formActionFieldText: "Target action",
    formNameFieldText: "Target name",
    formNameFieldValueText: "Name of the layer",
    metadataWindowText: "Metadata for layer publish request",
    metadataEditorTitle: "Metadata for layer publication",
    targetLayerWindowTitleText: "Layer to be updated",
    targetFolderWindowTitleText: "Target folder",
    validationErrorsTitle: "Validation errors",
    noLayerSelectedError: "A layer must be selected.",
    noValidActionSelectedError: "An action must be selected.",
    noValidTargetFolderError: "A target folder must be selected",
    noValidTargetLayerError: "A layer to be updated must be selected",
    noDesiredNameSetError: "A name for the layer to be published must be selected",


    /**
     * api: config[formActionFieldPosibleValues]
     *  ``Array`` Posible values for action field.
     *  @see ``KNOWN_ACTIONS``.
     */
    formActionFieldPosibleValues: ["Publish as new layer", "Update layer"],

    /** api: config[KNOWN_ACTIONS]
     *  ``Object`` Actions for this component: ``NEW_LAYER`` | ``UPDATE_LAYER``.
     */
    KNOWN_ACTIONS: {
        NEW_LAYER: 1,
        UPDATE_LAYER: 2
    },

    /** api: config[isUpdate]
     *  ``Boolean`` Indicate if this instance is an update or not.
     */
    isUpdate: false,

    /** Window sizes **/
    windowWidth: 400,
    windowHeight: 200,
    metadataWindowWidth: 800,
    metadataWindowHeight: 600,

    /** The window used to edit metadata will be stored here **/
    editorWindow: null,

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

        if (record && record.getLayer()) {
            var layer = record.getLayer();
            disable = !! layer.metadata && !! layer.metadata.metadataUuid;

            if (!disable && this.checkUserInfo) {
                // Obtain user info from persistenceGeoContext
                var userInfo = this.target.persistenceGeoContext.userInfo;
                if (!userInfo || !userInfo.id) {
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
    constructor: function(config) {

        // Call superclass constructor
        PersistenceGeo.tree.GeoNetworkMetadataPublisher.superclass.constructor.call(this, config);

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
        var topPos = (document.height - this.metadataWindowHeight) / 2;
        this.publishRequestWindowPos = [position[0] - this.windowWidth, topPos];
        this.metadataWindowPos = [position[0] - this.windowWidth + offset, topPos];
        this.targetWindowPos = [position[0] - this.windowWidth, topPos + this.windowHeight + 20];
        publishRequestWindow.setPosition(this.publishRequestWindowPos[0], this.publishRequestWindowPos[1]);

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
    closeAll: function() {
        if (!this.closing) {
            this.closing = true;
            if (this.publishRequestWindow) {
                this.publishRequestWindow.close();
                delete this.publishRequestWindow;
            }
            if (this.newMetadataWindow) {
                this.newMetadataWindow.close();
                delete this.newMetadataWindow;
            }
            if (this.targetWindow) {
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
            title: String.format(this.toolWindowText, layer.name),
            width: this.windowWidth,
            height: this.windowHeight,
            layout: 'fit',
            modal: false,
            items: this.getPanel(layer),
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

        if (this.isUpdate) {
            // Simple editor
            var layerUuid = layer.metadata.json.properties.metadataId;
            var metadataId = layer.metadata.json.properties.metadataId;
            this.newMetadataWindow = this.metadataEdit(metadataId, false, null, null, null, null, this.metadataWindowWidth, this.metadataWindowHeight); // TODO: W/H
        } else {
            // Create a window to choose the template and the group
            var newMetadataPanel = new PersistenceGeo.widgets.GeoNetworkNewMetadataPanel({
                getGroupUrl: catalogue.services.getGroups,
                catalogue: catalogue
            });

            this.newMetadataWindow = new Ext.Window({
                title: this.metadataWindowText,
                width: this.metadataWindowWidth,
                height: this.metadataWindowHeight,
                layout: 'fit',
                modal: false,
                items: newMetadataPanel,
                closeAction: 'hide',
                controller: this,
                constrain: true
            });
        }

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
            allFolders: true,
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
            "treenodeloaded" : this.onTreeNodeLoaded,
            scope: this
        });

        // Position of the window
        this.targetWindow.setPosition(this.targetWindowPos[0], this.targetWindowPos[1]);

        return this.targetWindow;
    },

    onTreeNodeLoaded : function(node, selectionModel) {

    },

    /**
     * private: method[onTargetSelected]
     * Method called when one target has been selected on tree folder window
     */
    onTargetSelected: function(node, clicked) {
        if (this.activeAction == this.KNOWN_ACTIONS.NEW_LAYER || node.leaf) {
            this.selectedTargetId = +node.id;
            if(this.selectedTargetId > PersistenceGeo.widgets.FolderTreePanel.prototype.LEAF_ID_OFFSET) {
                // We normalize layer's ids.
                this.selectedTargetId -= PersistenceGeo.widgets.FolderTreePanel.prototype.LEAF_ID_OFFSET;
              
            }
            this.selectedTargetId+=""; // Back to string.
        } else {
            // E.g.: the user select's a folder when should have selected a layer. 
            // We clear the selected target id so we get a validation error.
            this.selectedTargetId = null;
        }
    },

    /**
     * private: method[getPanel]
     * Obtain default form panel initialized.
     * TODO: Make all fields as select fields localized
     */
    getPanel: function(layer) {
		// We are creating a new window, so we reset the lock on tree initialization.
		this._treeInitialized = false;

        this.actionField = {
            xtype: 'radiogroup',
            fieldLabel: this.formActionFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
			ref: "actionField",
            items: [{
                boxLabel: this.formActionFieldPosibleValues[0],
                name: 'rb-auto',
                inputValue: this.KNOWN_ACTIONS.NEW_LAYER,
                checked: true
            }, {
                boxLabel: this.formActionFieldPosibleValues[1],
                name: 'rb-auto',
                inputValue: this.KNOWN_ACTIONS.UPDATE_LAYER
            }],
            listeners: {
                change: this.updateActionValue,
                scope: this
            }
        };

        var nameValue = this.formNameFieldValueText;

        if (layer && layer.name) {
            nameValue = layer.name;
        }

        this.nameField = new Ext.form.TextField({
            fieldLabel: this.formNameFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
			ref:"nameField",
            //validator: this.urlValidator.createDelegate(this),
            value: nameValue
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
    updateActionValue: function(radio, checked) {
		if(radio.getValue()) {
			this.activeAction = radio.getValue().inputValue;
        }
        // We don't clear the selected target id the first time
        // we enter the method, as if we are dealing with a layer update
        // we need to change the panel, and retain this value when this method is called.
        if(this._treeInitialized) {
            this.selectedTargetId = null;
            this.selectedTargetName = null;
        }

        this._treeInitialized = true;
        
        if (this.targetWindow) {
            this.closing = true;
            this.targetWindow.close();
            this.closing = false;
        }
        if (this.activeAction == this.KNOWN_ACTIONS.NEW_LAYER) {
            this.getTargetWindow(this.layerSelected, false).show();
        } else {
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
    validateForm: function() {

        var errors = [];

        if (!this.layerSelected) {
            errors.push(this.noLayerSelectedError);
        }


        if (!this.activeAction || (this.KNOWN_ACTIONS.NEW_LAYER != this.activeAction && this.KNOWN_ACTIONS.UPDATE_LAYER != this.activeAction)) {
            errors.push(this.noValidActionSelectedError);
        }

        if (!this.nameField || !this.nameField.getValue()) {
            this.nameField.isValid();
            errors.push(this.noDesiredNameSetError);
        }

        if (!this.selectedTargetId) {
            if (this.KNOWN_ACTIONS.NEW_LAYER == this.activeAction) {
                errors.push(this.noValidTargetFolderError);
            } else {
                errors.push(this.noValidTargetLayerError);
            }
        }



        if (errors.length > 0) {
            Ext.Msg.alert(this.validationErrorsTitle, errors.join('<br>'));
            return false;
        }

        this.requestData = {
            layerTitle: this.nameField.getValue(),
            targetId: this.selectedTargetId,
            activeAction: this.activeAction 
        };

        return true;
    },

    defaultCountry: 'España',

    /** private: attribute[PUBLISH_REQUEST_DATA_PREFIX]
     *  @see com.emergya.ohiggins.dto.LayerPublishRequestDto#toPropMap()
     */
    PUBLISH_REQUEST_DATA_PREFIX: "PUBLISH_REQUEST_DATA_",

    /** private: method[obtainCommonData]
     *  Obtain multi window form data
     */
    obtainCommonData: function() {
        // Init
        var layerUrl = this.layerSelected.getLayer().url;
        var nameLayer;
        var layerPublishRequestId = null;
        var metadataId = null;
        if (this.isUpdate) {
            var layer = this.layerSelected.getLayer();
            var properties = layer.metadata.json.properties
            //TODO: Handle errors!!!
            layerPublishRequestId =properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'ID'];
            nameLayer = properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'NOMBREDESEADO'];
            this.nameField.setValue(nameLayer);
            var updatedLayerId = properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'UPDATEDLAYERID'];
            if (updatedLayerId) {
				this.activeAction = this.KNOWN_ACTIONS.UPDATE_LAYER;
                this.selectedTargetId = updatedLayerId;
            } else {
				this.activeAction = this.KNOWN_ACTIONS.NEW_LAYER;
                this.selectedTargetId = properties[this.PUBLISH_REQUEST_DATA_PREFIX + 'PUBLISHEDFOLDER'];
            }

			// We select the appropiate radio button.
            this.form.actionField.setValue(this.activeAction);

            /*TODO: More data needed?
        	PUBLISH_REQUET_DATA_ACTUALIZACION: "false"
			PUBLISH_REQUET_DATA_ESTADO: "PENDIENTE"
			PUBLISH_REQUET_DATA_ID: "64658"
			PUBLISH_REQUET_DATA_NAME_PROPERTY: "nombredeseado"
			PUBLISH_REQUET_DATA_NOMBREDESEADO: "gn_test"
			PUBLISH_REQUET_DATA_PUBLISHEDFOLDER: "Otros"
			PUBLISH_REQUET_DATA_PUBLISH_REQUEST_DATA_PREFIX: "PUBLISH_REQUET_DATA_"
			PUBLISH_REQUET_DATA_RECURSOSERVIDOR: "http://sig-minen-apps.emergya.es/geoserver/wms"
			PUBLISH_REQUET_DATA_SERIALVERSIONUID: "-4222276053302896611"
			PUBLISH_REQUET_DATA_SOURCELAYERID: "82"
			PUBLISH_REQUET_DATA_SOURCELAYERNAME: "gn_test"
			PUBLISH_REQUET_DATA_TABLENAME: "gn_test_e1511745_3ddc_41dd_96e1_9deae50b46d5"
			PUBLISH_REQUET_DATA_UPDATEDLAYERPATH: ""
			*/
            metadataId = layer.metadata.json.properties.metadataId;
        } else {
            nameLayer = this.nameField.getValue();
        }
        this.jsonData = {
            // common data
            layerPublishRequestId: layerPublishRequestId,
            layerSelected: this.layerSelected,
            selectedTargetId: this.selectedTargetId,
            selectedTargetName: this.selectedTargetName,
            name: nameLayer,
            metadataId: metadataId,
            activeAction: this.activeAction,
            // Data to ovewrite metedata form @see PersistenceGeo.widgets.GeoNetworkEditorPanel
            formData: {
                // title for th layer
                title: nameLayer,
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
    getJsonData: function() {
        return this.jsonData;
    },

    /** api: method[metadataEdit]
     *  :param uuid: ``String`` Uuid of the metadata record to edit
     *
     *  Open a metadata editor.
     */
    metadataEdit: function(metadataId, create, group, child, n, templateName, width, height) {
        var jsonData = this.obtainCommonData();

        if (!this.isUpdate)
            this.closeAll();

        Ext.getCmp('metadata-panel') && Ext.getCmp('metadata-panel').destroy();

        var editorPanel = new PersistenceGeo.widgets.GeoNetworkEditorPanel({
            defaultViewMode: GeoNetwork.Settings.editor.defaultViewMode,
            catalogue: catalogue,
            selectionPanelImgPath: GN_URL + '/apps/js/ext-ux/images',
            controller: this,
            layout: 'border',
            utilityPanelCollapsed: this.isUpdate,
            panelVertical: !this.isUpdate,
            xlinkOptions: {
                CONTACT: true
            }
        });

        // W/H
        var mapPanelSize = this.target.mapPanel.getSize();
        if (!width) {
            width = mapPanelSize.width;
        }
        if (!height) {
            height = mapPanelSize.height
        }

        var editorWindow = new Ext.Window({
            title: this.metadataEditorTitle,
            items: [editorPanel],
            closeAction: 'close',
            cls: "gnMetadataEditorWindow",
            layout: "fit",
            width: width,
            height: height
        });

        editorWindow.show();
        editorPanel.init(metadataId, create, group, child);
        editorPanel.doLayout(false);

        this.editorWindow = editorWindow;

        return editorWindow;

    },

    /** api: method[onEditorPanelAction]
     *  :param action: ``String`` action called in editor panel
     *  :param arg1: ``Object`` optional parameter from the panel (UUID, for example)
     *
     *  Called when an action is pressed in the editor panel.
     */
    onEditorPanelAction: function(action, arg1) {}
});

Ext.preg(PersistenceGeo.tree.GeoNetworkMetadataPublisher.prototype.ptype, PersistenceGeo.tree.GeoNetworkMetadataPublisher);