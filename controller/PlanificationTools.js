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

Viewer.controller.PlanificationTools = Ext.extend(Viewer.controller.Controller, {

    restBaseUrl: "rest",
    persistenceGeoContext: null,

    layersWindow: null,
    rulesWindow: null,

    // We will increase the IPT layer id by this amount  so it don't collide with existing public layers in the TOC. HACKFIX for #83417.
    magicNumber: 10000000,

    addedLayers: {
        _data: {},
        add: function(layer) {
            this._data[layer.layerID] = layer;
        },
        remove: function(layerId) {
            delete this._data[layerId];
        },
        removeAll: function(layerId) {
            this._data = {};
        },
        get: function(layerId) {
            return this._data[layerId] || null;
        },
        getAll: function() {
            var layers = [];
            for (var o in this._data) {
                layers.push(this._data[o]);
            }
            return layers;
        }
    },

    constructor: function(config) {

        this.mapPanel = Viewer.getMapPanel();
        this.map = this.mapPanel.map;
        this.persistenceGeoContext = app.persistenceGeoContext;

        Viewer.controller.PlanificationTools.superclass.constructor.call(this, config);

        this.restBaseUrl = this.persistenceGeoContext.defaultRestUrl;

        this.layersWindow = new Viewer.dialog.PlanificationToolsLayersWindow({
            restBaseUrl: this.restBaseUrl,
            listeners: {
                checkChanged: this.onTreeNodeCheckChanged,
                beforehide: this.onLayersWindowBeforeHide,
                scope: this
            }
        });

        this.rulesWindow = new Viewer.dialog.PlanificationToolsRulesWindow();
    },

    isVisible: function() {
        return this.layersWindow.isVisible() || this.rulesWindow.isVisible();
    },

    show: function() {
        this.layersWindow.show();
        this.rulesWindow.show();
        var position = this.layersWindow.getPosition();
        var offset = this.layersWindow.getWidth() + 20;
        this.rulesWindow.setPosition(position[0] + offset, position[1]);
    },

    hide: function() {
        this.layersWindow.hide();
        this.rulesWindow.hide();
    },

    /**
     * Callback called when the user check/uncheck a node checkbox.
     * When the user checks a node layer is added to the map and
     * the list of style's rules is loaded.
     *
     * NOTE: A maximun of 3 nodes are allowed to be checked at a time.
     */
    onTreeNodeCheckChanged: function(node, checked, checkedNodes) {

        // Uncheck the node if there are already 3 nodes checked.
        if (checkedNodes.length > 3) {
            node.ui.toggleCheck();
            node.attributes.checked = false;
            return;
        }

        if (checked === false) {
            var layer = this.addedLayers.get(node.id+this.magicNumber);
            if (layer !== null) {
                this.removeLayersFromMap([layer]);
                this.addedLayers.remove(node.id);
            }
        } else {
            this.addCheckedLayer(node.attributes.data);
            this.rulesWindow.show();
        }
    },

    addCheckedLayer: function(layerData) {

        var layer = this.persistenceGeoContext.getLayerFromData(layerData);
        this.onLayersLoaded([layer], null, null);
        this.addedLayers.add(layer);
    },

    /**
     * Callback called when PersistenceGeoParser finish to load layers.
     * The layers are added to the map only if there aren't layers
     * with the same ID.
     */
    onLayersLoaded: function(layers, layerTree, rootFolder) {

        var countLayers = layers.length;

        for (var i = 0, l = countLayers; i < l; i++) {
            // FIXHACK for #83417: We increase the id so it doesn't conflict with public layers that might be loaded.
            layers[i].layerID+=this.magicNumber;

            var exists = this.map.getLayersBy('layerID', layers[i].layerID);
            if (exists.length === 0) {
                // The layer isn't currently added.

                var layer = layers[i];
                layer.visibility = true;
                layer.displayInLayerSwitcher = false;

                var layerName = layer.name.split(':');
                if (layerName.length > 1) {
                    layer.layerWorkspace = layerName[0];
                    layer.layerName = layerName[1];
                } else {
                    layer.layerWorkspace = '';
                    layer.layerName = layer.name;
                }

                this.rulesWindow.addTab(layer, function(status) {

                    if (status === true) {
                        this.map.addLayers([layer]);
                        this.addedLayers.add(layer);
                    }

                    countLayers--;

                }.createDelegate(this));
            }
        }
    },

    removeLayersFromMap: function(layers) {
        for (var i = 0, l = layers.length; i < l; i++) {
            try{
                this.map.removeLayer(this.map.getLayersByName(layers[i].name)[0]);
            }catch (e){
                console.error("error cleaning layers!");
            }
            this.rulesWindow.removeTab(layers[i]);
        }
    },

    onLayersWindowBeforeHide: function() {
        this.removeLayersFromMap(this.addedLayers.getAll());
        this.addedLayers.removeAll();
        this.rulesWindow.hide();
    }
});