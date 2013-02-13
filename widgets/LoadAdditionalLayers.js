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
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */

(function() {

var ADDITIONAL_LAYERS_URL = '/ohiggins-viewer/layers.php';

Viewer.dialog.LoadAdditionalLayers = Ext.extend(Ext.Window, {

    /**
     * TODO: The channel path must be readed from the left side
     * panel tree or the map. It's the path of the currently
     * selected channel.
     */
    channelPath: '/root/root_2/root_2_3/root_2_3_3',


    constructor: function(config) {

        Viewer.dialog.LoadAdditionalLayers.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_load_user_layers_window',
            title: 'Capas adicionales',
            width: 500,
            height: 400,
            layout: 'fit',
            closeAction: 'hide'
        }, config));

        this.on({
            beforerender: this.onBeforeRender,
            scope: this
        });
    },

    /**
     * This callback is fired when the tree loads the children of
     * a node.
     * It's used to expand the currently selected channel expanding
     * all of its parents if necesary.
     */
    onNodeLoaded: function(treeLoader, node) {

        // NOTE: This feature is not requiered at this moment,
        // maybe in the future.
        
        //var tokens = this.channelPath.substr(1).split('/');
        //var channel = this.tree.getNodeById(tokens[tokens.length-1]);

        //// If the channel is currently loaded expand it and
        //// and remove the load listener so this callback is
        //// never fired again.
        //if (channel !== undefined) {
        //    this.tree.removeListener('nodeLoaded', this.onNodeLoaded, this);
        //    this.tree.expandPath(channel.getPath());
        //    return;
        //}

        //var i = 0;
        //var l = tokens.length;
        //var lastChannel = null;

        //// Iterate the tree nodes from the root to the channel,
        //// if some node not exists expand its parent and exit
        //// the function.
        //while (i < l) {
        //    var path = '/' + tokens.slice(0, i+1).join('/');
        //    var channel = this.tree.getNodeById(tokens[i]);
        //    if (channel !== undefined) {
        //        lastChannel = channel;
        //    } else {
        //        this.tree.expandPath(lastChannel.getPath());
        //        return;
        //    }
        //    i++;
        //}

        // NOTE: This feature is not requiered at this moment,
        // maybe in the future.
    },

    onAddButtonClicked: function() {
        
        var checkedNodes = this.tree.getChecked('id');
        if (checkedNodes.length == 0) {
            return;
        }

        var layerList = '?layer_id[]=' + checkedNodes.join('&layer_id[]=');

        /**
         * Read layers from the server and parses them.
         * @userOrGroup: Not currently used. This informations goes in the URL.
         * @callback: The callback to call when the request is done.
         * @url: The url...
         */
        // TODO: Change the url to the correct one...
        PersistenceGeoParser.loadLayers(
            null,
            this.onLayersLoaded.createDelegate(this),
            Viewer.formatUrl(ADDITIONAL_LAYERS_URL + layerList)
        );
    },

    /**
     * Callback called when PersistenceGeoParser finish to load layers.
     * The layers are added to the map only if there aren't layers
     * with the same ID.
     */
    onLayersLoaded: function(layers, layerTree, rootFolder) {

        var aux_layers = [];

        for (var i=0, l=layers.length; i<l; i++) {
            var exists = this.map.getLayersBy('layerID', layers[i].layerID);
            if (exists.length == 0) {
                layers[i].metadata.isExtraLayer = true;
                aux_layers.push(layers[i]);
            }
        }

        this.map.addLayers(aux_layers);
        this.close();
    },

    onCancelButtonClicked: function() {
        this.close();
    },

    onBeforeRender: function() {

        var padding = 'padding: 10px 16px;';
        var border = 'border: 0px solid transparent;'
        
        this.tree = new AvailableLayersTree({
            flex: 1,
            listeners: {
                checkchange: function(node, checked) {
                    var checkedNodes = this.tree.getChecked();
                    this.btnAdd.setDisabled(checkedNodes.length == 0);
                },
                nodeLoaded: this.onNodeLoaded,
                scope: this
            }
        });

        var c = {
            xtype: 'form',
            layout: 'form',
            items: [
                this.tree
            ],
            buttons: [
                this.btnAdd = new Ext.Button({
                    text: 'Añadir',
                    disabled: true,
                    listeners: {
                        click: this.onAddButtonClicked,
                        scope: this
                    }
                }),
                this.btnCancel = new Ext.Button({
                    text: 'Cancelar',
                    listeners: {
                        click: this.onCancelButtonClicked,
                        scope: this
                    }
                })
            ]
        };

        this.add(c);
    }
});

var AvailableLayersTree = Ext.extend(Ext.tree.TreePanel, {

    constructor: function(config) {

        AvailableLayersTree.superclass.constructor.call(this, Ext.apply({
            border: false,
            autoScroll: true,
            loader: new Ext.tree.TreeLoader({
                dataUrl: Viewer.formatUrl(ADDITIONAL_LAYERS_URL),
                listeners: {
                    load: this.onNodeLoaded,
                    scope: this
                }
            }),
            root: {
                nodeType: 'async',
                text: 'Capas',
                expanded: true,
                id: 'root'
            }
        }, config));

        this.on({
            beforeappend: this.onBeforeAppend,
            scope: this
        });

        this.addEvents({
            nodeLoaded: true
        });
    },

    onBeforeAppend: function(tree, parent, node) {
        if (node.isLeaf()) {
            node.attributes.checked = false;
        }
    },

    onNodeLoaded: function(treeLoader, node, response) {
        this.fireEvent('nodeLoaded', treeLoader, node);
    }

});

})();
