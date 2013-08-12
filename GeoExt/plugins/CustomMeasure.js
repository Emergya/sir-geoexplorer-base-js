/**
 * Copyright (C) 2013
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
 * Author: Luis Román <lroman@emergya.com>
 */


/**
 * @requires plugins/Tool.js
 * @requires OpenLayers/StyleMap.js
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Control/Measure.js
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Handler/Polygon.js
 * @requires OpenLayers/Renderer/SVG.js
 * @requires OpenLayers/Renderer/VML.js
 * @requires OpenLayers/Renderer/Canvas.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = Measure
 */

/** api: (extends)
 *  plugins/ClickableFeatures.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: Measure(config)
 *
 *    Provides two actions for measuring length and area.
 */
gxp.plugins.CustomMeasure = Ext.extend(gxp.plugins.ClickableFeatures, {

    /** api: ptype = gxp_custommeasure */
    ptype: "gxp_custommeasure",

    /** api: config[iconCls]
     *  ``String``
     *  Class used for the button's icon.
     */
    iconCls: "gxp-icon-measure-area",

    /** api: config[selectIconCls]
     *  ``String``
     *  Class used for the selection menu item's icon.
     */
    selectIconClass: "vw-icon-mapselection",

    /** api: config[drawIconCls]
     *  ``String``
     *  Class used for the draw menu item's icon.
     */
    drawIconClass: "vw-icon-edition",


    /** api: config[tooltip]*/
    tooltip: "Measure area",

    /** api: config[featureManager]
     * The id of the feature manager used to support measure-on-feature-selection.
     */
    featureManager: "featuremanager",

    /** api: config[measureColor]
     * The color used by the lines drawn by the measurement-by-drawing tool
     */
    measureColor : "#EF4C50",

    /** api: config[outputTarget]
     *  ``String`` Popups created by this tool are added to the map by default.
     */
    outputTarget: "map",

    drawInMapText: "Measure in map",
    selectFeatureText: "Select feature to measure",
    numberFormat: "0,000.00",



    /** api: config[buttonText]
     *  ``String``
     *  Text for the Measure button (i18n).
     */
    buttonText: "Measure Area",

    drawPopupTooltips: {
        "AREA": "Area of the drawn polygon:",
        "LENGTH": "Length of the drawn polyline:",
        "PERIMETER": "Perimeter of the drawn polygon:"
    },

    selectionPopupTooltips: {
        "AREA": "Area of the selected polygon:",
        "LENGTH": "Length of the selected polyline:",
        "PERIMETER": "Perimeter of the selected polygon:"
    },

    geometryTypesForSelection: {
        "AREA": ["Polygon", "Surface"],
        "PERIMETER": ["Polygon", "Surface"],
        "LENGTH": ["Curve", "LineString", "Line"]
    },

    /**
     * api: config[measureMode]
     *  ``String``
     *  Mode of measurement of the tool. Can take values "AREA", "LENGTH" and "PERIMETER".
     */
    measureMode: "AREA",


    MODE_AREA: "AREA",
    MODE_LENGTH: "LENGTH",
    MODE_PERIMETER: "PERIMETER",

    map: null,

    selectControl: null,
    measureControl: null,

    handlers: {
        "AREA": OpenLayers.Handler.Polygon,
        "LENGTH": OpenLayers.Handler.Path,
        "PERIMETER": OpenLayers.Handler.Polygon
    },

    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.CustomMeasure.superclass.constructor.apply(this, arguments);
    },

    /** private: method[destroy]
     */
    destroy: function() {
        this.button = null;
        gxp.plugins.CustomMeasure.superclass.destroy.apply(this, arguments);
    },


    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        gxp.plugins.CustomMeasure.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },


    /** private: method[createMeasureControl]
     * :param: handlerType: the :class:`OpenLayers.Handler` for the measurement
     *     operation
     * :param: title: the string label to display alongside results
     *
     * Convenience method for creating a :class:`OpenLayers.Control.Measure`
     * control
     */
    createMeasureControl: function(handlerType, title) {

        var styleMap = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style(null, {
                rules: [new OpenLayers.Rule({
                        symbolizer: {
                            "Point": {
                                pointRadius: 4,
                                graphicName: "square",
                                fillColor: "white",
                                fillOpacity: 1,
                                strokeWidth: 1,
                                strokeOpacity: 1,
                                strokeColor: this.measureColor
                            },
                            "Line": {
                                strokeWidth: 3,
                                strokeOpacity: 1,
                                strokeColor: this.measureColor,
                                strokeDashstyle: "dash"
                            },
                            "Polygon": {
                                strokeWidth: 2,
                                strokeOpacity: 1,
                                strokeColor: this.measureColor,
                                fillColor: "white",
                                fillOpacity: 0.3
                            }
                        }
                    })]
            })
        });

        var controlOptions = Ext.apply({}, this.initialConfig.controlOptions);
        Ext.applyIf(controlOptions, {
            geodesic: true,
            persist: true,
            handlerOptions: {
                layerOptions: {
                    styleMap: styleMap
                }
            },
            eventListeners: {
                measurepartial: function(event) {
                    this.cleanup();
                    this.measureTooltip = this._createTooltip(event, title);
                    if (event.measure > 0) {
                        var px = this.measureControl.handler.lastUp;
                        var p0 = this.target.mapPanel.getPosition();
                        this.measureTooltip.targetXY = [p0[0] + px.x, p0[1] + px.y];
                        this.measureTooltip.show();
                    }
                },
                measure: function(event) {
                    this.cleanup();
                    this.measureTooltip = this._createTooltip(event, title);
                    if (event.measure > 0) {
                        var components = event.geometry.components;
                        var lastPointIdx = components.length - 1;
                        if (components.length == 1 && components[0].components) {
                            // Area points are inside a single element, ad have one more point (because the poligon closes);
                            components = components[0].components;
                            lastPointIdx = components.length - 2;
                        }

                        var lastLonLat = components[lastPointIdx];
                        this.measureTooltip.targetXY = this._calculateTooltipXY(lastLonLat);
                        this.measureTooltip.show();
                    }
                },
                deactivate: this.cleanup,
                scope: this
            }
        });

        this.measureControl = new OpenLayers.Control.Measure(handlerType,
            controlOptions);

        return this.measureControl;
    },

    _calculateTooltipXY: function(point) {
        point = {
            lon: point.x,
            lat: point.y
        };

        var p0 = this.target.mapPanel.getPosition();
        var px = this.target.mapPanel.map.getViewPortPxFromLonLat(point);
        return [p0[0] + px.x, p0[1] + px.y];
    },

    /** api: method[addActions]
     */
    addActions: function() {

        var featureManager = this._getFeatureManager();
        featureManager.on("layerchange", this._enableOrDisableFeatureSelection, this);
        window.app.on({
            layerselectionchange: this._enableOrDisableFeatureSelection,
            loginstatechange: this._enableOrDisableFeatureSelection,
            scope: this
        });

        this.map = Viewer.getMapPanel().map;

        this.activeIndex = 0;
        this.button = new Ext.Button({
            iconCls: this.iconCls,
            buttonText: this.tooltip,
            menuText: this.tooltip,
            tooltip: this.tooltip,
            enableToggle: true,
            toggleGroup: this.toggleGroup,
            scope: this,
            listeners: {
                "click": function() {
                    // We don't want the button to be marked as pressed util we
                    // we click in one of the menu's options.
                    this.button.toggle(false);
                },
                "toggle": function(button, pressed) {
                    if (!pressed) {
                        // We need to uncheck the items manually...
                        this.drawInMapMenuItem.setChecked(false);
                        this.selectFeatureMenuItem.setChecked(false);
                    }
                },
                "scope": this
            },
            menu: new Ext.menu.Menu({
                items: [
                    this.drawInMapMenuItem = new Ext.menu.CheckItem(
                        new GeoExt.Action({
                        text: this.drawInMapText,
                        toggleGroup: this.toggleGroup,
                        group: this.toggleGroup,
                        map: this.target.mapPanel.map,
                        listeners: {
                            scope: this,
                            "click": function() {
                                // We activate the button.
                                this.button.toggle(true);
                            }
                        },
                        control: this.createMeasureControl(
                            this.handlers[this.measureMode], this.drawPopupTooltips[this.measureMode])
                    })),
                    this.selectFeatureMenuItem = new Ext.menu.CheckItem(
                        new GeoExt.Action({
                        text: this.selectFeatureText,
                        toggleGroup: this.toggleGroup,
                        group: this.toggleGroup,
                        deactivateOnDisabled: true,
                        control: this._createSelectionControl(),
                        listeners: {
                            scope: this,
                            "click": function() {
                                // We activate the button.
                                this.button.toggle(true);
                            }
                        },
                        "map": this.target.mapPanel.map
                    }))
                ]
            })
        });

        this._enableOrDisableFeatureSelection();

        return gxp.plugins.CustomMeasure.superclass.addActions.apply(this, [this.button]);
    },

    _enableOrDisableFeatureSelection: function() {
        var mgr = this._getFeatureManager();
        var layerRecord = mgr.layerRecord;
        var schema = mgr.schema;


        var geometryType = null;
        var layer = null;
        // Institución de la capa
        if ( !! layerRecord && !! layerRecord.data && !! layerRecord.data.layer) {
            layer = layerRecord.data.layer;
        }

        // Comprobamos si el usuario tiene permisos en la capa
        if (layer) {
            // There's a schema
            if (!schema || !mgr.geometryType) {
                this.button.toggle(false);
                this.selectFeatureMenuItem.disable();
                return;
            }

            if (mgr.geometryType.indexOf("Multi") != -1) {
                geometryType = mgr.geometryType.replace("Multi", "");
            } else {
                geometryType = mgr.geometryType;
            }

            // We allow selecting features if the geometry type of the selected layer
            // is allowed for the measurement mode.
            var geometryTypes = this.geometryTypesForSelection[this.measureMode];
            if ( !! geometryType && geometryTypes.indexOf(geometryType) >= 0) {
                this.selectFeatureMenuItem.enable();
            } else {
                this.button.toggle(false);
                this.selectFeatureMenuItem.disable();
            }
        } else {
            this.button.toggle(false);
            this.selectFeatureMenuItem.disable();
        }
    },

    cleanup: function() {
        if (this.measureTooltip) {
            this.measureTooltip.destroy();
        }
    },

    _createSelectionControl: function() {

        var featureManager = this._getFeatureManager();
        var featureLayer = featureManager.featureLayer;

        this.selectControl = new OpenLayers.Control.SelectFeature(featureLayer, {
            clickout: false,
            multipleKey: "fakeKey",
            eventListeners: {
                "activate": function() {
                    // We change the cursor over the map to indicate selection.
                    Ext.select(".olMap").setStyle("cursor", "crosshair");
                    // And enable said selection.
                    this.map.events.register("click", this, this.noFeatureClick);
                    featureManager.showLayer(
                        this.id, this.showSelectedOnly && "selected");
                    this.selectControl.unselectAll();

                },
                "deactivate": function() {
                    // We remove al traces of activity.
                    this.target.mapPanel.map.events.unregister("click", this, this.noFeatureClick);
                    Ext.select(".olMap").setStyle("cursor", "default");

                    featureManager.featureLayer.removeAllFeatures();
                    featureManager.hideLayer(this.id);
                    this.cleanup();
                },
                "scope": this
            }
        });


        featureLayer.events.on({
            "featureunselected": function(evt) {
                this.cleanup();
            },
            "featureselected": function(evt) {

                if (!this.button.pressed) {
                    // This tool is not active but we are listening to events anyways,
                    // so we need to do nothing in these cases.
                    return;
                }

                this.cleanup();

                var feature = evt.feature;

                var measureData = {
                    geometry: feature.geometry
                };


                // We measure the selected geometry. We don't need to do this for MODE_PERIMETER because
                // we handle that type in _createTooltip
                if (this.measureMode == this.MODE_LENGTH) {
                    var perimeterData = this.measureControl.getBestLength(feature.geometry);
                    measureData.measure = perimeterData[0];
                    measureData.units = perimeterData[1];
                    measureData.order = 1;
                } else if (this.measureMode == this.MODE_AREA) {
                    var perimeterData = this.measureControl.getBestArea(feature.geometry);
                    measureData.measure = perimeterData[0];
                    measureData.units = perimeterData[1];
                    measureData.order = 2;
                }

                var title = this.selectionPopupTooltips[this.measureMode];
                this.measureTooltip = this._createTooltip(measureData, title);

                var centroid = feature.geometry.getCentroid();
                this.measureTooltip.targetXY = this._calculateTooltipXY(centroid);
                this.measureTooltip.show();
            },
            "scope": this
        });

        return this.selectControl;
    },

    _createTooltip: function(metricData, title) {
        // We calculate here the metrics for MODE_PERIMETER because the measure control doesn't
        // seemingly return us perimeter info in the event so we need to do that manually.
        if (this.measureMode == this.MODE_PERIMETER) {
            var perimeterData = this.measureControl.getBestLength(metricData.geometry);

            metricData.measure = perimeterData[0];
            metricData.units = perimeterData[1];
            metricData.order = 1;
        }

        return this.addOutput({
            xtype: 'tooltip',
            html: this._createMeasureLabel(metricData),
            title: title,
            autoHide: false,
            closable: true,
            draggable: false,
            mouseOffset: [0, 0],
            showDelay: 1,
            listeners: {
                hide: this.cleanup,
                scope: this
            }
        });
    },

    _getFeatureManager: function() {
        return app.tools[this.featureManager];
    },

    _createMeasureLabel: function(metricData) {
        var metric = metricData.measure;
        var order = metricData.order;
        var metricUnit = metricData.units;

        var dim = order == 2 ? '<sup>2</sup>' : '';

        return Ext.util.Format.number(metric, this.numberFormat) + " " + metricUnit + dim;
    }

});

Ext.preg(gxp.plugins.CustomMeasure.prototype.ptype, gxp.plugins.CustomMeasure);