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
 * Author: Alejandro Díaz <adiaz@emergya.com>
 */

Viewer.dialog.ChannelTools = Ext.extend(Ext.Window, {

    /** i18n **/
    titleText: 'Thematic Channels',
    loadText: 'Load',
    closeText: 'Close',
    folderWindowTitleText: 'Folders',

    /** api: config[showZones]
     *  ``Boolean``
     *  Show zones node.
     */
    showZones: true,
     
    /** api: config[track]
     *  ``Boolean``
     *  Send a call to stats module to track this component.
     */
    track: true,

    showLayers: false,
    restBaseUrl: "rest",

    LOAD_CHANNEL_URL: '{0}/persistenceGeo/loadFoldersById/',

    persistenceGeoContext: null,

    loadButton: null,
    selectedChannel: null,


    constructor: function (config) {

        Viewer.dialog.ChannelTools.superclass.constructor.call(this, Ext.apply({
            title: config.showLayers ? this.folderWindowTitleText : this.titleText,
            width: 500,
            height: 400,
            layout: 'fit',
            closeAction: 'hide',
            bodyCssClass: 'vw-channel-window',
            cls: 'channel-tools-window'
        }, config));

        this.on({
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        });

        this.restBaseUrl = this.persistenceGeoContext.defaultRestUrl;
        this.LOAD_CHANNEL_URL = String(this.LOAD_CHANNEL_URL, this.restBaseUrl);
    },

    onBeforeRender: function () {
        this.layersTree = new PersistenceGeo.widgets.FolderTreePanel({
            restBaseUrl: this.restBaseUrl,
            recursive: this.showLayers,
            rootNodeText:this.titleText,
            rootVisible: !this.showLayers,
            folderType: this.showLayers 
                ? PersistenceGeo.widgets.FolderTreePanel.prototype.KNOWN_FOLDER_TYPES.DEFAULT_TYPE: // show folders in root when show layers!!
                null,
            showVirtualFolder: this.showLayers,
            listeners: {
                click: this.onTreeNodeClick,
                scope: this
            }
        });

        this.add(this.layersTree);
        this.addButton(this.loadButton = new Ext.Button({
            text: this.loadText,
            disabled: !this.showLayers,
            listeners: {
                click: this.onLoadButtonClicked,
                scope: this
            }
        }));
        this.addButton(new Ext.Button({
            text: this.closeText,
            listeners: {
                click: this.onCancelButtonClicked,
                scope: this
            }
        }));
    },

    onCancelButtonClicked: function () {
        this.hide();
    },

    _onShow: function () {
        this.layersTree.reload();
        this.loadButton.setDisabled(!this.showLayers);
    },

    showLoading: function (show) {
        //TODO: Show a loading mask...
    },

    onTreeNodeClick: function (node, checked) {
        if (!this.showLayers) {
            if (node.isLeaf()) {
                this.selectedChannel = node.id - PersistenceGeo.widgets.FolderTreePanel.prototype.LEAF_ID_OFFSET;
                this.selectedChannelName = node.text;
                this.loadButton.enable();
            } else {
                this.loadButton.disable();
            }
        } 
    },

    addedLayers: [],

    clearLayers: function () {
        for (var i = 0; i < this.addedLayers.length; i++) {
            try {
                this.persistenceGeoContext.map.removeLayer(this.addedLayers[i]);
            } catch (e) {
                // nothing to do
            }
        }
        this.addedLayers = [];
    },

    onLoadButtonClicked: function() {
        if (this.showLayers) {

            var alreadyAddedCount = 0;

            var checkedNodes = this.layersTree.getChecked();
            for (var i = 0; i < checkedNodes.length; i++) {
                var layer = this.persistenceGeoContext.getLayerFromData(checkedNodes[i].attributes.data);

                if(this._checkAlreadyAdded(layer)) {
                    // The layer was already added as an overlay, so we won't readd it.
                    alreadyAddedCount++;                    
                    continue;
                }

                layer.groupLayers = null;
                layer.groupLayersIndex = null;
                this.persistenceGeoContext.map.addLayer(layer);
                layer.setVisibility(true);
                this.addedLayers.push(layer);
            }

           
            var addedLayersCount = checkedNodes.length-alreadyAddedCount;
            var msg;
            if(alreadyAddedCount>0) {
                if(addedLayersCount==0) {
                    msg="No se añadió ninguna capa, ya que todas las seleccionadas ya estaban presentes."
                } else if(addedLayersCount == 1) {
                    msg="Se añadió sólo una capa, el resto de las seleccionadas ya estaban presentes."
                } else {
                    msg="Se añadieron "+addedLayersCount+" capas, el resto de las seleccionadas ya estaban presentes."
                }
            } else {
                if(addedLayersCount == 1) {
                    msg="Se añadió la capa seleccionada."
                } else {
                    msg="Se añadieron las "+addedLayersCount+" capas seleccionadas."
                }
            }

            Ext.Msg.alert("",msg);
            

        } else {
            if ( !! this.selectedChannel) {
                this.clearLayers();

                if(this.track){
                    Viewer.trackUrl('channels/' + this.selectedChannelName);
                }
                this.persistenceGeoContext.loadChannelWithFilters(this.selectedChannel, this.selectedChannelName,[
                    "ONLY_CHANNEL_MARK","RECURSIVE_FOLDER_LAYERS_MARK"]);
            }
        }
    },

    _checkAlreadyAdded : function(layer) {
        // We search the layer in the existing overlay layers. If it exists, we won't add it.
        for(var layerIdx = 0; layerIdx < app.mapPanel.map.layers.length; layerIdx++) {
            var existingLayer =  app.mapPanel.map.layers[layerIdx];
            var layerInOverlaysGroup = typeof(existingLayer.groupID)!="undefined" && !existingLayer.groupID;
            var sameIds = existingLayer.layerID && existingLayer.layerID == layer.layerID;

            if(layerInOverlaysGroup && sameIds) {
                // We make the layer visible.
                existingLayer.setVisibility(true);

                // We won't add the layer, as it's already added.                
                return true;
            }

        }
        return false;

    }


});
