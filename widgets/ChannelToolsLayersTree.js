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
 * Author: Alejandro Díaz Torres <adiaz@emergya.com>
 */

(function() {

var ADDITIONAL_LAYERS_URL = '{0}/persistenceGeo/treeServiceMap';

var NODE_TYPES = {
    FOLDER: 'FolderDto',
    CHANNEL_ROOT: 'channelsRoot',
    ZONES_ROOT: 'zonesRoot',
    LAYER: "LayerDto"
};

var FILTER_TYPES = {
    ALL_CHANNEL_IN_ZONES: 'ALL_CHANNEL_IN_ZONES',
    SHOW_FOLDER_LAYERS: 'SHOW_FOLDER_LAYERS',
    HIDE_IPT_CHANNELS: 'HIDE_IPT_CHANNELS'
};

Viewer.widgets.ChannelToolsLayersTree = Ext.extend(Ext.tree.TreePanel, {

    showLayers: false,
    // Channels node
    channelsNode: null,
    // zones node
    zonesNode: null,
    // rest component
    restBaseUrl: "rest",

    /** i18n **/
    channelsNodeText: 'Channels',
    zonesNodeText: 'Zones',

    constructor: function(config) {

        Ext.apply(this, config);

        var rootNode = new Ext.tree.TreeNode({
            id: 'root',
            text: 'Root',
            expanded: true
        });

        var rootFilter = null;
        var zonesFilter = FILTER_TYPES.ALL_CHANNEL_IN_ZONES + ',' + FILTER_TYPES.HIDE_IPT_CHANNELS;
        if(this.showLayers){
            rootFilter = FILTER_TYPES.SHOW_FOLDER_LAYERS;
            zonesFilter += "," + FILTER_TYPES.SHOW_FOLDER_LAYERS;
        }

        // Canales
        rootNode.appendChild(this.channelsNode = new Ext.tree.TreeNode({
            id: 'channel-node',
            text: this.channelsNodeText,
            leaf: false,
            type:  NODE_TYPES.CHANNEL_ROOT,
            filter: rootFilter,
            expanded: true
        }));
        // Zone nodes
        rootNode.appendChild(this.zonesNode = new Ext.tree.TreeNode({
            id: 'zone-node',
            filter: zonesFilter,
            text: this.zonesNodeText,
            type: NODE_TYPES.ZONES_ROOT,
            leaf: false,
            expanded: true
        }));

        Viewer.widgets.ChannelToolsLayersTree.superclass.constructor.call(this, Ext.apply({
            border: false,
            autoScroll: true,
            loader: new Ext.tree.TreeLoader({
                dataUrl: String.format(ADDITIONAL_LAYERS_URL, this.restBaseUrl),
                nodeParameter: 'node',
                listeners:{
                    beforeload: function(treeLoader, node) {
                        if (node.attributes.type !== undefined) {
                            treeLoader.baseParams.type = node.attributes.type;
                        }
                        if (node.attributes.filter !== undefined) {
                            treeLoader.baseParams.filter = node.attributes.filter;
                        } else {
                            delete treeLoader.baseParams.filter;
                        }
                    },
                    load: function(treeLoader, node, action){
                        var json = Ext.util.JSON.decode(action.responseText);
                        for(var i = 0; i < json.results; i++){
                            //console.log(json[i]);
                            node.appendChild(new Ext.tree.TreeNode({
                                id: json.data[i].id,
                                text: json.data[i].text,
                                leaf: json.data[i].leaf || !this.showLayers,
                                type: json.data[i].type,
                                data: json.data[i].data
                            }));
                        }
                    },
                    scope: this
                }
            }),
            root: rootNode,
            rootVisible: false
        }, config));

        this.on({
            beforeappend: this.onBeforeAppend,
            scope: this
        });

        this.addEvents({
            nodeLoaded: true
        });
    },

    reload: function() {
        this.loader.load(this.zonesNode, function() {}, this);
        this.loader.load(this.channelsNode, function() {}, this);
    },

    onBeforeAppend: function(tree, parent, node) {

        if(!node.isLeaf()
            && this.showLayers){
            this.loader.load(node, function() {}, this);
        }
        if (node.attributes.type == NODE_TYPES.LAYER) {
            node.attributes.checked = false;
        }
    },

    onNodeLoaded: function(treeLoader, node, response) {
        this.fireEvent('nodeLoaded', treeLoader, node);
    }

});

Ext.reg('vw_channel_tools_layers_tree', Viewer.widgets.ChannelToolsLayersTree);

})();
