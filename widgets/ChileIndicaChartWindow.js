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
            LAYER_NAME_FILTER: 'Filtrado Iniciativas de Inversión',
            map: null,
            selectControl: null,
            baseUrl: '../../chileIndicaInversion',                       
            layerController: null,
            vectorLayer: null,
            _barStore: null,
            _pieStore : null,
            title: 'Chart window 2',
            topTitleText: 'SEARCH CRITERIAS',
            stageText: 'State',
            sourceText : 'Financiamiento',
            yearText: 'Year',
            financingLineText: 'Financing Line',
            territorialLevelText: 'Territorial Level',
            sectorText : 'Sector',
            groupByText: "Group by",
            proyectosPreinversionText: 'Preinvesment',
            proyectosEjecucionText: 'PROPIR execution',
            exchangeChartsText : "Intercambiar",
            graphicButtonText: 'Render',
            centerTitleText: 'Chart',
            eastTitleText: 'Chart',
            xAxisTitle: 'Amount',
            porcionOtrosText: 'Others',
            geoButtonText: 'Search geo referenced initiatives',
            // This is used to know which chart is the big one.
            _bigChart : null,
            _winResultsGrid:null,    
            _totalResult:0,
            _totalFilterResult:-1,

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
                this._barStore = new Ext.data.Store({
                    reader : new Ext.data.JsonReader({
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
												    idProperty: 'groupBy',
								                    root : 'data'
								                    }),
                    proxy : new Ext.data.HttpProxy({
                        url : this.baseUrl + '/getMontosGroupBy'
                    }),
                    remoteSort : true,
                    autoload : false,
                    storeId: 'barStoreId'
                });
                this._pieStore = new Ext.data.Store({
                    reader : new Ext.data.JsonReader({
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
												    idProperty: 'groupBy',
								                    root : 'data'
								                    }),
                    proxy : new Ext.data.HttpProxy({
                        url : this.baseUrl + '/getMontosGroupBy'
                    }),
                    remoteSort : true,
                    autoload : false,
                    storeId: 'pieStoreId'
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
                //this._doChartsCreation();
            },

            onHide: function() {},
            updateGroupBy: function() {
            	var sector = Ext.getCmp('sectorId').getValue();
                //var fuente = Ext.getCmp('fuenteId').getValue();
                var store = Ext.StoreMgr.get('agruparPorStoreId');

                var arrayCampos = [];
                arrayCampos.push([ 'nivelTerritorial', 'Comuna' ]);
                /*
                if (fuente === 'Todos') {
                    arrayCampos.push([ 'fuente', 'Fuente' ]);
                }
                */
                if (sector === 'Todos') {
                    arrayCampos.push([ 'sector', 'Sector' ]);
                }
                store.loadData(arrayCampos, false);
            },

            onBeforeRender: function() {


                var c = [{
                        xtype: "panel",
                        layout: "border",
                        padding: 0,
                        width: 350,
                        items: [this._createSearchForm(),this._createSmallChart()]
                    },
                    this._createBigChart()
                ];

                this.add(c);
            },
            _createSmallChart : function () {   
                return {
                    // region: 'center',
                    cls : "smallChart",
                    columnWidth : 1,
                    xtype : 'gvisualization',
                    region : "south",
                    height : 230,
                    id : 'smallChartId',
                    visualizationPkgs : {
                        'corechart' : 'PieChart'
                    },
                    visualizationPkg : 'corechart',
                    visualizationCfg : {
                        title : "Solicitado en sectores",
                        pieSliceText : 'label',
                        pieResidueSliceLabel : this.porcionOtrosText,
                        chartArea : {
                            width : "90%",
                            height :"70%"
                        }
                    },
                    store : this._pieStore,
                    buttons : [ {
                        id : "exchangeChartsBtn",
                        text : this.exchangeChartsText,
                        handler : this._exchangeCharts,
                        scope : this
                    } ],
                    columns : [
                            {
                                dataIndex : 'groupBy',
                                label : 'Sectores'
                            },
                            {
                                dataIndex : 'monto',
                                label : 'Monto'
                            },
                            {
                                tooltip : true,
                                fields : [ 'monto', 'numProyectos' ],
                                template : new Ext.Template(
                                        'Monto: {monto:number("0.000.000/i")} CL$ en {numProyectos} iniciativas',
                                        {
                                            compiled : true
                                        })
                            } ],
                    formatter : {
                        pattern : "{0}",
                        srcIdxs : [ 2 ],
                        outIdx : 1
                    }
                };
            },

            _exchangeCharts : function () {
                if (this._bigChart == "pie") {
                    this._bigChart = "bars";
                } else {
                    this._bigChart = "pie";
                }

                this._doChartsCreation(true);
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
                        //text: this.geoButtonText,
                        text: 'Ver Iniciativas',
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
            
            _getPieChartCfg : function (formValues, small) {
            	/*
                var projectTypeCombo = Ext.getCmp('fuenteId');                
                var projectTypeText = projectTypeCombo.findRecord(
                        projectTypeCombo.valueField || projectTypeCombo.displayField,
                        projectTypeCombo.getValue()).get(projectTypeCombo.displayField);
                 */
                return {
                    visualizationPkgs : {
                        'corechart' : 'PieChart'
                    },
                    visualizationPkg : 'corechart',
                    visualizationCfg : {
                        title : "Año: " +
                                formValues.anyo +
                                " - Solicitado en sectores",
                        pieSliceText : 'label',
                        pieResidueSliceLabel : this.porcionOtrosText,
                        chartArea : {
                            width : "90%",
                            height : small ? "70%" : "90%"
                        }
                    },
                    store : this._pieStore,
                    columns : [
                            {
                                dataIndex : 'groupBy',
                                label : 'Sectores'
                            },
                            {
                                dataIndex : 'monto',
                                label : 'Monto'
                            },
                            {
                                tooltip : true,
                                fields : [ 'monto', 'numProyectos' ],
                                template : new Ext.Template(
                                        'Monto: {monto:number("0.000.000/i")} CL$ en {numProyectos} iniciativas',
                                        {
                                            compiled : true
                                        })
                            } ],
                    formatter : {
                        pattern : "{0}",
                        srcIdxs : [ 2 ],
                        outIdx : 1
                    }
                };
            },
            _createSourceStore : function () {
                return new Ext.data.Store({
                    reader : new Ext.data.JsonReader({
                        fields : [ 'fuente' ],
                        root : 'data'
                    }),
                    proxy : new Ext.data.HttpProxy({
                        url : this.baseUrl + '/getFuentes'
                    	//url: '../../getFuentes.json' 
                    }),
                    remoteSort : true,
                    autoLoad : false,
                    listeners : {
                        load : function (store, records, options) {

                            var fuenteCombo = Ext.getCmp('fuenteId');
                            fuenteCombo.setValue(records[0]
                                    .get('fuente'));
                            fuenteCombo.fireEvent('select',
                                    fuenteCombo, records[0], 0);
                        },
                        scope : this
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
                    	//url: '../../getAnyos.json'
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
            _createProvisionStore : function () {
                return new Ext.data.Store({
                    reader : new Ext.data.JsonReader({
                        fields : [ 'provision' ],
                        root : 'data'
                    }),
                    proxy : new Ext.data.HttpProxy({
                        url : this.baseUrl + '/getProvisiones'
                        //url: "../../getProvisiones.json"
                    }),
                    remoteSort : true,
                    autoload : false,
                    listeners : {
                        load : function (store, records, options) {

                            var provisionCombo = Ext.getCmp('provisionId');                            
                            if (records.length !== 0) {
                            	provisionCombo.setValue(records[0].get('provision'));
                            	provisionCombo.fireEvent('select',provisionCombo, records[0], 0);
                            }

                        },
                        scope : this
                    }
                });
            },            
            _createSectorStore : function () {
                return new Ext.data.Store({
                    reader : new Ext.data.JsonReader({
                        fields : [ 'sector' ],
                        root : 'data'
                    }),
                    proxy : new Ext.data.HttpProxy({
                        url : this.baseUrl + '/getSectores'
                        //url: "../../getSectores.json"
                    }),
                    remoteSort : true,
                    autoload : false,
                    listeners : {
                        load : function (store, records, options) {

                            var sectorCombo = Ext.getCmp('sectorId');
                            if (records.length !== 0) {
                                sectorCombo.setValue(records[0]
                                        .get('sector'));
                                sectorCombo.fireEvent('select',
                                        sectorCombo, records[0], 0);
                            }

                        },
                        scope : this
                    }
                });
            },

            _createSearchForm: function() {
                
                var sourceStore = this._createSourceStore();
                var yearsStore = this._createYearStore();
                
                var nivelTerritorialStore = this._createAreaLevelStore();
                var sectorStore = this._createSectorStore();
                var provisionStore= this._createProvisionStore();
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
                    items: [
                            /* Para tener un ID por cada tipo
                            {
                    		  id: 'tipoIniciativa',
                    		  fieldLabel: 'Tipo Iniciativa',
                    		  hiddenName: 'tipo-inciativa',
                    		  typeAhead: true,
                   		      triggerAction: 'all',
                    		  lazyRender:true,
                    		  mode: 'local',
                    		  editable: false,     
                    		  forceSelection: true,
                    		  value: 0,
                              store: new Ext.data.ArrayStore({
                                  id: 0,
                                  fields: [
                                      'IdTipoIniciativa',
                                      'TextTipoIniciativa'
                                  ],
                                  data: [[0,'Todos'],[1, 'ARI'],[2, 'PROPIR'],[3, 'PREINVERSIÓN'],[4, 'EJECUCIÓN']]
                              }),
                              valueField: 'IdTipoIniciativa',
                              displayField: 'TextTipoIniciativa'
                    		},
                    		*/
                            {
                    		  id: 'tiniciativa',
                    		  fieldLabel: 'Tipo Iniciativa',
                    		  hiddenName: 'tipoIniciativa',
                    		  typeAhead: true,
                   		      triggerAction: 'all',
                    		  lazyRender:true,
                    		  mode: 'local',
                    		  editable: false,     
                    		  forceSelection: true,
                    		  value: "ARI",
                              store: ['ARI', 'PROPIR', 'PREINVERSION', 'EJECUCION']                                                           
                    		},                    		
                    		{
                                id : 'fuenteId',
                                fieldLabel : this.sourceText,
                                hiddenName : 'fuenteFinanciamiento',
                                store : sourceStore,
                                valueField : 'fuente',
                                displayField : 'fuente',
                                forceSelection : true,
                                editable : false,
                                triggerAction : 'all',
                                value: 'Todos',
                                listeners : {
                                    select : function (combo, record,
                                            index) {
                                        // clear financial line combo
                                        
                                        var fuente = Ext.getCmp(
                                                'fuenteId').getValue();
                                        var anyo = Ext.getCmp('anyoId')
                                                .getValue();
                                        
                                    },
                                    focus : function (combo) {
                                        // setBaseParams                                        
                                        var anyo = Ext.getCmp('anyoId')
                                                .getValue();                                        
                                        combo.store.setBaseParam(
                                                'anyo', anyo);
                                    },
                                    scope : this
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
                                    var anyo = record.get('anyo');
                                },
                                focus: function(combo) {
                                    // setBaseParams                                    
                                },
                                scope: this
                            }
                        }, 
                        {
                  		  id: 'provisionId',
                  		  fieldLabel: 'Provisión',
                  		  hiddenName: 'provision',
                  		  store: provisionStore,
                  		  valueField : 'provision',
                  		  displayField : 'provision',
                  		  forceSelection : true,
                  		  editable : false,
                  		  triggerAction : 'all',
                  		  value: 'Todos',
	                  	  listeners : {
	                            select : function (combo, record,
	                                    index) {
	                                this.updateGroupBy();
	                            },
	                            
	                            focus : function (combo) {
	                                var anyo = Ext.getCmp('anyoId')
	                                        .getValue();	                               	                                
	                                combo.store.setBaseParam(
	                                        'anyo', anyo);
	                            },
	                            
	                            scope : this
	                        }
                        
                  		}, 
                        {
                            id : 'sectorId',
                            fieldLabel : this.sectorText,
                            hiddenName : 'sector',
                            store : sectorStore,
                            valueField : 'sector',
                            displayField : 'sector',
                            forceSelection : true,
                            editable : false,
                            triggerAction : 'all',
                            value: 'Todos',
                            listeners : {
                                select : function (combo, record,
                                        index) {
                                    this.updateGroupBy();
                                },
                                
                                focus : function (combo) {
                                    
                                    var anyo = Ext.getCmp('anyoId')
                                            .getValue();                                                                       
                                    combo.store.setBaseParam(
                                            'anyo', anyo);
                                    
                                },
                                
                                scope : this
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
                    	//url: '../../getNivelesTerritoriales.json'
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

            _doChartsCreation : function (exchange) {
                if (!this.rendered) {
                    // We cant do this yet (the method was called in a
                    // resize before things were initialized)
                    return;
                }

                // We get info from the form.
                var formPanel = Ext.getCmp('inversion-form-region');
                var formValues = formPanel.getForm().getValues();

                var smallChartConfig = null;
                var bigChartConfig = null;
                if (this._bigChart == "pie") {
                    smallChartConfig = this._getBarChartCfg(formValues,
                            true);
                    bigChartConfig = this._getPieChartCfg(formValues,
                            false);
                } else {
                    bigChartConfig = this._getBarChartCfg(formValues,
                            false);
                    smallChartConfig = this._getPieChartCfg(formValues,
                            true);
                }

                // The configs are applied.
                var smallChart = Ext.getCmp('smallChartId');
                var bigChart = Ext.getCmp('bigChartId');

                Ext.apply(smallChart, smallChartConfig);
                Ext.apply(bigChart, bigChartConfig);

                

                this._barStore.reload({
                    params : formValues
                });

                this._pieStore.reload({
                    params : {
                        //'tipoProyecto' : formValues.tipoProyecto,
                        'anyo' : formValues.anyo,
                        'agruparPor' : 'sector'
                    }
                });

                if (exchange) {
                    this._reInitChart(smallChart);
                    this._reInitChart(bigChart);
                }

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
            	Ext.MessageBox.show({
                    title: 'Consultando datos',
                    msg: 'Consultando datos. Espere, por favor...',
                    width:300,
                    wait:true,                    
                    animEl: 'mb7'
                });
                var values = Ext.getCmp('inversion-form-region')
                    .getForm().getValues();
                var button = Ext.getCmp('iniciatiavasGeoId');
                //button.setDisabled(true);
                /*
                Ext.Ajax.request({
                    url: this.baseUrl + '/getProyectosGeo',
                    success: this.georeferenceInitiativesSuccess,
                    failure: this.georeferenceInitiativesFailure,
                    params: values,
                    scope: this

                });
                */                
                // create store con resultados, si hay error en la peticion ajax lanza el mensaje.
                var context=this;
                // close windows if button of view iniciatives is clicked
                if(context._winResultsGrid!=null){
                	context._winResultsGrid.close();
                	context._winResultsGrid=null;
                	// AL igual hay que borrar capas en mapa
                } 
                var storeInv = context._createGridInvStore(); 
                storeInv.load({
                	params : values,
	               	callback : function(r, options, success) {
	               		    Ext.MessageBox.hide();
	               			if(!success) context.georeferenceInitiativesFailure();
	               			else {
	               				    
	               				    	               						               					
		               				var data={'results':r.length,'data':[],'success':true};
		               				var dataJson={'results':r.length,'data':[],'success':true};
			               			//data['data']=new Array();
		               				//console.log("Total store");
		               				//console.log(r);
				               		for (var i = 0; i < r.length; i++) {
				               			r[i].data.x=r[i].json.geometry.coordinates[0];
				               			r[i].data.y=r[i].json.geometry.coordinates[1];	
				                        data.data.push(r[i].data); // lleva datos de iniciativas y datos gis en x e y				                        
				                        dataJson.data.push(r[i].json);
				                        //console.log("json coordenadas del store");
				                        //console.log(r[i].json.geometry.coordinates);				                        
				                        //data.data.push(r[i].json)
				                    }				           
				               		//console.log("Total data grid");
				               		//console.log(data);
				               		// show data into grid
				               		context._totalResult=data.results;
				               		if(data.results!=0){
				               			context._showResultsGrid(this);
					               		Ext.MessageBox.alert("Resultado de la búsqueda",
					                            "Se han encontrado " + data.results +
					                            " proyectos georreferenciados");
					               		// Limpiar si hubiera capa de filtrado anterior
					               		context._removeLayerFilter();
					               		// show georeferenciacion
					               		context.georeferenceInitiativesSuccess(dataJson,false);	
				               		} else{
				               			Ext.MessageBox.alert("Resultado de la búsqueda",
					                            "No se han encontrado proyectos georreferenciados");
				               		}
				               		
				                    
	               			}	               					               				               			
	                    }
                	}
                );
            },             
            // Georeferenciación de iniciativas
            // responseJson son los datos en formato json
            // filtred: true si es para georeferenciar las iniciativas filtradas en una nueva capa
            georeferenceInitiativesSuccess: function(responseJson,filtred) {
                
                var investmentLayer = this._getInvestmentLayer(filtred);
                var baseUrl = this.baseUrl;
                if(filtred)  investmentLayer.removeAllFeatures();
                var featureCollection = {
                    type: 'FeatureCollection',
                    features: responseJson.data
                };
                var geojsonFormat = new OpenLayers.Format.GeoJSON();
                var features = geojsonFormat.read(featureCollection);
                this._transformGeometry(features);
                investmentLayer.addFeatures(features);

                if (responseJson.results > 0) {
                    var extent = investmentLayer.getDataExtent();
                    this.map.zoomToExtent(extent);

                }

            },
            /* INICIO DE LO NUEVO */
            // Nueva funcionalidad para visualizar las iniciativas en grid
            
            _showResultsGrid : function(store) {            	
            	var win=new Ext.Window({
            		title: 'Iniciativas encontradas',
            		layout: 'fit',
            		 frame: true,   
 	                width:900, 
 	                height:460,	                	                 	                
            		items: this._createGridInv(store)
            	});
            	win.show();
            	this._winResultsGrid=win;
            	// escribe descripción para aplicar filtro
            	Ext.DomHelper.insertBefore('resultsGeo_panel',{tag:'p',html:'<p>&nbsp; APLICACIÓN DE FILTROS: Se debe situar sobre la columna deseada y activar el menú de la parte derecha de dicha columna </p>'});            	
            },
            
            _createFilterGridInv: function() {
                return  new Ext.ux.grid.GridFilters({
                	// encode and local configuration options defined previously for easier reuse
                	encode: false, // json encode the filter query
                	local: true,   // defaults to false (remote filtering)
                	filters: [{
		                		type: 'numeric',
		                		dataIndex: 'codigoBip',
		                		menuItemCfgs : { emptyText: 'Introduzca valor'} // propiedad cogida de NumericFilter.js           
                	          },
                	          {
  		                		type: 'numeric',
  		                		dataIndex: 'rate',
  		                		menuItemCfgs : { emptyText: 'Introduzca valor'} // propiedad cogida de NumericFilter.js           
                  	          },
                	          {
		                		type: 'string',
		                		dataIndex: 'comuna'                		
                	          },
                	          {
		                		type: 'string',
		                		dataIndex: 'nombreIniciativa'
                	          },
                	          {
		                		type: 'string',
		                		dataIndex: 'fuenteFinanciamiento'		                		           
                	          },
                	          {
  		                		type: 'string',
  		                		dataIndex: 'provision'  		                		           
                  	          },
                	          {
  		                		type: 'numeric',
  		                		dataIndex: 'solicitado',
  		                		menuItemCfgs : { emptyText: 'Introduzca valor'} // propiedad cogida de NumericFilter.js           
                  	          },
                	          {
  		                		type: 'numeric',
  		                		dataIndex: 'ejecutado',
  		                		menuItemCfgs : { emptyText: 'Introduzca valor'} // propiedad cogida de NumericFilter.js           
                  	          },
                	          {
                  	        	type: 'string',
		                		dataIndex: 'servicioResponsable'           
                  	          },
                	          {
                  	        	type: 'string',
		                		dataIndex: 'unidadTecnica'           
                  	          },
                	          {
                  	        	type: 'string',
		                		dataIndex: 'estado'           
                  	          }]
                });
            },
            
            _createModelColumns: function(finish, start) {                
	            // use a factory method to reduce code while demonstrating
	            // that the GridFilter plugin may be configured with or without
	            // the filter types (the filters may be specified on the column model
	            

	                var columns = [{
		                    dataIndex: 'codigoBip',
		                    header: 'Código BIP',
		                    id: 'codigoBip',	                    
		                    filterable: true,
		                    width: 70
	                	}, {
		                    dataIndex: 'rate',
		                    header: 'Rate',
		                    id: 'rate',
		                    filterable: true,
		                    width: 50
	                	},{
		                    dataIndex: 'comuna',
		                    header: 'Comuna',
		                    id: 'comuna',
		                    filterable: true
	                	},{
		                    dataIndex: 'nombreIniciativa',
		                    header: 'Nombre',
		                    id: 'nombreIniciativa',
		                    filterable: true,
		                    width: 200
	                	},{
		                    dataIndex: 'fuenteFinanciamiento',
		                    header: 'Fuente Financiación',
		                    id: 'fuenteFinanciamiento',
		                    filterable: true
	                	},{
		                    dataIndex: 'provision',
		                    header: 'Provisión',
		                    id: 'provision',
		                    filterable: true
	                	},{
		                    dataIndex: 'solicitado',
		                    header: 'Solicitado',
		                    id: 'solicitado',
		                    filterable: true
	                	},{
		                    dataIndex: 'ejecutado',
		                    header: 'Ejecutado',
		                    id: 'ejecutado',
		                    filterable: true
	                	},{
		                    dataIndex: 'servicioResponsable',
		                    header: 'Servicio Responsable',
		                    id: 'servicioResponsable',
		                    filterable: true
	                	},{
		                    dataIndex: 'unidadTecnica',
		                    header: 'Unidad Técnica',
		                    id: 'unidadTecnica',
		                    filterable: true
	                	},{
		                    dataIndex: 'estado',
		                    header: 'Estado',
		                    id: 'estado',
		                    filterable: true
	                	}
	                ];

	                return new Ext.grid.ColumnModel({
	                    columns: columns.slice(start || 0, finish),
	                    defaults: {
	                        sortable: true
	                    }
	                });
	           
            },            
            _createGridInv: function(store) {
            	var context=this;
                var grid=new Ext.grid.GridPanel({                
	                border: true,
	                store: store,    
	                id:'resultsGeo_panel',
	                colModel: context._createModelColumns(11), // PONER NUMERO DE COLUMNAS
	                loadMask: true,	 
	                layout: 'fit',
	                autoScroll: true,
	                plugins: [context._createFilterGridInv()],
	                //autoExpandColumn: 'nombreIniciativa',
	                listeners: {	                    
	                    viewready:{
	                        fn: function(){
	                        	// borra los filtros que pueda quedar
	                        	grid.filters.clearFilters();
	                            // remove options rows sort column
	                            grid.getView().hmenu.getComponent('asc').hide();
	                            grid.getView().hmenu.getComponent('desc').hide();
	                            // remove options rows show/hide column   
	                            grid.getView().hmenu.getComponent('columns').hide();
	                            //grid.getView().hmenu.getComponent('columns').text='Mostrar/Ocultar';
	                            //console.log(grid.getView().hmenu);	                            
	                            // Rename text filter        
	                            grid.getView().hmenu.getComponent('filters').text='Filtro';
 	                            // remove hr into rows
	                            grid.getView().hmenu.getComponent('x-menu-el-ext-comp-1200').hide();
	                            grid.getView().hmenu.getComponent('x-menu-el-ext-comp-1201').hide();
	                            
	                        }
	                    },
	                    afterrender: {
	                        fn: function(component){  
	                                        // remove refresh button
	                                        //component.getBottomToolbar().refresh.hideParent = true;
	                                        //component.getBottomToolbar().refresh.hide(); 
	                        }
	                    },
	                    cellclick: { 
	                    	fn:function(grid, rowIndex, columnIndex, e) {
	                    	// Centrar y zoom en mapa para visualizar la iniciativa seleccionada
	                        // En record.data se tiene los datos de la iniciativa mas la x e y
	                    	// si x e y estan vacios es que no es una iniciativa con datos de georeferenciacion	
	                    	var record = grid.getStore().getAt(rowIndex);	                    	
	                    	var point = new OpenLayers.LonLat(record.data.x, record.data.y);	                    	
	                    	point.transform(new OpenLayers.Projection("EPSG:4326"), context.map.getProjectionObject());
	                    	context.map.setCenter(point,18);	                    	
	        		        
	        		       }
	                    }
	                },        
	                tbar: [		                       	                       
			                {
			                    text: 'Eliminar Filtros',
			                    handler : function(){
			                        grid.filters.clearFilters();
			                       //se elimina la capa filtrada
                            		context._removeLayerFilter();
			                    }
			                }
	                 
	                ],
	                bbar:[	                      
	                      '->',
	                      {
	  	                    text: 'Exportar Excel ',
	  	                    tooltip: 'Exportar Excel',	  	                    
	  	                    handler: function (button, state) {
	  	                        var res = [];
	  	                        grid.getStore().each(function(item){ res.push(item.data); });                	                        
	  	                        context.JSONToCSVConvertor(JSON.stringify(res),"Iniciativas",true);
	  	                    } 
	  	                   }
	                      ]
	                
	            });
                return grid;
        },
            
            
            _createGridInvStore: function() {
            	var context = this;            	
                return new Ext.data.JsonStore({
                    // store configs
                    autoDestroy: true,
                    url: this.baseUrl + '/getProyectosGeo',
                    //url: '../../getProyectosGeo.json',                                                                             
                    idProperty: 'properties.codBip',
                    root: 'data',
                    totalProperty: 'results',
                    remoteSort: false,
                    count: context._totalResult,
                    sortInfo: {
                        field: 'codigoBip',
                        direction: 'ASC'
                    },
                    storeId: 'myStore',                    
                    listeners: {
                        load : function(){
                                this.count = this.getCount();
                                context._totalFilterResult=this.getCount();                                
                        },                        
                        datachanged: {
                            fn: function(){              
                            	;
                                // solo actualiza mapa en caso de filtrado y no ordenación
                            	var numAnterior=context._totalFilterResult;                            	
                            	var numActual=this.getCount();
                            	
                            	
                                if((numAnterior!=numActual)&&(numAnterior!=-1))
                                {
                                    
                                	if(numActual==context._totalResult){ // se elimina todos los filtros
                                		// se elimina la capa filtrada
                                		context._removeLayerFilter();                                 		 
                                	} 	
                                	else {
                                		// filtrado de datos                                		
                                		var datos={'results':numActual,'data':[],'success':true};
                                        this.each(function(item){ datos.data.push(item.json); });                                        
                                        // se elimina la capa filtrada
                                		context._removeLayerFilter();
                                		// se crea de nuevo la capa con iniciativas filtradas
                                		
                                		context.georeferenceInitiativesSuccess(datos,true);
                                	} 
                                	context._totalFilterResult=numActual;
                                    
                                }   
                                 
                    }}},
                    fields: [{
                        name: 'codigoBip',
                        mapping:'properties.codigoBip'
                        
                    }, {
                        name: 'rate',
                        mapping:'properties.rate'
                    },{
                        name: 'comuna',
                        mapping:'properties.comuna'
                    }, {
                        name: 'nombreIniciativa',
                        mapping:'properties.nombreIniciativa'
                    }, {
                        name: 'fuenteFinanciamiento',
                        mapping:'properties.fuenteFinanciamiento'
                    }, {
                        name: 'provision',
                        mapping:'properties.provision'
                    }, {
                        name: 'solicitado',
                        mapping:'properties.solicitado'
                    }, {
                        name: 'ejecutado',
                        mapping:'properties.ejecutado'
                    }, {
                        name: 'servicioResponsable',
                        mapping:'properties.servicioResponsable'
                    }, {
                        name: 'unidadTecnica',
                        mapping:'properties.unidadTecnica'
                    }, {
                        name: 'estado',
                        mapping:'properties.estado'
                    }]
                });
               
            },
            
            // Exportacion a CSV de los resultados
            JSONToCSVConvertor: function (JSONData, ReportTitle, ShowLabel) {
                //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
                var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
                
                var CSV = '';    
                //Set Report title in first row or line
                
                CSV += ReportTitle + '\r\n\n';

                //This condition will generate the Label/Header
                if (ShowLabel) {
                    var row = "";
                    
                    //This loop will extract the label from 1st index of on array
                    for (var index in arrData[0]) {
                        
                        //Now convert each value to string and comma-seprated
                        row += index + ',';
                    }

                    row = row.slice(0, -1);
                    
                    //append Label row with line break
                    CSV += unescape(encodeURIComponent(row)).toUpperCase() + '\r\n';
                }
                
                //1st loop is to extract each row
                for (var i = 0; i < arrData.length; i++) {
                    var row = "";
                    
                    //2nd loop will extract each column and convert it in string comma-seprated
                    for (var index in arrData[i]) {                    	
                    	datacs=unescape(encodeURIComponent(arrData[i][index]));                    	
                    	if(datacs!='null') row += '"' + datacs + '",';
                    	else row += '"",';
                          
                    }

                    row.slice(0, row.length - 1);
                    
                    //add a line break after each row
                    CSV += row + '\r\n';
                }

                if (CSV == '') {        
                    alert("Invalid data");
                    return;
                }   
                
                //Generate a file name
                var fileName = "descarga_";
                //this will remove the blank-spaces from the title and replace it with an underscore
                fileName += ReportTitle.replace(/ /g,"_");   
                
                //Initialize file format you want csv or xls
                var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
                
                // Now the little tricky part.
                // you can use either>> window.open(uri);
                // but this will not work in some browsers
                // or you will not get the correct file extension    
                
                //this trick will generate a temp <a /> tag
                var link = document.createElement("a");    
                link.href = uri;
                
                //set the visibility hidden so it will not effect on your web-layout
                link.style = "visibility:hidden";
                link.download = fileName + ".csv";
                
                //this part will append the anchor tag and remove it after automatic click
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            
            /* FIN DE LO NUEVO */
            
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
            // Eliminar la capa con iniciativas filtradas
            _removeLayerFilter: function() {
            	var ncapa=this.map.getLayersByName(this.LAYER_NAME_FILTER);
            	if(ncapa.length!=0) this.map.removeLayer(ncapa[0]);
            },            
             // filtred: true=>crea la capa con filtrado de iniciativas, false=>crea la capa con todas las iniciativas            
            _getInvestmentLayer: function(filtred) {
            	
            	if(filtred) var nameLayer=this.LAYER_NAME_FILTER;
            	else var nameLayer=this.LAYER_NAME;
            	
                var investmentLayers = this.map.getLayersByName(nameLayer);

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
                    
                    if(filtred) {
                    	var myStyles = new OpenLayers.StyleMap({
                            "default": selectedStyle,
                            "select": selectedStyle
                        });
                    }else{
                    	var myStyles = new OpenLayers.StyleMap({
                            "default": defaultStyle,
                            "select": selectedStyle
                        });
                    }
                    

                    var utm19Projection = new OpenLayers.Projection(
                        "EPSG:32719");
                    var mapProjection = this.map.getProjectionObject();
                    // Create investment layer and add to map
                    investmentLayer = new OpenLayers.Layer.Vector(
                    		nameLayer, {
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