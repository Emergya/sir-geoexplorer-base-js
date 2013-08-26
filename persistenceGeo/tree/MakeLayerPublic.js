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

        if(this.activeAction == this.KNOWN_ACTIONS.NEW_LAYER){
        }
        console.log("here");
        this.selectedTargetId = node.id;
        this.selectedTargetName = node.text;
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
        if(this.activeAction == this.KNOWN_ACTIONS.NEW_LAYER){
            if(this.targetWindow){
                this.closing= true;
                this.targetWindow.close();
                this.closing= false;
            }
            this.getTargetWindow(this.layerSelected, false).show();
        }else{
            // this.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER
            if(this.targetWindow){
                this.closing= true;
                this.targetWindow.close();
                this.closing= false;
            }
            this.getTargetWindow(this.layerSelected, true).show();
        }
    }

});

Ext.preg(PersistenceGeo.tree.MakeLayerPublic.prototype.ptype, PersistenceGeo.tree.MakeLayerPublic);