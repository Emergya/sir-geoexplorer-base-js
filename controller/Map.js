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

Viewer.controller.Map = Ext.extend(Viewer.controller.Controller, {
    
    features: null,

    constructor: function(config) {

        Viewer.controller.Map.superclass.constructor.call(this, config);

        this.mapPanel = Viewer.getMapPanel();
    },

    getMapPanel: function() {
        return this.mapPanel;
    },

    getMap: function() {
        return this.mapPanel.map;
    },

    setDefaultZoom: function() {
        this.mapPanel.setDefaultZoom();
    },

    /**
     * Controls the map's select feature, register the layerSelected event
     * when the tool is activated.
     */
    toggleSelectFeature: function(state) {

        if (state === true) {
            window.app.on({
                layerselectionchange: this.activateSelectFeature,
                scope: this
            });
            this.activateSelectFeature(Viewer.getController('Layers').getSelectedLayer());
        } else {
            window.app.un('layerselectionchange', this.activateSelectFeature, this);
            this.deactivateSelectFeature();
        }
    },

    deactivateSelectFeature: function() {
        try {
            this.selectControl.unselectAll();
            this.selectControl.deactivate();
            this.mapPanel.map.removeControl(this.selectControl);
        } catch(e) {
        }
        this.selectFeatureActivated = false;
    },  

    activateSelectFeature: function(layerRecord) {

        var layer;

        try {
            layer = layerRecord.getLayer();
        } catch(e) {
            return;
        }

        // TODO: Currently only Vector layers are supported,
        // should implement this for other types.
        if (layer.CLASS_NAME != 'OpenLayers.Layer.Vector') {
            return;
        }

        this.deactivateSelectFeature();

        var layersController = Viewer.getController('Layers');

        this.selectControl = new OpenLayers.Control.SelectFeature(layer, {
            hover: false,
            clickout: true,
            toggle: true,
            multipleKey: 'ctrlKey',
            selectStyle: {
                fillColor: 'red'
            },
            onSelect: function(feature) {
                layersController.fireEvent('featureSelected', feature);
            },
            onUnselect: function(feature) {
                layersController.fireEvent('featureUnselected', feature);
            }
        });

        this.mapPanel.map.addControl(this.selectControl);
        this.selectControl.activate();
        this.selectFeatureActivated = true;
    },  

    getSelectedFeatures: function() {
        try {
            return this.selectControl.layer.selectedFeatures;
        } catch(e) {
            return new Array(); 
        }
    }

});
