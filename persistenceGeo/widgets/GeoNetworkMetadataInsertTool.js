/*
 * GeoNetworkMetadataInsertTool.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 * @required  GeoNetwork/GeoNetworkManager.js
 */

/** api: (define)
 *  module = PersistenceGeo.widgets
 *  class = GeoNetworkMetadataInsertTool
 */
Ext.namespace("PersistenceGeo.widgets");

/**
 * Class: PersistenceGeo.widgets.GeoNetworkMetadataInsertTool
 * 
 * Metadata insert  with GN 2.10 tool
 * 
 * @see http://geonetwork-opensource.org/manuals/2.10.0/eng/widgets/index.html
 * 
 */
PersistenceGeo.widgets.GeoNetworkMetadataInsertTool = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = pgeo_gnmetadatainsert */
    ptype: "pgeo_gnmetadatainsert",

    /** i18n **/
    insertText: "Insert metadata",
    insertTooltipText: "Insert metadata in a GeoNetwork instance",
    insertWindowText: "Layer {0} metadata insert",
    inserticonCls: '',

    /** Window size **/
    windowWidth: 800,
    windowHeight: 600,

    /** api: config[checkUserInfo]
     *  ``Boolean``
     *  Check user logged info to active this tool
     */
    checkUserInfo: false,

    /**
     * private: method[init] :arg target: ``Object`` The object initializing
     * this plugin.
     */
    init: function(target) {
        PersistenceGeo.widgets.GeoNetworkMetadataInsertTool.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

    },

    /** api: method[addActions]
     */
    addActions: function() {     

        var actions = PersistenceGeo.widgets.GeoNetworkMetadataInsertTool.superclass.addActions.apply(this, [{
                menuText: this.insertText,
                iconCls: this.inserticonCls,
                disabled: false,
                tooltip: this.insertTooltipText,
                handler: function() {
                    var record = this._selectedLayer;
                    if (record) {
                        this.showWindow(record);
                    }
                },
                scope: this
            }
        ]); 

        this.launchAction = actions[0];

        this.target.on("layerselectionchange", function(record) {
            this._selectedLayer = record;
            this.checkIfEnable(record);
        }, this);
        var enforceOne = function(store) {
            if(!!this.launchAction){
                this.launchAction.setDisabled(!this._selectedLayer || store.getCount() <= 1);
            }
        };
        this.target.mapPanel.layers.on({
            "add": enforceOne,
            "remove": enforceOne
        });

        return actions;
    },

    /**

     * private: method[showWindow]
     * Show a dialog
     */
    showWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        // @see GeoNetworkManager.js
        if(!catalogue){
            initGNManager();
        }
        
        var newMetadataWindow;
        // Create a window to choose the template and the group
        if (!newMetadataWindow) {
            var newMetadataPanel = new GeoNetwork.editor.NewMetadataPanel({
                        getGroupUrl: catalogue.services.getGroups,
                        catalogue: catalogue
                    });
            
            newMetadataWindow = new Ext.Window({
                title:  String.format(this.insertWindowText, layer.name),
                width: this.windowWidth,
                height: this.windowHeight,
                layout: 'fit',
                modal: true,
                items: newMetadataPanel,
                closeAction: 'hide',
                constrain: true,
                iconCls: 'addIcon'
            });
        }
        newMetadataWindow.show();
    },

    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  TODO: enable or disable with user and layer info
     */
    checkIfEnable: function(record) {

        var disable = false;

        this.launchAction.setDisabled(disable); 
    }

});

Ext.preg(PersistenceGeo.widgets.GeoNetworkMetadataInsertTool.prototype.ptype, PersistenceGeo.widgets.GeoNetworkMetadataInsertTool);