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

Viewer.controller.Layers = Ext.extend(Viewer.controller.Controller, {
    
    constructor: function(config) {

        Viewer.controller.Layers.superclass.constructor.call(this, config);

        this.addEvents({
            layerBeforeSelected: true,
            layerSelected: true,
            featureSelected: true,
            featureUnselected: true
        });

        window.app.on({
            beforelayerselectionchange: function(layerRecord) {
                this.fireEvent('layerBeforeSelected', layerRecord.getLayer());
            },
            layerselectionchange: function(layerRecord) {
                this.fireEvent('layerSelected', layerRecord.getLayer());
            },
            scope: this
        });
    },

    create: function(properties) {

        
        var layer = null;
        var type = properties['type'];
        var constructor = this['_create_' + type];

        if (Ext.isFunction(constructor)) {
            layer = constructor(properties);
        }

        return layer;
    },

    _create_WMS: function(properties) {
        var layer = new OpenLayers.Layer.WMS(
            properties.name,
            properties.url,
            properties.params,
            properties.options
        );
        return layer;
    },

    _create_Vector: function(properties) {
        var layer = new OpenLayers.Layer.Vector(
            properties.name,
            Ext.apply(properties.options, {
                renderers: OpenLayers.Layer.Vector.prototype.renderers
            })
        );
        return layer;
    },

    getSelectedNode: function() {
        return Viewer.viewport.layerSelector.getSelectionModel().getSelectedNode();
    },

    getSelectedLayer: function() {
        var layer = null;
        try {
            layer = window.app.selectedLayer.getLayer();
        } catch(e) {}
        return layer;
    },

    selectNodeByPath: function(path) {
        Viewer.viewport.layerSelector.selectPath(path);
    },

    getSelectedFeatures: function(layer) {
        try {
            return this.getSelectedLayer().selectedFeatures;
        } catch(e) {
            return [];
        }
    },

    save: function(layer) {
    },

    createBufferForFeature: function(feature, radius, units) {

        var geomUnits = Viewer.getMapPanel().map.getUnits();

        var inPerDisplayUnit = OpenLayers.INCHES_PER_UNIT[units];
        var inPerMapUnit = OpenLayers.INCHES_PER_UNIT[geomUnits];

        radius *= (inPerDisplayUnit / inPerMapUnit);

        var format = new OpenLayers.Format.WKT();
        var reader = new jsts.io.WKTReader();
        var input = reader.read(format.write(feature));
        var buffer = input.buffer(radius);

        var parser = new jsts.io.OpenLayersParser();
        buffer = parser.write(buffer);

        return buffer;
    }
});
