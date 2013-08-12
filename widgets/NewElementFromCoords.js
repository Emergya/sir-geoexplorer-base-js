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

    TOOL_POINT: 'Point',
    TOOL_LINE: 'Line',
    TOOL_POLYGON: 'Polygon',   

    action: null,

    addPointText: 'Add Point',
    latText: "Latitude",
    lonText: "Longitude",
    saveTitleText: 'Save Layer Changes?',
    saveMsgText: 'The active layer has changed. Save the changes now?',
    saveChangesText: "Save Changes",
    discardChangesText: "Discard changes",
    cancelText: "Cancel",
    removeText: "Remove",
    waitText:"Please wait...",
    geometryLabels : {
        "Point" : "Enter the points to add to the selected layer:",
        "Line": "Enter the vertexes of the line to be added to the selected layer:",
        "Polygon" : "Enter the vertexes of the polygon to be added to the selected layer:"
    },

    saveErrorText: "There was an error saving the feature. Please try again in a few moments.",
    saveSuccessText: "The new feature was successfully added to the layer.",


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
            show: this._onShow,
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
    _onShow: function() {
     
        this.searchByCoordinates.clear();
        this.changeActiveLayer();
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

        if (this.currentState == this.STATE_NONE) {
            this.changeActiveLayer();

        } else {
            this.askSaveFeatures(this.ACTION_CLEAR);
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
        var geometryType = this.action.getFeatureManager().geometryType;
        if(geometryType.indexOf("Multi") != -1){
            geometryType = geometryType.replace("Multi", "");
        }

        switch(geometryType) {
            case "Curve":
                geometryType= "Line";
                break;
            case "Surface":
                geometryType= "Polygon";
                break;
        }

        return geometryType;
    },

    getGeometryLabel: function(geometry) {       
        return this.geometryLabels[geometry] || null;
    },

    /**
     * Changing the active layer means to clean up the
     * previous layer data.
     * Stores the features the new layer currently has.
     */
    changeActiveLayer: function() {
        if(!this.activeLayer) {
            this.activeLayer = new OpenLayers.Layer.Vector("tmp layer",{displayInLayerSwitcher:false});
            Viewer.getMapPanel().map.addLayer(this.activeLayer);
        }

        this.activeLayer.removeAllFeatures();
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
    askSaveFeaturesCallback: function(buttonId, inputText, options, action) {

        if (buttonId == 'yes') {

            this.currentState = this.STATE_NONE;
            this._addFeaturesToLayer();

        } else if (buttonId == 'no') {

            this.currentState = this.STATE_NONE;
            this.activeLayer.removeAllFeatures();

        } else  {
            // Cancelling.
            return;
        }

        if (action == this.ACTION_CLEAR) {
            this.changeActiveLayer();

        } else if (action == this.ACTION_HIDE) {
            this.hide();
        }
    },

    _addFeaturesToLayer: function() {
        var featureManager = this.action.getFeatureManager();
        var protocol = featureManager.featureStore.proxy.protocol;

        Ext.Msg.wait(this.waitText);
        var self = this;
        protocol.commit(this.features, {
            callback: function(response){
                Ext.Msg.updateProgress(1);
                Ext.Msg.hide();


                if(!response.success()) {
                    Ext.Msg.alert("",self.saveErrorText);
                    return;
                }

                Ext.Msg.alert("",self.saveSuccessText);

                self.currentState = self.STATE_NONE;
                self.btnSave.disable();

              

                self.activeLayer.removeAllFeatures();

                // The grid's store is cleared.
                self.pointStore.removeAll();
                self.pointStore.commitChanges();

                // We reload the layer
                featureManager.layerRecord.data.layer.redraw(true);
                featureManager.featureStore.reload();
            }
        });
    },


    /**
     * Shows a Yes/No/Cancel dialog when the user tries to close the current
     * window or tries to select another layer and there are pending
     * changes in the active layer.
     */
    askSaveFeatures: function(action) {

        var buttons = {
            yes: this.saveChangesText,
            no: this.discardChangesText,
        };

        // If we are hiding we show a cancel button.
        // In layer changes we cannot cancel because we cannot cancel the layer change.
        if(action == this.ACTION_HIDE) {
            buttons["cancel"] = this.cancelText;
        }

        Ext.Msg.show({
            title: this.saveTitleText,
            msg: this.saveMsgText,
            buttons: buttons,
            fn: this.askSaveFeaturesCallback.createDelegate(this, [action], true),
            icon: Ext.MessageBox.QUESTION
        });
    },

    /**
     * Called when the Add button in the coordinates calculator is clicked.
     * Adds a new point to the Store object used by the grid.
     */
    onPointAdded: function(coords) {

        this.currentState = this.STATE_EDITING;

        var point = coords.getPoint(this.map.getProjectionObject());
        var record = new this.pointStore.recordType({
            lat: point.lat,
            lon: point.lon
        });
        this.pointStore.add(record);
        this.grid.getView().refresh();
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


        this.pointStore.each(function(record) {
                var point = new OpenLayers.Geometry.Point(record.get('lon'), record.get('lat'));
                var pointFeature = new OpenLayers.Feature.Vector(point, null, style_blue);

                if(geometry==this.TOOL_POINT) {
                     pointFeature.state = OpenLayers.State.INSERT;
                }

                features.push(pointFeature);
            }, this);

        if(geometry == this.TOOL_POINT) {
            this.btnSave.enable();
        } else if (geometry == this.TOOL_LINE) {
            var points = [];

            this.pointStore.each(function(record) {
                points.push(new OpenLayers.Geometry.Point(record.get('lon'), record.get('lat')));
            }, this);

            var line = new OpenLayers.Geometry.LineString(points);
            var lineFeature = new OpenLayers.Feature.Vector(line, null, style_blue);
            lineFeature.state = OpenLayers.State.INSERT;
            features.push(lineFeature);

            if(points.length>1) {
                this.btnSave.enable();
            }

        } else if (geometry == this.TOOL_POLYGON) {

            var points = [];

            this.pointStore.each(function(record) {
                points.push(new OpenLayers.Geometry.Point(record.get('lon'), record.get('lat')));
            }, this);
        
            var lring = new OpenLayers.Geometry.LinearRing(points);
            var polygon = new OpenLayers.Geometry.Polygon([lring]);
            var polygonFeature = new OpenLayers.Feature.Vector(polygon, null, style_blue);
            polygonFeature.state = OpenLayers.State.INSERT;
            features.push(polygonFeature);

            if(points.length > 2) {
                this.btnSave.enable();
            }

        } else  {
            throw new Error("New elementFromCoords::onPointListUpdated: Unsupported geometry type!");
        }

        

        this.activeLayer.removeAllFeatures();
        this.activeLayer.addFeatures(features);

        this.features = features;

    },

    onSaveButtonClicked: function() {
        this._addFeaturesToLayer();
    },

    onCancelButtonClicked: function() {
        this.currentState = this.STATE_NONE;
        this.hide();
        this.activeLayer.removeAllFeatures();        
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
        var border = 'border: 0px solid transparent;';

        var self= this;
        var c = {
            xtype: 'panel',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [{
                    xtype: 'panel',
                    height: 35,
                    bodyStyle: padding + border,
                    items: this.lblGeometryInfo
                },
                this.searchByCoordinates = new Viewer.widgets.SearchByCoordinates({
                    mapPanel: this.mapPanel,
                    map: this.map,
                    height: 150,
                    buttonUtmLabel: this.addPointText,
                    buttonLonLatLabel: this.addPointText,
                    buttonDecimalLabel: this.addPointText,
                    listeners: {
                        buttonUtmClicked: this.onPointAdded.createDelegate(this),
                        buttonLonLatClicked: this.onPointAdded.createDelegate(this),
                        buttonDecimalClicked: this.onPointAdded.createDelegate(this)
                    }
                }),
                this.grid = new Ext.grid.GridPanel({
                    store: this.pointStore,
                    colModel: new Ext.grid.ColumnModel({
                        defaults: {
                            width: 120,
                            sortable: false
                        },
                        columns: [
                            { header: this.latText},
                            { header: this.lonText},
                            {
                                header: '',
                                width: 50,
                                renderer: function(v, p, record, rowIndex) {
                                    return '<div class="vw-remove-grid-button">'+self.removeText+'</div>';                                    
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
