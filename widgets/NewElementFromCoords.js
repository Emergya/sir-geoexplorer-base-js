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

Viewer.dialog.NewElementFromCoords = Ext.extend(Ext.Window, {

    TOOL_POINT: 'POINT',
    TOOL_LINE: 'LINE',
    TOOL_POLYGON: 'POLYGON',

    STATE_NONE: 0,
    STATE_EDITING: 1,

    ACTION_HIDE: 0,
    ACTION_CLEAR: 1,

    currentState: null,
    activeLayer: null,
    previousFeatures: null,

    constructor: function(config) {

        this.currentState = this.STATE_NONE;

        this.listeners = {
            beforehide: this.onBeforeHide,
            beforerender: this.onBeforeRender,
            scope: this
        };

        this.layerController = Viewer.getController('Layers');

        Viewer.dialog.NewElementFromCoords.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_default_searches_window',
            title: 'Nuevo elemento a partir de coordenadas',
            width: 380,
            height: 400,
            closeAction: 'hide',
            layout: 'fit'
        }, config));

        this.layerController.on({
            layerBeforeSelected: this.onLayerBeforeSelected,
            scope: this
        });
    },

    /**
     * When the current window is shown clean
     * the previous data.
     */
    onShow: function() {
        this.searchByCoordinates.clear();
        this.changeActiveLayer(this.layerController.getSelectedLayer());
        this.currentState = this.STATE_NONE;
    },

    /**
     * This is a callback for the 'beforeclick' event of the
     * layer selector tree.
     * If the active layer hasn't new features changes the active layer.
     * Otherwise shows a dialog and ask for save or discard the new features.
     */
    onLayerBeforeSelected: function(layer) {

        if (this.hidden) {
            return true;
        }

        var cancel;
        try {
            cancel = !(layer.metadata.geometries.length > 0);
        } catch(e) {
            cancel = true;
        }

        if (cancel === true) {
            return false;
        }


        if (this.currentState == this.STATE_NONE) {
            this.changeActiveLayer(layer);

        } else {

            this.askSaveFeatures(this.ACTION_CLEAR, layer);
            return false;
        }
    },

    /**
     * If the active layer has new features ask for save or discard
     * them before close the current window.
     */
    onBeforeHide: function() {
        if (this.currentState == this.STATE_EDITING) {
            this.askSaveFeatures(this.ACTION_HIDE);
            return false;
        }
    },

    getCurrentGeometries: function() {
        try {
            return this.activeLayer.metadata.geometries[0];
        } catch (e) {
            return null;
        }
    },

    getGeometryLabel: function(geometry) {
        var labels = {};
        labels[this.TOOL_POINT] =  'Punto';
        labels[this.TOOL_LINE] = 'Línea';
        labels[this.TOOL_POLYGON] = 'Polígono';
        return labels[geometry] || null;
    },

    /**
     * Changing the active layer means to clean up the
     * previous layer data.
     * Stores the features the new layer currently has.
     */
    changeActiveLayer: function(layer) {

        this.activeLayer = layer;
        this.previousFeatures = layer.features;
        this.pointStore.removeAll();
        this.pointStore.commitChanges();
        this.lblGeometryInfo.setText(this.getGeometryLabel(this.getCurrentGeometries()));
        this.btnSave.disable();
    },

    /**
     * This is the callback for the Yes/No/Cancel dialog.
     * It saves or discards the changes in the active layer
     * and executes an action, closes the current window
     * or selects a new layer.
     */
    askSaveFeaturesCallback: function(buttonId, inputText, options, action, layer) {

        if (buttonId == 'yes') {

            this.currentState = this.STATE_NONE;
            this.layerController.save(this.activeLayer);

        } else if (buttonId == 'no') {

            this.currentState = this.STATE_NONE;
            this.activeLayer.removeAllFeatures();

        } else  {
            return;
        }

        if (action == this.ACTION_CLEAR) {

            //this.layerController.selectNodeByPath(newNode.getPath());
            this.changeActiveLayer(layer);

        } else if (action == this.ACTION_HIDE) {

            this.hide();
        }
    },

    /**
     * Shows a Yes/No/Cancel dialog when the user tries to close the current
     * window or tries to select another layer and there are pending
     * changes in the active layer.
     */
    askSaveFeatures: function(action, layer) {

        Ext.Msg.show({
            title: '¿Guardar cambios en la capa?',
            msg: 'La capa activa tiene cambios sin guardar, ¿Desea guardarlos ahora?',
            buttons: Ext.Msg.YESNOCANCEL,
            fn: this.askSaveFeaturesCallback.createDelegate(this, [action, layer], true),
            icon: Ext.MessageBox.QUESTION
        });
    },

    /**
     * Called when the Add button in the coordinates calculator is clicked.
     * Adds a new point to the Store object used by the grid.
     */
    onPointAdded: function(coords) {

        if (this.activeLayer === null) {
            return;
        }

        this.currentState = this.STATE_EDITING;

        var point = coords.getPoint(this.map.getProjectionObject());
        var record = new this.pointStore.recordType({
            lat: point.lat,
            lon: point.lon
        });
        this.pointStore.add(record);
    },

    /**
     * Called when the Remove button in the grid is clicked.
     * Removes a point from the Store object used by the grid.
     */
    onPointRemoved: function(grid, rowIndex, columnIndex, evt) {

        if (this.activeLayer === null) {
            return;
        }

        if (columnIndex == 2 /*grid.getColumnModel().getIndexById('deleter')*/) {
            var record = grid.getStore().getAt(rowIndex);
            grid.getStore().remove(record);
            grid.getView().refresh();
        }
    },

    /**
     * This is a callback of the store object used by the grid.
     * It's called when a point is added or removed from that store.
     * Redraws the features formed by the points in the active layer
     * having in mind the posible features that layer has previously.
     */
    onPointListUpdated: function(store, record, index) {

        var geometry = this.getCurrentGeometries();
        var features = [];

        var style_blue = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        style_blue.strokeColor = 'blue'; 
        style_blue.fillColor = 'blue';

        if (geometry == this.TOOL_POINT) {

            this.pointStore.each(function(record) {
                var point = new OpenLayers.Geometry.Point(record.get('lon'), record.get('lat'));
                var pointFeature = new OpenLayers.Feature.Vector(point, null, style_blue);
                features.push(pointFeature);
            }, this);

        } else if (geometry == this.TOOL_LINE) {

            var points = [];

            this.pointStore.each(function(record) {
                points.push(new OpenLayers.Geometry.Point(record.get('lon'), record.get('lat')));
            }, this);

            var line = new OpenLayers.Geometry.LineString(points);
            var lineFeature = new OpenLayers.Feature.Vector(line, null, style_blue);
            features.push(lineFeature);

        } else if (geometry == this.TOOL_POLYGON) {

            var points = [];

            this.pointStore.each(function(record) {
                points.push(new OpenLayers.Geometry.Point(record.get('lon'), record.get('lat')));
            }, this);
        
            var lring = new OpenLayers.Geometry.LinearRing(points);
            var polygon = new OpenLayers.Geometry.Polygon([lring]);
            var polygonFeature = new OpenLayers.Feature.Vector(polygon, null, style_blue);
            features.push(polygonFeature);

        } else {
            // No tool selected?
            return false;
        }

        this.activeLayer.removeAllFeatures();
        this.activeLayer.addFeatures(features.concat(this.previousFeatures));

        this.btnSave.enable();
    },

    onSaveButtonClicked: function() {
        this.currentState = this.STATE_NONE;
        this.layerController.save(this.activeLayer);
        this.btnSave.disable();
        this.previousFeatures = this.activeLayer.features;
    },

    onCancelButtonClicked: function() {
        this.currentState = this.STATE_NONE;
        this.hide();
        this.activeLayer.removeAllFeatures();
        this.activeLayer.addFeatures(this.previousFeatures);
    },

    onBeforeRender: function() {

        this.lblGeometryInfo = new Ext.form.Label({
            text: ''
        });

        this.btnSave = new Ext.Button({
            text: 'Guardar',
            disabled: true,
            listeners: {
                click: this.onSaveButtonClicked,
                scope: this
            }
        });

        this.btnCancel = new Ext.Button({
            text: 'Cancelar',
            listeners: {
                click: this.onCancelButtonClicked,
                scope: this
            }
        });

        this.pointStore = new Ext.data.ArrayStore({
            autoDestroy: true,
            idIndex: 0,
            fields: [
                { name: 'lat', type: 'float' },
                { name: 'lon', type: 'float' }
            ],
            listeners: {
                add: this.onPointListUpdated,
                remove: this.onPointListUpdated,
                scope: this
            }
        });

        var padding = 'padding: 10px 16px;';
        var border = 'border: 0px solid transparent;'

        var c = {
            xtype: 'panel',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [{
                    xtype: 'panel',
                    height: 40,
                    bodyStyle: padding + border,
                    items: this.lblGeometryInfo
                },
                this.searchByCoordinates = new Viewer.widgets.SearchByCoordinates({
                    mapPanel: this.mapPanel,
                    map: this.map,
                    height: 130,
                    buttonUtmLabel: 'Añadir',
                    buttonLonLatLabel: 'Añadir',
                    buttonDecimalLabel: 'Añadir',
                    listeners: {
                        buttonUtmClicked: this.onPointAdded.createDelegate(this),
                        buttonLonLatClicked: this.onPointAdded.createDelegate(this),
                        buttonDecimalClicked: this.onPointAdded.createDelegate(this)
                    }
                }),
                new Ext.grid.GridPanel({
                    store: this.pointStore,
                    colModel: new Ext.grid.ColumnModel({
                        defaults: {
                            width: 120,
                            sortable: false
                        },
                        columns: [
                            { header: 'Latitud' },
                            { header: 'Longitud' },
                            {
                                header: '',
                                width: 50,
                                renderer: function(v, p, record, rowIndex) {
                                    return '<div class="vw-remove-grid-button">Remove</div>';
                                    //return '<input type="button" value="Remove" class="vw_delete_grid_button" />';
                                }
                            }
                        ]
                    }),
                    viewConfig: {
                        forceFit: true
                    },
                    sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
                    flex: 1,
                    frame: false,
                    iconCls: 'icon-grid',
                    listeners: {
                        cellclick: this.onPointRemoved,
                        scope: this
                    }
                }), {
                    type: 'bbar',
                    layout: {
                        type: 'hbox',
                        pack: 'end',
                        padding: '5 10'
                    },
                    items: [
                        this.btnSave,
                        {
                            type: 'xpanel',
                            width: 10,
                            bodyStyle: border
                        },
                        this.btnCancel
                    ]
                }]
        };

        this.add(c);
    }
});
