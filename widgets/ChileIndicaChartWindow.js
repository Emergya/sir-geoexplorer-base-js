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
 * Author: Daniel Pavon Perez <dpavon@emergya.com>
 */

Viewer.dialog.ChileIndicaChartWindow = Ext
    .extend(
        Ext.Window, {
            LAYER_NAME: 'Iniciativas de Inversión',
            map: null,
            selectControl: null,
            baseUrl: '../../chileIndicaInversion',
            layerController: null,
            vectorLayer: null,
            _barStore: null,
            title: 'Chart window 2',
            topTitleText: 'SEARCH CRITERIAS',
            stageText: 'State',
            yearText: 'Year',
            financingLineText: 'Financing Line',
            territorialLevelText: 'Territorial Level',
            groupByText: "Group by",
            proyectosPreinversionText: 'Preinvesment',
            proyectosEjecucionText: 'PROPIR execution',
            graphicButtonText: 'Render',
            centerTitleText: 'Chart',
            eastTitleText: 'Chart',
            xAxisTitle: 'Amount',
            porcionOtrosText: 'Others',
            geoButtonText: 'Search geo referenced initiatives',


            constructor: function(config) {

                this.listeners = {
                    beforerender: this.onBeforeRender,
                    show: this._onShow,
                    resize: this._onResize,
                    scope: this
                };

                Viewer.dialog.ChileIndicaChartWindow.superclass.constructor.call(
                    this, Ext.apply({
                        cls: 'vw_chart_window',
                        title: this.title,
                        width: 1000,
                        height: 600,
                        minHeight: 450,
                        minWidth: 700,
                        closeAction: 'hide',
                        layout: 'column',
                        maximizable: false
                    }, config));

                this.layerController = Viewer.getController('Layers');
                this.selectedFeatures = this.layerController
                    .getSelectedFeatures();

                var context = this;
                this._barStore = new Ext.data.JsonStore({
                    url: context.baseUrl + '/getMontosGroupBy',
                    storeId: 'barStoreId',
                    root: 'data',
                    idProperty: 'groupBy',
                    fields: [{
                        name: 'groupBy',
                        type: 'string'
                    }, {
                        name: 'monto',
                        type: 'float'
                    }, {
                        name: 'numProyectos',
                        type: 'int'
                    }],
                    autoload: false
                });


                this.map.events.register('preremovelayer', this,
                    this.layerRemoved);

                // this.map.addLayer(this.vectorLayer);
            },
            layerRemoved: function(evt) {
                if (evt.layer == this.layer) {
                    if (this.selectControl) {
                        this.selectControl.unselectAll();
                        this.map.removeControl(this.selectControl);
                        this.selectControl = null;
                    }

                }
            },
            generateData: function generateData() {
                var data = [];
                for (var i = 0; i < 12; ++i) {
                    data
                        .push([
                            Date.monthNames[i], (Math.floor(Math.random() * 11) + 1) * 100
                        ]);
                }
                return data;
            },

            _onResize: function() {
                if (!this.hidden) {
                    this.doLayout();
                    this._doChartsCreation();
                }
            },
            _onShow: function() {
                this._doChartsCreation();
            },

            onHide: function() {},
            updateGroupBy: function() {
                var anyo = Ext.getCmp('anyoId').getValue();
                var store = Ext.StoreMgr.get('agruparPorStoreId');

                var arrayCampos = [];
                arrayCampos.push(['nivelTerritorial', 'Comuna']);

                if (anyo === 'Todos') {
                    arrayCampos.push(['anyo', 'Año']);
                }

                store.loadData(arrayCampos, false);
            },

            onBeforeRender: function() {


                var c = [{
                        xtype: "panel",
                        layout: "border",
                        padding: 0,
                        width: 350,
                        items: [this._createSearchForm()]
                    },
                    this._createBigChart()
                ];

                this.add(c);
            },



            _createBigChart: function() {
                return {
                    xtype: 'gvisualization',
                    // region: 'east',
                    cls: "chart",

                    columnWidth: 1,
                    layout: 'fit',
                    id: 'bigChartId',
                    html: '<div class="chartLoading">Cargando...</div>',
                    flex: 1,
                    buttons: [{
                        id: 'iniciatiavasGeoId',
                        text: this.geoButtonText,
                        handler: this.georeferenceInitiatives,
                        scope: this
                    }],
                    visualizationPkgs: {
                        'corechart': 'ColumnChart'
                    },
                    visualizationPkg: 'corechart',
                    visualizationCfg: {
                        vAxis: {
                            title: this.xAxisTitle,
                            textPosition: "in"
                        },
                        hAxis: {
                            textStyle: {
                                fontSize: 8
                            }
                        },
                        legend: {
                            position: 'in'
                        },
                        title: "Monto Solicitado:"
                    },
                    store: this._barStore,
                    columns: [{
                        dataIndex: 'groupBy',
                        label: ''
                    }, {
                        dataIndex: 'monto',
                        label: 'Monto'
                    }, {
                        tooltip: true,
                        fields: ['groupBy', 'monto',
                            'numProyectos'
                        ],

                        template: new Ext.Template(
                            '{groupBy}: {monto:number("0.000/i")} CL$ en {numProyectos} iniciativas', {
                                compiled: true
                            })
                    }]

                };
            },

            _getBarChartCfg: function(formValues, small) {
                var groupingByCombo = Ext.getCmp('agruparPorId');
                var groupingByText = groupingByCombo.findRecord(
                    groupingByCombo.valueField || groupingByCombo.displayField,
                    groupingByCombo.getValue()).get(
                    groupingByCombo.displayField);
                return {
                    visualizationPkgs: {
                        'corechart': 'ColumnChart'
                    },
                    visualizationPkg: 'corechart',
                    visualizationCfg: {
                        vAxis: {
                            title: this.xAxisTitle,
                            textPosition: "in"
                        },
                        hAxis: {
                            textStyle: {
                                fontSize: 9
                            },
                            slantedTextAngle: 45
                        },
                        legend: {
                            position: 'in'
                        },
                        chartArea: {
                            width: small ? "70%" : "90%",
                            height: small ? "70%" : "75%"
                        },
                        title: "Monto Solicitado: " + " - " + "Año: " + formValues.anyo + " - Agrupado por: " + groupingByText
                    },
                    store: this._barStore,
                    columns: [{
                        dataIndex: 'groupBy',
                        label: ''
                    }, {
                        dataIndex: 'monto',
                        label: 'Monto'
                    }, {
                        tooltip: true,
                        fields: ['groupBy', 'monto',
                            'numProyectos'
                        ],

                        template: new Ext.Template(
                            '{groupBy}: {monto:number("0.000.000/i")} CL$ en {numProyectos} iniciativas', {
                                compiled: true
                            })
                    }]
                };
            },



            _createFuentesStore: function() {
                return new Ext.data.Store({
                    reader: new Ext.data.JsonReader({
                        fields: ['nombreFinanciamiento'],
                        root: 'data'
                    }),
                    proxy: new Ext.data.HttpProxy({
                        url: this.baseUrl + '/getFuentes'
                    }),
                    remoteSort: true,
                    autoLoad: true,
                    baseParams: {

                    },
                    listeners: {
                        load: function(store, records, options) {
                            // Autoselect first result

                            var projectCombo = Ext.getCmp('tipoProyectoId');

                            if (records.length !== 0) {
                                projectCombo.setValue(records[0]
                                    .get('nombreFinanciamiento'));
                                projectCombo.fireEvent('select',
                                    projectCombo, records[0], 0);
                            }
                        },
                        scope: this
                    }
                });
            },



            _createYearStore: function() {
                return new Ext.data.Store({
                    reader: new Ext.data.JsonReader({
                        fields: ['anyo'],
                        root: 'data'
                    }),
                    proxy: new Ext.data.HttpProxy({
                        url: this.baseUrl + '/getAnyos'
                    }),
                    remoteSort: true,
                    autoLoad: true,
                    baseParams: {

                    },
                    listeners: {
                        load: function(store, records, options) {
                            // Autoselect first result

                            var anyoCombo = Ext.getCmp('anyoId');

                            if (records.length !== 0) {
                                anyoCombo.setValue(records[0]
                                    .get('anyo'));
                                anyoCombo.fireEvent('select',
                                    anyoCombo, records[0], 0);
                            }
                        },
                        scope: this
                    }
                });
            },



            _createSearchForm: function() {

                var projectsStore = this._createFuentesStore();

                var yearsStore = this._createYearStore();
                var lineStore = this._createLineStore();
                var nivelTerritorialStore = this
                    ._createAreaLevelStore();
                var agruparPorStore = this._createGroupingStore();

                return {
                    xtype: 'form',
                    title: this.topTitleText,
                    // region: 'west',
                    region: "center",
                    id: 'inversion-form-region',
                    labelWidth: 100,
                    defaultType: 'combo',
                    defaults: {
                        listClass: "vw_chart_window_combo_list"
                    },
                    flex: 1,
                    items: [{
                            id: 'tipoProyectoId',
                            fieldLabel: this.stageText,
                            hiddenName: 'financiamiento',

                            //mode : 'local',
                            triggerAction: 'all',
                            //value : 'PREINVERSION',
                            store: projectsStore,
                            /*[
                                                [
                                                        'PREINVERSION',
                                                        this.proyectosPreinversionText ],
                                                [
                                                        'EJECUCION',
                                                        this.proyectosEjecucionText ] ],*/
                            valueField: 'nombreFinanciamiento',
                            displayField: 'nombreFinanciamiento',
                            forceSelection: true,
                            editable: false,

                            selectOnFocus: true,

                            listeners: {
                                select: function(e) {

                                    var tipoProyecto = Ext.getCmp(
                                        'tipoProyectoId')
                                        .getValue();
                                },
                                scope: this
                            }
                        }, {
                            id: 'anyoId',
                            fieldLabel: this.yearText,
                            hiddenName: 'anyo',

                            triggerAction: 'all',

                            store: yearsStore,

                            valueField: 'anyo',
                            displayField: 'anyo',
                            forceSelection: true,
                            editable: false,

                            listeners: {
                                select: function(combo, record,
                                    index) {
                                    var tipoProyecto = Ext.getCmp(
                                        'tipoProyectoId')
                                        .getValue();

                                    var anyo = record.get('anyo');


                                },
                                focus: function(combo) {
                                    // setBaseParams
                                    var tipoProyecto = Ext.getCmp(
                                        'tipoProyectoId')
                                        .getValue();
                                    combo.store.setBaseParam(
                                        'tipoProyecto',
                                        tipoProyecto);
                                },
                                scope: this
                            }
                        },

                        {
                            id: 'lineaId',
                            fieldLabel: this.financingLineText,
                            hiddenName: 'itemPresupuestario',
                            store: lineStore,
                            valueField: 'itemPresupuestario',
                            displayField: 'itemPresupuestario',
                            forceSelection: true,
                            editable: false,
                            triggerAction: 'all',
                            listeners: {
                                select: function(combo, record,
                                    index) {
                                    // clear sector combo
                                    var tipoProyecto = Ext.getCmp(
                                        'tipoProyectoId')
                                        .getValue();
                                    var anyo = Ext.getCmp('anyoId')
                                        .getValue();
                                    var linea = Ext.getCmp(
                                        'lineaId').getValue();


                                },
                                focus: function(combo) {
                                    // setBaseParams
                                    var tipoProyecto = Ext.getCmp(
                                        'tipoProyectoId')
                                        .getValue();
                                    var anyo = Ext.getCmp('anyoId')
                                        .getValue();
                                    combo.store.setBaseParam(
                                        'tipoProyecto',
                                        tipoProyecto);
                                    combo.store.setBaseParam(
                                        'anyo', anyo);
                                },
                                scope: this
                            }
                        },

                        {
                            id: 'nivelTerritorialId',
                            fieldLabel: this.territorialLevelText,
                            hiddenName: 'nivelTerritorial',
                            store: nivelTerritorialStore,
                            valueField: 'nivelTerritorial',
                            displayField: 'nivelTerritorial',
                            forceSelection: true,
                            editable: false,
                            triggerAction: 'all',
                            value: 'Regional'

                        }, {
                            id: 'agruparPorId',
                            fieldLabel: this.groupByText,
                            hiddenName: 'agruparPor',
                            store: agruparPorStore,
                            valueField: 'idCampo',
                            displayField: 'nombreCampo',
                            forceSelection: true,
                            editable: false,
                            triggerAction: 'all',
                            mode: 'local',
                            listeners: {
                                afterrender: function(combo) {
                                    this.updateGroupBy();
                                },
                                focus: function() {

                                    this.updateGroupBy();
                                },
                                scope: this
                            }

                        }

                    ],
                    buttons: [{
                        scope: this,
                        text: this.graphicButtonText,
                        handler: function() {
                            this._doChartsCreation();
                        }

                    }]
                };
            },

            _createAreaLevelStore: function() {
                return new Ext.data.Store({
                    reader: new Ext.data.JsonReader({
                        fields: ['nivelTerritorial'],
                        root: 'data'
                    }),
                    proxy: new Ext.data.HttpProxy({
                        url: this.baseUrl + '/getNivelesTerritoriales'
                    }),
                    remoteSort: true

                });
            },

            _createGroupingStore: function() {
                return new Ext.data.ArrayStore({
                    storeId: 'agruparPorStoreId',
                    idIndex: 0,
                    fields: ['idCampo', 'nombreCampo'],
                    autoload: false,
                    listeners: {
                        load: function(store, records, options) {
                            var combo = Ext.getCmp('agruparPorId');
                            if (combo) {
                                combo.setValue(records[0]
                                    .get('idCampo'));
                                combo.fireEvent('select', combo,
                                    records[0], 0);
                            }
                        },
                        scope: this
                    }
                });
            },

            _createLineStore: function() {
                return new Ext.data.Store({
                    reader: new Ext.data.JsonReader({
                        fields: ['itemPresupuestario'],
                        root: 'data'
                    }),
                    proxy: new Ext.data.HttpProxy({
                        url: this.baseUrl + '/getItemsPresupuestarios'
                    }),
                    remotSort: true,
                    autoLoad: false,
                    listeners: {
                        load: function(store, records, options) {

                            var lineaCombo = Ext.getCmp('lineaId');
                            if (records.length !== 0) {
                                lineaCombo.setValue(records[0]
                                    .get('itemPresupuestario'));
                                lineaCombo.fireEvent('select',
                                    lineaCombo, records[0], 0);
                            }
                        },
                        scope: this
                    }
                });

            },

            _doChartsCreation: function(exchange) {
                if (!this.rendered) {
                    // We cant do this yet (the method was called in a
                    // resize before things were initialized)
                    return;
                }

                // We get info from the form.
                var formPanel = Ext.getCmp('inversion-form-region');
                var formValues = formPanel.getForm().getValues();

                var bigChartConfig = null;

                bigChartConfig = this._getBarChartCfg(formValues, false);


                // The configs are applied.
                var bigChart = Ext.getCmp('bigChartId');

                Ext.apply(bigChart, bigChartConfig);



                this._barStore.reload({
                    params: formValues
                });



                this._reInitChart(bigChart);


            },

            // Does similarly to the GVisualizationPanel, but without
            // initializing the panel itself.
            // This allows us to change the visualization params without
            // problems.
            _reInitChart: function(chart) {
                if (typeof chart.visualizationPkg === 'object') {
                    Ext.apply(chart.visualizationPkgs,
                        chart.visualizationPkg);
                    for (var key in chart.visualizationPkg) {
                        chart.visualizationPkg = key;
                        break;
                    }
                }
                google.load(chart.visualizationAPI,
                    chart.visualizationAPIVer, {
                        packages: [chart.visualizationPkg],
                        callback: chart.onLoadCallback
                            .createDelegate(chart)
                    });
                chart.store = Ext.StoreMgr.lookup(chart.store);
                chart.store.addListener('datachanged',
                    chart.datachanged, chart);
            },

            georeferenceInitiatives: function() {
                var values = Ext.getCmp('inversion-form-region')
                    .getForm().getValues();
                var button = Ext.getCmp('iniciatiavasGeoId');
                button.setDisabled(true);

                Ext.Ajax.request({
                    url: this.baseUrl + '/getProyectosGeo',
                    success: this.georeferenceInitiativesSuccess,
                    failure: this.georeferenceInitiativesFailure,
                    params: values,
                    scope: this

                });

            },
            georeferenceInitiativesSuccess: function(response, options) {
                var button = Ext.getCmp('iniciatiavasGeoId');
                button.enable();
                var responseJson = Ext.util.JSON
                    .decode(response.responseText);

                var investmentLayer = this._getInvestmentLayer();
                var baseUrl = this.baseUrl;

                investmentLayer.removeAllFeatures();

                

                var featureCollection = {
                    type: 'FeatureCollection',
                    features: responseJson.data
                };

                Ext.MessageBox.alert("Resultado de la búsqueda",
                    "Se han encontrado " + responseJson.results +
                    " proyectos georreferenciados");

                var geojsonFormat = new OpenLayers.Format.GeoJSON();
                var features = geojsonFormat.read(featureCollection);
                this._transformGeometry(features);
                investmentLayer.addFeatures(features);

                if (responseJson.results > 0) {
                    var extent = investmentLayer.getDataExtent();
                    this.map.zoomToExtent(extent);

                }

            },

            _transformGeometry : function(features) {
                // The web service stores the geometry data in 4326 format, and we need it
                // in google's.
                var targetProjection = new OpenLayers.Projection('EPSG:32719');
                var sourceProjection   = new OpenLayers.Projection('EPSG:4326');


                Ext.each(features,function(feature){
                    feature.geometry.transform(sourceProjection,targetProjection);
                });
            },

            georeferenceInitiativesFailure: function(response, options) {
                var button = Ext.getCmp('iniciatiavasGeoId');
                button.enable();
                Ext.MessageBox
                    .alert("Resultado de la búsqueda",
                        "Se ha producido un error al realizar la búsqueda.");
            },

            _getInvestmentLayer: function() {
                var investmentLayers = this.map
                    .getLayersByName(this.LAYER_NAME);

                var investmentLayer =null;
                if (investmentLayers.length === 0) {
                    var defaultStyle = new OpenLayers.Style({
                        externalGraphic: this.baseUrl + '/../img/marker-blue.png',
                        fill: false,
                        stroke: false,
                        pointRadius: 0,
                        graphicWidth: 18,
                        graphicHeight: 30,
                        fillOpacity: 1,
                        graphicXOffset: -30 / 2,
                        graphicYOffset: -18 / 2,
                        cursor: 'pointer',
                        graphicZIndex: 1
                    });
                    var selectedStyle = new OpenLayers.Style({
                        externalGraphic: this.baseUrl + '/../img/marker-red.png',
                        fill: false,
                        stroke: false,
                        pointRadius: 0,
                        graphicWidth: 18,
                        graphicHeight: 30,
                        fillOpacity: 1,
                        graphicXOffset: -30 / 2,
                        graphicYOffset: -18 / 2,
                        cursor: 'pointer',
                        graphicZIndex: 1000
                    });

                    var myStyles = new OpenLayers.StyleMap({
                        "default": defaultStyle,
                        "select": selectedStyle
                    });

                    var utm19Projection = new OpenLayers.Projection(
                        "EPSG:32719");
                    var mapProjection = this.map.getProjectionObject();
                    // Create investment layer and add to map
                    investmentLayer = new OpenLayers.Layer.Vector(
                        this.LAYER_NAME, {
                            styleMap: myStyles,
                            preFeatureInsert: function(feature) {
                                OpenLayers.Projection.transform(
                                    feature.geometry,
                                    utm19Projection,
                                    mapProjection);

                            },
                            eventListeners: {
                                'featureselected': function(evt) {
                                    var feature = evt.feature;
                                    // create the select feature
                                    // control
                                    var popupWindow = new Viewer.plugins.ChileIndicaFichaInversion({
                                        feature: feature,
                                        location: feature,
                                        baseUrl: this.baseUrl,
                                        anchored: false

                                    });
                                    popupWindow
                                        .on(
                                            'close',
                                            function(p) {
                                                feature.popupWindow = null;
                                                this.selectControl
                                                    .unselect(feature);
                                            }, this);
                                    feature.popupWindow = popupWindow;

                                    popupWindow.createPopup();

                                },
                                'featureunselected': function(evt) {
                                    var feature = evt.feature;
                                    if (feature.popupWindow) {
                                        feature.popupWindow.close();
                                        feature.popupWindow = null;
                                    }
                                },
                                scope: this
                            }
                        });
                    var selector = new OpenLayers.Control.SelectFeature(
                        investmentLayer, {
                            hover: false,
                            autoActivate: true,
                            clickout: true,
                            multiple: false,
                            box: false,
                            toggle: true

                        });
                    this.layer = investmentLayer;
                    this.selectControl = selector;
                    this.map.addLayer(investmentLayer);
                    this.map.addControl(selector);

                } else {
                    investmentLayer = investmentLayers[0];
                }

                return investmentLayer;
            }
        });