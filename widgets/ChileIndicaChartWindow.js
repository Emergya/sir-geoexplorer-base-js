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
                var num=0;
                // create store con resultados, si hay error en la peticion ajax lanza el mensaje.
                var context=this;
                // close windows if button of view iniciatives is clicked
                if(context._winResultsGrid!=null){
                	context._winResultsGrid.close();
                	context._winResultsGrid=null;
                	// AL igual hay que borrar capas en mapa
                } 
                var storeInv = context._createGridInvStore(num); 
                storeInv.load({
                	params : values,
	               	callback : function(r, options, success) {
	               		    Ext.MessageBox.hide();
	               			if(!success) context.georeferenceInitiativesFailure();
	               			else {
	               				    
	               				    
	               					num=r.length;
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
				               		context._showResultsGrid(this);
				               		Ext.MessageBox.alert("Resultado de la búsqueda",
				                            "Se han encontrado " + data.results +
				                            " proyectos georreferenciados");
				               		// show georeferenciacion
				               		context.georeferenceInitiativesSuccess(dataJson);
				                    
	               			}	               					               				               			
	                    }
                	}
                );
            },
            georeferenceInitiativesSuccess: function(responseJson) {
                //var button = Ext.getCmp('iniciatiavasGeoId');
                //button.enable();                
                //var jsonData = Ext.encode(Ext.pluck(storeInv.data.items, 'data'));
                
                
                /*
                var responseJson = Ext.util.JSON.decode(response.responseText);
                */
                //var jsonExample='{"results":286,"data":[{"properties":{"codBip":"30081714","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.60778,-17.852125]}},{"properties":{"codBip":"30110768","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30152,-18.437927]}},{"properties":{"codBip":"30080182","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2495,-18.589384]}},{"properties":{"codBip":"20156521","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2918,-18.438282]}},{"properties":{"codBip":"30110767","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.27955,-18.44835]}},{"properties":{"codBip":"30110765","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3125,-18.42229]}},{"properties":{"codBip":"30101968","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28482,-18.500265]}},{"properties":{"codBip":"30098735","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.64752216134906,-18.950296602408866,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.64752216134906,-18.950296602408866],[-69.64714158856125,-18.950126222826835]]}},{"properties":{"codBip":"30115518","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.559944,-18.190218]}},{"properties":{"codBip":"30081616","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.30980867219846,-18.48433472320022,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.30980867219846,-18.48433472320022],[-70.30564138635975,-18.48304420233551]]}},{"properties":{"codBip":"30102675","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28818,-18.44344]}},{"properties":{"codBip":"30114064","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.646454,-18.396236]}},{"properties":{"codBip":"30081613","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.30275719192257,-18.485767968415722,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.30275719192257,-18.469816832888753],[-70.29455309618596,-18.485767968415722],[-70.29455309618596,-18.485767968415722]]}},{"properties":{"codBip":"30128532","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29953,-18.48634]}},{"properties":{"codBip":"30086306","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.55937,-18.195705]}},{"properties":{"codBip":"30071261","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.209114,-18.515793]}},{"properties":{"codBip":"30116203","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.299675,-18.48812]}},{"properties":{"codBip":"30123669","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.75111,-18.495834]}},{"properties":{"codBip":"30084584","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.305984,-18.494265]}},{"properties":{"codBip":"30114258","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2994,-18.487713]}},{"properties":{"codBip":"30098202","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.56179,-18.19417]}},{"properties":{"codBip":"30101853","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47466,-17.595968]}},{"properties":{"codBip":"30105251","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29442,-18.491978]}},{"properties":{"codBip":"30115819","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.3335766718657,-18.40604405731514,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.32933079426732,-18.40604405731514],[-70.33237630417588,-18.402019654850367],[-70.3323303121989,-18.400962731012278],[-70.3335766718657,-18.39932745955748],[-70.32722941520295,-18.39493504824119],[-70.32675734364189,-18.395091959953465],[-70.31872854072273,-18.403524491969268],[-70.31876605856158,-18.403479050021474]]}},{"properties":{"codBip":"30084588","etapa":"Diseño","anyo":"2009"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3008,-18.484396]}},{"properties":{"codBip":"30101852","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.661575,-18.026676]}},{"properties":{"codBip":"30105257","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29229,-18.474424]}},{"properties":{"codBip":"30105254","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.292274,-18.467106]}},{"properties":{"codBip":"30113866","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.559944,-18.19283]}},{"properties":{"codBip":"30100949","etapa":"Ejecución","anyo":"2013"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2873,-18.46713]}},{"properties":{"codBip":"30103521","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.25836,-18.42019]}},{"properties":{"codBip":"30101843","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.620155,-17.873325]}},{"properties":{"codBip":"30111094","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.5572,-18.19544]}},{"properties":{"codBip":"30128910","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30806,-18.474262]}},{"properties":{"codBip":"30116469","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30855,-18.473862]}},{"properties":{"codBip":"30082176","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29831,-18.47751]}},{"properties":{"codBip":"30098218","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.56,-18.194176]}},{"properties":{"codBip":"30101845","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.453606,-17.957174]}},{"properties":{"codBip":"30101848","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.68446,-17.696972]}},{"properties":{"codBip":"30101847","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.42429,-17.764538]}},{"properties":{"codBip":"30114758","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30701,-18.458773]}},{"properties":{"codBip":"30113182","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31865,-18.479937]}},{"properties":{"codBip":"30007973","etapa":"Ejecución","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.2958063253653,-18.468536150382274,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.2958063253653,-18.468536150382274],[-70.2930219930897,-18.467235862032595],[-70.2930120414079,-18.465907586758796],[-70.28883539280028,-18.463288380797973]]}},{"properties":{"codBip":"30114561","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3085,-18.473997]}},{"properties":{"codBip":"30045547","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29439,-18.49073]}},{"properties":{"codBip":"30106131","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.25945,-18.53387]}},{"properties":{"codBip":"30102651","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30031,-18.487011]}},{"properties":{"codBip":"30102028","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29602,-18.4744]}},{"properties":{"codBip":"30082697","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47475,-17.595968]}},{"properties":{"codBip":"30114762","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.46398]}},{"properties":{"codBip":"20190469","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.63379,-17.662434]}},{"properties":{"codBip":"30101646","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32098,-18.477985]}},{"properties":{"codBip":"30086329","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.50629,-18.550142]}},{"properties":{"codBip":"30079366","etapa":"Prefactibilidad","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32068,-18.476362]}},{"properties":{"codBip":"30085580","etapa":"Diseño","anyo":"2009"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3092,-18.499899]}},{"properties":{"codBip":"30079365","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.77357,-18.4616]}},{"properties":{"codBip":"30101850","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.34403,-17.82604]}},{"properties":{"codBip":"30101851","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.34539,-17.760815]}},{"properties":{"codBip":"30110759","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.307014,-18.46919]}},{"properties":{"codBip":"30114698","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.86344,-19.005003]}},{"properties":{"codBip":"30114694","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29602,-18.396235]}},{"properties":{"codBip":"30101640","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31948,-18.501915]}},{"properties":{"codBip":"30114695","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.260315,-18.453558]}},{"properties":{"codBip":"30115555","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.92454650213702,-18.772416073121022,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.92454650213702,-18.76949604323377],[-69.90773176638665,-18.772416073121022],[-69.89571140579207,-18.765271554932795],[-69.8871299811791,-18.764291284101787],[-69.88540877953119,-18.7616967712612],[-69.84283636010822,-18.76267069958466],[-69.82670205600141,-18.75941705165004],[-69.81777806617946,-18.76007081619904],[-69.81228215653539,-18.757464945154954],[-69.80232717465437,-18.75876408781269],[-69.80267411988854,-18.75389154068155],[-69.79683341946526,-18.75454008041771],[-69.78653782516712,-18.75193574217487],[-69.78344319657161,-18.747384914184888],[-69.78173171031958,-18.74446399984051],[-69.7724608295455,-18.74381566356437],[-69.76009972594936,-18.741534652979585],[-69.75666226710607,-18.738611455961912],[-69.75323668716433,-18.73406142599958],[-69.74533375161731,-18.73373155965458],[-69.7415618771494,-18.730158712225077],[-69.73709426117597,-18.730158275842424],[-69.72817295450872,-18.733410479684906],[-69.72267820749056,-18.73503138267864],[-69.71923890047263,-18.73373420741185],[-69.7154676171369,-18.732429198609484],[-69.71100535883052,-18.731461120251804],[-69.71031830462437,-18.728210266310484],[-69.70379110201243,-18.725605023670347],[-69.69829785124102,-18.725282162046135],[-69.68765386000904,-18.727228439272633],[-69.68079336921875,-18.726575694383406],[-69.67667030767669,-18.72495485755466],[-69.67460859315486,-18.721699773569934],[-69.66945823000897,-18.721700174367495],[-69.66293884077112,-18.718451792602522],[-69.65847272484919,-18.718774815719904],[-69.65779050163137,-18.71649976624159],[-69.6492038785358,-18.71324910003582],[-69.63684762533943,-18.711294203919493],[-69.63650618799711,-18.711295363750814]]}},{"properties":{"codBip":"30116450","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.33019,-18.39579]}},{"properties":{"codBip":"30114176","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.54621,-18.192833]}},{"properties":{"codBip":"30070232","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.30564138635975,-18.48304420233551,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.30564138635975,-18.48304420233551],[-70.29006941830423,-18.443409011922213]]}},{"properties":{"codBip":"30115404","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.319565,-18.47599]}},{"properties":{"codBip":"30098729","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.504395,-18.462896]}},{"properties":{"codBip":"30104812","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.31666925290564,-18.473696639041155,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.31666925290564,-18.473696639041155],[-70.3096879811394,-18.46844072179999]]}},{"properties":{"codBip":"30099473","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30172,-18.472652]}},{"properties":{"codBip":"30078811","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.309395,-18.49952]}},{"properties":{"codBip":"30034830","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.658325,-18.986904]}},{"properties":{"codBip":"30106251","etapa":"","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30073,-18.48802]}},{"properties":{"codBip":"30108635","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.300026,-18.48827]}},{"properties":{"codBip":"30082608","etapa":"Diseño","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29075,-18.491072]}},{"properties":{"codBip":"30102197","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30693,-18.471107]}},{"properties":{"codBip":"30099368","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.30090041511914,-18.48729678510167,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.30090041511914,-18.48729678510167],[-70.29246618951906,-18.441052279442616]]}},{"properties":{"codBip":"30116879","etapa":"Ejecución","anyo":"2013"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30105,-18.472204]}},{"properties":{"codBip":"30092389","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.68216,-18.828323]}},{"properties":{"codBip":"30101323","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.3035948714704,-18.482984404486835,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.3035948714704,-18.48292275615456],[-70.29460795803128,-18.482984404486835]]}},{"properties":{"codBip":"30103432","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31377,-18.476978]}},{"properties":{"codBip":"30086346","etapa":"Diseño","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.55719,-18.19283]}},{"properties":{"codBip":"30115766","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.25207976166547,-19.18149197750207,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.25207976166547,-19.18149197750207],[-70.23560426469382,-18.31802743475058],[-70.06530774652335,-19.082892272707877],[-70.04882940331986,-18.286738153433056],[-69.8730481182155,-18.99461047490575],[-69.86206659810524,-18.198046043052504],[-69.69177701328167,-18.958252183647197],[-69.7467067959687,-18.08320608385261],[-69.47204834465046,-19.00499693052959],[-69.65332153089862,-17.654497614272838],[-69.2797859053938,-19.088081300954556],[-69.54345960020034,-17.549774757640726],[-69.10949712994558,-19.051740197404655],[-69.37317514606117,-17.7172965694985],[-68.99963911141184,-18.927079580018486],[-69.19738791325814,-18.025753954524983],[-69.20288580255163,-17.98396287176784],[-69.09302388314303,-18.0675362957179],[-69.0710478490471,-18.077985173554403],[-69.08203861659078,-18.07798081582036]]}},{"properties":{"codBip":"30082052","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29693,-18.472532]}},{"properties":{"codBip":"30067319","etapa":"Diseño","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47698,-18.915485]}},{"properties":{"codBip":"30065797","etapa":"Factibilidad","anyo":"2013"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.313705,-18.470337]}},{"properties":{"codBip":"30035869","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29657,-18.476482]}},{"properties":{"codBip":"30104803","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.299736,-18.476118]}},{"properties":{"codBip":"30126416","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28916,-18.465925]}},{"properties":{"codBip":"30086484","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.07148,-18.398193]}},{"properties":{"codBip":"30059925","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47469,-17.596022]}},{"properties":{"codBip":"30112587","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.24521,-18.40796]}},{"properties":{"codBip":"30084409","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31194,-18.343182]}},{"properties":{"codBip":"30106262","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.86415,-18.976805]}},{"properties":{"codBip":"30061013","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47475,-17.595968]}},{"properties":{"codBip":"30112580","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28408,-18.480572]}},{"properties":{"codBip":"30086480","etapa":"Ejecución","anyo":"2009"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3046,-18.475054]}},{"properties":{"codBip":"30073165","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.55957,-18.19567]}},{"properties":{"codBip":"30101324","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.47095945228577,-17.729838821363792,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.47095945228577,-17.62421390277993],[-69.40679705098009,-17.729838821363792]]}},{"properties":{"codBip":"30090010","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.300026,-18.459589]}},{"properties":{"codBip":"30114016","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28363,-18.472107]}},{"properties":{"codBip":"30004302","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29514,-18.472517]}},{"properties":{"codBip":"30113828","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.55444,-18.198051]}},{"properties":{"codBip":"30086334","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.49041,-18.51856]}},{"properties":{"codBip":"30112380","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3125,-18.396238]}},{"properties":{"codBip":"30112249","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30787,-18.466755]}},{"properties":{"codBip":"30067308","etapa":"Diseño","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.17481,-19.048048]}},{"properties":{"codBip":"30081323","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.31949442541674,-18.485758510826617,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.31949442541674,-18.480300564237332],[-70.29593572290236,-18.485758510826617],[-70.28604165740792,-18.461979009210488],[-70.29562746725453,-18.44469948307379]]}},{"properties":{"codBip":"30100305","etapa":"Diseño","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31672,-18.48032]}},{"properties":{"codBip":"30116568","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30701,-18.47961]}},{"properties":{"codBip":"30113287","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.67117827920762,-18.255440105381357,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.67117827920762,-18.255440105381357],[-69.62585474511143,-18.228054938271594],[-69.61624333827265,-18.203267693145197],[-69.5626911610563,-18.200657496269034],[-69.56268588190952,-18.20195899787129],[-69.56269223461662,-18.198045482249512]]}},{"properties":{"codBip":"30105772","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.474724,-17.596176]}},{"properties":{"codBip":"30110702","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.46398]}},{"properties":{"codBip":"30116563","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.766106,-18.553188]}},{"properties":{"codBip":"30070145","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.30836580165746,-18.488348789597996,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.30428937784272,-18.488348789597996],[-70.30836580165746,-18.47640179759723],[-70.28754231472256,-18.476544473292734],[-70.29716846703467,-18.46455987982254],[-70.29453321650455,-18.48312046034257]]}},{"properties":{"codBip":"30106568","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28371,-18.48071]}},{"properties":{"codBip":"30092515","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47481,-17.596031]}},{"properties":{"codBip":"30082591","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30394,-18.482252]}},{"properties":{"codBip":"30110708","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.469194]}},{"properties":{"codBip":"30129311","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29697,-18.472803]}},{"properties":{"codBip":"30102271","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47466,-17.595968]}},{"properties":{"codBip":"30102272","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47466,-17.596058]}},{"properties":{"codBip":"30080479","etapa":"Prefactibilidad","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.29573672953902,-18.459265338641583,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.2929525520238,-18.45796503878732],[-70.29573672953902,-18.459265338641583]]}},{"properties":{"codBip":"30062168","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32106,-18.479097]}},{"properties":{"codBip":"30047599","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31275,-18.482887]}},{"properties":{"codBip":"30100937","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2983,-18.467995]}},{"properties":{"codBip":"30113295","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.56200575441687,-18.23914254033623,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.55307240313668,-18.23914254033623],[-69.54414540757806,-18.230663261865256],[-69.54895400195966,-18.222831599817745],[-69.56200575441687,-18.22282993739277],[-69.56199756276365,-18.208486519591567],[-69.55994474338912,-18.193480234823582],[-69.55925444677236,-18.193482246858114]]}},{"properties":{"codBip":"30114272","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29911,-18.487427]}},{"properties":{"codBip":"30067333","etapa":"Diseño","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.21271,-18.87791]}},{"properties":{"codBip":"30120138","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.41986,-18.453558]}},{"properties":{"codBip":"30067330","etapa":"Diseño","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.57261,-18.739346]}},{"properties":{"codBip":"30105170","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30273,-18.486914]}},{"properties":{"codBip":"30106609","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29596,-18.47478]}},{"properties":{"codBip":"30118061","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30221,-18.4731]}},{"properties":{"codBip":"30086551","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30415,-18.478302]}},{"properties":{"codBip":"30080193","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.29999267106696,-18.47115512194641,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.29716846703467,-18.46455987982254],[-70.29999267106696,-18.47115512194641]]}},{"properties":{"codBip":"30060275","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.061104,-18.450132]}},{"properties":{"codBip":"30084426","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28958,-18.484167]}},{"properties":{"codBip":"20156990","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29036,-18.467823]}},{"properties":{"codBip":"30114274","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29809,-18.473753]}},{"properties":{"codBip":"30043925","etapa":"Diseño","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28735,-18.45138]}},{"properties":{"codBip":"30079398","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.298935,-18.47145]}},{"properties":{"codBip":"30114648","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.290535,-18.469196]}},{"properties":{"codBip":"30106611","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28107,-18.477736]}},{"properties":{"codBip":"30125199","etapa":"Ejecución","anyo":"2013"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29878,-18.4697]}},{"properties":{"codBip":"30092944","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32663,-18.481083]}},{"properties":{"codBip":"30077726","etapa":"Prefactibilidad","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31619,-18.501514]}},{"properties":{"codBip":"30110575","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.293274,-18.484827]}},{"properties":{"codBip":"30110579","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30701,-18.453558]}},{"properties":{"codBip":"30108347","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.32682,-18.062971]}},{"properties":{"codBip":"30069347","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.471796]}},{"properties":{"codBip":"30099524","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.12517,-19.11231]}},{"properties":{"codBip":"20177869","etapa":"Prefactibilidad","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.30835572654401,-18.477778402617783,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.30835572654401,-18.475073531726817],[-70.30004258557052,-18.477778402617783]]}},{"properties":{"codBip":"30099525","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.712585,-18.819]}},{"properties":{"codBip":"30104318","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30318,-18.478743]}},{"properties":{"codBip":"30105955","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.59516,-18.272755]}},{"properties":{"codBip":"30113799","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.202194,-18.057257]}},{"properties":{"codBip":"30106481","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.56627,-18.195866]}},{"properties":{"codBip":"30079149","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.240105,-19.169312]}},{"properties":{"codBip":"30112175","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.29327398087445,-18.57597053566958,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.29327398087445,-18.471797496695345],[-70.23285377221855,-18.492640828362138],[-70.17792642808364,-18.523895846726475],[-70.10101576646395,-18.555138778810345],[-70.05707241645096,-18.570761704707646],[-70.05982330752833,-18.568161726079328],[-70.05157991521747,-18.57597053566958]]}},{"properties":{"codBip":"30110584","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.33568,-18.349115]}},{"properties":{"codBip":"30110585","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30151,-18.443142]}},{"properties":{"codBip":"30102335","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.313225,-18.476595]}},{"properties":{"codBip":"30114915","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28437,-18.464268]}},{"properties":{"codBip":"30096555","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28279,-18.470053]}},{"properties":{"codBip":"30120616","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.23871,-18.589148]}},{"properties":{"codBip":"30098558","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.75584563505453,-18.836262400996556,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.75584563505453,-18.836262400996556],[-69.74494543898987,-18.83316133144613]]}},{"properties":{"codBip":"30102498","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47476,-17.595877]}},{"properties":{"codBip":"30116107","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.458775]}},{"properties":{"codBip":"30102497","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47474,-17.596157]}},{"properties":{"codBip":"30106577","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2911,-18.476927]}},{"properties":{"codBip":"30108605","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.230354,-18.221527]}},{"properties":{"codBip":"30081990","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.51668,-18.576948]}},{"properties":{"codBip":"30091932","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.309715,-18.472416]}},{"properties":{"codBip":"30084696","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30229,-18.445585]}},{"properties":{"codBip":"30115177","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.307014,-18.463985]}},{"properties":{"codBip":"30110571","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29602,-18.479612]}},{"properties":{"codBip":"20177880","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.31391491156543,-18.485662986999966,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.31391491156543,-18.476363390679882],[-70.30981876391971,-18.485662986999966]]}},{"properties":{"codBip":"30084694","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29933,-18.451244]}},{"properties":{"codBip":"30115178","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30152,-18.46398]}},{"properties":{"codBip":"30110574","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.64234,-17.638788]}},{"properties":{"codBip":"30036950","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.498215,-18.582212]}},{"properties":{"codBip":"30114927","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.281784,-18.460789]}},{"properties":{"codBip":"30126365","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30106,-18.489084]}},{"properties":{"codBip":"30114820","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.46398]}},{"properties":{"codBip":"30116268","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.287766,-18.490341]}},{"properties":{"codBip":"30128191","etapa":"Ejecución","anyo":"2013"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29564,-18.471302]}},{"properties":{"codBip":"30113370","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29914,-18.487526]}},{"properties":{"codBip":"30114817","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.26306,-18.453558]}},{"properties":{"codBip":"30037209","etapa":"Ejecución","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.55857,-18.195436]}},{"properties":{"codBip":"30100766","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29817,-18.472559]}},{"properties":{"codBip":"30114411","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.313835,-18.482527]}},{"properties":{"codBip":"30108711","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29602,-18.473423]}},{"properties":{"codBip":"30108906","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.27405,-18.46919]}},{"properties":{"codBip":"30114819","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28504,-18.463984]}},{"properties":{"codBip":"30086735","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29345,-18.43996]}},{"properties":{"codBip":"30114930","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.281586,-18.457003]}},{"properties":{"codBip":"30110547","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30152,-18.471796]}},{"properties":{"codBip":"30123860","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.297935,-18.472271]}},{"properties":{"codBip":"30079146","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30628,-18.504591]}},{"properties":{"codBip":"30077716","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.322975,-18.47725]}},{"properties":{"codBip":"30098818","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.74493,-18.833242]}},{"properties":{"codBip":"30105703","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.474785,-17.596085]}},{"properties":{"codBip":"30106598","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29032,-18.47855]}},{"properties":{"codBip":"30092414","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.47475,-17.595886]}},{"properties":{"codBip":"30086252","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.318665,-18.479872]}},{"properties":{"codBip":"30064923","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.56,-18.194862]}},{"properties":{"codBip":"30108723","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29842,-18.458117]}},{"properties":{"codBip":"30115296","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30152,-18.469193]}},{"properties":{"codBip":"30106591","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29795,-18.476473]}},{"properties":{"codBip":"30108722","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30564,-18.482872]}},{"properties":{"codBip":"30062390","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.559944,-18.195442]}},{"properties":{"codBip":"30115306","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.290535,-18.458776]}},{"properties":{"codBip":"30126383","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.286415,-18.488823]}},{"properties":{"codBip":"30114742","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28504,-18.458769]}},{"properties":{"codBip":"30114743","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30152,-18.46398]}},{"properties":{"codBip":"30091048","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30555,-18.471117]}},{"properties":{"codBip":"30119366","etapa":"Prefactibilidad","anyo":"2013"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.34649566395511,-18.40600791406724,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.32932926030928,-18.352738810550985],[-70.34649566395511,-18.38205846903305],[-70.32950089668567,-18.40600672228089],[-70.32933051684776,-18.40600791406724]]}},{"properties":{"codBip":"30113308","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.60147963486162,-18.283803485533493,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.58809680785855,-18.283803485533493],[-69.59255418869684,-18.278592880101723],[-69.59564450857744,-18.272066890541975],[-69.60147963486162,-18.26326370857319]]}},{"properties":{"codBip":"30114739","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.458775]}},{"properties":{"codBip":"30034648","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.75056,-18.536396]}},{"properties":{"codBip":"30114736","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.290535,-18.463982]}},{"properties":{"codBip":"30110395","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.307014,-18.463985]}},{"properties":{"codBip":"30108588","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.7934,-18.872507]}},{"properties":{"codBip":"30005642","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.26323,-18.503502]}},{"properties":{"codBip":"30085906","etapa":"Diseño","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28778,-18.469196]}},{"properties":{"codBip":"30072411","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29601,-18.47739]}},{"properties":{"codBip":"30078773","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30935,-18.499401]}},{"properties":{"codBip":"30083629","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.42037918588113,-18.284810264602395,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.27706607043736,-18.234615803036277],[-69.27318366434888,-18.231837569163208],[-69.26833663938258,-18.2290696455988],[-69.26832954567828,-18.2244420218314],[-69.26541362989303,-18.222593218750525],[-69.25863083766195,-18.22167153745065],[-69.24893638776446,-18.221684368923377],[-69.24409388885185,-18.221690594834502],[-69.23633207509175,-18.21707267247435],[-69.22955085679294,-18.217080909103192],[-69.22373313864868,-18.216156831097305],[-69.21501539025179,-18.21801967162279],[-69.20532545739835,-18.221736029765655],[-69.198547201349,-18.224526991651615],[-69.19370767765747,-18.227306727187035],[-69.18789079566011,-18.227312517083693],[-69.18304641501882,-18.234728680766956],[-69.18208836792016,-18.241210111876054],[-69.17821580089871,-18.24677235482198],[-69.17240648561632,-18.255111051133305],[-69.16757103008251,-18.263448717718433],[-69.16175893981273,-18.269934223457913],[-69.15497564113328,-18.26993983887426],[-69.14625135775736,-18.268102881302017],[-69.14140107658739,-18.271803218538373],[-69.13656368561773,-18.280149139633114],[-69.12880410772361,-18.2783016603938],[-69.11911526989799,-18.2773769895238],[-69.11038327426732,-18.278313180687014],[-69.10165955929101,-18.277387065429505],[-69.09197237522324,-18.27924483537349],[-69.08421553696814,-18.282032226426075],[-69.07645844572556,-18.284810264602395],[-69.27802937660246,-18.233683459345233],[-69.2809396594764,-18.231826356407776],[-69.2838404217913,-18.229969223764158],[-69.28189549099686,-18.22627541418176],[-69.28478861037951,-18.21978160951955],[-69.28963743390328,-18.217921486965373],[-69.29545083455544,-18.21605975923498],[-69.29835433678572,-18.21605526442096],[-69.30416919547257,-18.2151242203311],[-69.30514032707835,-18.218828394182495],[-69.30707917679348,-18.2188252992304],[-69.31095851202159,-18.219740957173794],[-69.31579926677843,-18.218811137156283],[-69.31773811433055,-18.21880793443996],[-69.32161409865797,-18.21787052611572],[-69.3245202157319,-18.21415991915933],[-69.32741849261024,-18.21138022908527],[-69.3322554092849,-18.208597148195246],[-69.3371051746044,-18.20765774134975],[-69.34097900916626,-18.20579804106148],[-69.34484330349493,-18.20393828055958],[-69.34968918909732,-18.201154748966207],[-69.35258870246398,-18.19929658979572],[-69.35743811139012,-18.198365712594256],[-69.35936156277765,-18.195578321321303],[-69.36517152931292,-18.19279259664938],[-69.3700187223907,-18.190930463371657],[-69.37388237294161,-18.18907012646045],[-69.37968785798608,-18.184422085604922],[-69.38162027830552,-18.181643496019486],[-69.38743145574949,-18.179779011697537],[-69.39226652913786,-18.176994441821634],[-69.4019541277524,-18.175121569591372],[-69.40679526448729,-18.17511138204948],[-69.41165888756733,-18.180659569128405],[-69.41554008363038,-18.182504059947025],[-69.42037918588113,-18.181562588854135],[-69.42037697786901,-18.180640689835187]]}},{"properties":{"codBip":"30091055","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.302704,-18.463194]}},{"properties":{"codBip":"30115964","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.3509546472239,-19.16593091812548,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.10950189673204,-18.109312844579215],[-69.252323138746,-17.957837538416992],[-69.00512984521636,-18.97383170816942],[-69.3841582606545,-17.675435006948984],[-69.06555342208118,-19.03616207051789],[-69.49402551400132,-17.534059234556832],[-69.12048363865891,-19.077698397584857],[-69.56543903620003,-17.555009903867735],[-69.18640332072604,-19.093269485595176],[-69.62586301471042,-17.628320780595942],[-69.2962689583049,-19.09845770070138],[-69.69726855487545,-17.63879188919655],[-69.41711986012504,-19.0309671062334],[-69.74670828081568,-17.63355844298265],[-69.48853095653851,-19.020579818304363],[-69.81262961357626,-17.75392138015964],[-69.59839508708284,-18.999805419578248],[-69.8071319316814,-18.124979632036954],[-69.70276532335225,-18.97383612906602],[-69.90601102884473,-18.18761314400379],[-69.75769307742482,-18.98941638622813],[-69.97192860943082,-18.23457444952759],[-69.81262729823493,-19.010194295605714],[-70.05432591352199,-18.271091733464914],[-69.9499540450822,-19.015386549757682],[-70.11474892401564,-18.29717328730042],[-70.02136692813092,-19.051739233554606],[-70.19715236757857,-18.318028523956624],[-70.12024756114042,-19.108843877982988],[-70.26855835535714,-18.307599921479216],[-70.18067292917115,-19.124414902734145],[-70.3509546472239,-18.312817952463092],[-70.25757243949548,-19.16593091812548]]}},{"properties":{"codBip":"30114731","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32108,-18.475094]}},{"properties":{"codBip":"30126611","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.545105,-18.360338]}},{"properties":{"codBip":"20191628","etapa":"Ejecución","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.855194,-19.007599]}},{"properties":{"codBip":"30102641","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.14471,-18.498653]}},{"properties":{"codBip":"30126602","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.33372,-18.52438]}},{"properties":{"codBip":"30107967","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.26306,-18.458773]}},{"properties":{"codBip":"30126609","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.60259,-18.25951]}},{"properties":{"codBip":"30114724","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2411,-18.440536]}},{"properties":{"codBip":"30114722","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.290535,-18.417084]}},{"properties":{"codBip":"30113302","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.61349666759556,-18.20456827929467,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.61349666759556,-18.199353988189603],[-69.5935895560822,-18.20456827929467],[-69.57848018599832,-18.196742257537565],[-69.55925652180822,-18.194132984688096],[-69.56062447745231,-18.196090264001207]]}},{"properties":{"codBip":"30105931","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.632835,-17.661533]}},{"properties":{"codBip":"30101016","etapa":"Factibilidad","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32407,-18.479473]}},{"properties":{"codBip":"30100796","etapa":"Prefactibilidad","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.32417953891569,-18.47749373900429,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.32417953891569,-18.47749373900429],[-70.31988418614687,-18.47554477570087],[-70.31594248649012,-18.47277095197849],[-70.30975872234336,-18.469027592251383],[-70.30495319434993,-18.465934181057776],[-70.297397157892,-18.45844974867809],[-70.29499537886184,-18.45258350345626],[-70.2949945349173,-18.443628477355528],[-70.29516750859416,-18.433858983840953],[-70.29516727184145,-18.42750641430796]]}},{"properties":{"codBip":"30078145","etapa":"Ejecución","anyo":"2009"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32204,-18.478765]}},{"properties":{"codBip":"30003711","etapa":"Ejecución","anyo":"2009"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.29851057189846,-18.457927054931545,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.29702913466627,-18.446009213408534],[-70.29851057189846,-18.457927054931545]]}},{"properties":{"codBip":"30097489","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-73.67068,-42.016407]}},{"properties":{"codBip":"30099503","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30491,-18.479073]}},{"properties":{"codBip":"30078323","etapa":"Diseño","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.64662946701836,-18.397617967178746,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.64662946701836,-18.397617967178746],[-69.64469604617281,-18.391957826911717]]}},{"properties":{"codBip":"30098642","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.50983793896634,-18.946740796475552,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.50983793896634,-18.946740796475552],[-69.50907542958254,-18.94585722064054]]}},{"properties":{"codBip":"30098643","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.69209647513844,-18.74904646519197,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.69209647513844,-18.74904646519197],[-69.69190586397688,-18.748830272484764]]}},{"properties":{"codBip":"30099706","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.647316,-18.95028]}},{"properties":{"codBip":"30102322","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.293686,-18.44586]}},{"properties":{"codBip":"30099705","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.208466,-18.87832]}},{"properties":{"codBip":"30110598","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.290535,-18.463982]}},{"properties":{"codBip":"30098117","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.684849917718,-18.838506953743018,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.684849917718,-18.838506953743018],[-69.68372960365046,-18.838429731657587]]}},{"properties":{"codBip":"30072028","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30374,-18.471128]}},{"properties":{"codBip":"30098118","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.63402356602886,-18.76276329660326,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-69.63402356602886,-18.76276329660326],[-69.63313001106285,-18.76229637548256]]}},{"properties":{"codBip":"30102316","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29178,-18.474646]}},{"properties":{"codBip":"30088854","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3212,-18.478373]}},{"properties":{"codBip":"30114719","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.64234,-17.644032]}},{"properties":{"codBip":"30108566","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29119,-18.49349]}},{"properties":{"codBip":"30104770","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.306496,-18.493204]}},{"properties":{"codBip":"30072727","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29852,-18.459246]}},{"properties":{"codBip":"30078793","etapa":"Diseño","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28995,-18.485764]}},{"properties":{"codBip":"30105949","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.50579,-18.326048]}},{"properties":{"codBip":"30099515","etapa":"Ejecución","anyo":"2013"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.307724,-18.484348]}},{"properties":{"codBip":"30116297","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2986,-18.486454]}},{"properties":{"codBip":"30003322","etapa":"Diseño","anyo":"2007"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-70.2931808602543,-18.488424989360986,4.9E-324,4.9E-324],"type":"LineString","coordinates":[[-70.29173869934212,-18.48049189521549],[-70.2931808602543,-18.488424989360986]]}},{"properties":{"codBip":"30086402","etapa":"Ejecución","anyo":"2009"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28871,-18.479664]}},{"properties":{"codBip":"30110588","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.32899,-18.448355]}},{"properties":{"codBip":"30102311","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29016,-18.480991]}},{"properties":{"codBip":"30110596","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.323494,-18.469194]}},{"properties":{"codBip":"30114700","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.31251,-18.469189]}},{"properties":{"codBip":"30110595","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29603,-18.46398]}},{"properties":{"codBip":"30114707","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30701,-18.458773]}},{"properties":{"codBip":"30110590","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2978,-18.491909]}},{"properties":{"codBip":"30085555","etapa":"Diseño","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30679,-18.486244]}},{"properties":{"codBip":"30114704","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.293274,-18.471798]}},{"properties":{"codBip":"30114321","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30427,-18.463987]}},{"properties":{"codBip":"30086606","etapa":"Ejecución","anyo":"2009"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.29783,-18.47098]}},{"properties":{"codBip":"30104970","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30176,-18.471802]}},{"properties":{"codBip":"30114708","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.27131,-18.437933]}},{"properties":{"codBip":"30096582","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30084,-18.47958]}},{"properties":{"codBip":"30106600","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30783,-18.472195]}}],"success":true}';
               // var jsonExample='{"results":8,"data":[{"properties":{"codBip":"30081714","titulo":"Aceramiento de carreteras","etapa":"Ejecución","anyo":"2008"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-69.60778,-17.852125]}},{"properties":{"codBip":"30110768","titulo":"Aceramiento en Arica","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.30152,-18.437927]}},{"properties":{"codBip":"30080182","titulo":"Plan de evacuación de lodos","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2495,-18.589384]}},{"properties":{"codBip":"20156521","titulo":"Plan contra uracanes","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.2918,-18.438282]}},{"properties":{"codBip":"30110767","titulo":"Escuela en Paranicota","etapa":"Ejecución","anyo":"2012"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.27955,-18.44835]}},{"properties":{"codBip":"30110765","titulo":"Regadio en rio mares","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.3125,-18.42229]}},{"properties":{"codBip":"30101968","titulo":"Incentivos contra incendios","etapa":"Ejecución","anyo":"2011"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"type":"Point","coordinates":[-70.28482,-18.500265]}},{"properties":{"codBip":"30098735","titulo":"Plan económico contra PYMES","etapa":"Ejecución","anyo":"2010"},"type":"Feature","geometry":{"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"bbox":[-69.64752216134906,-18.950296602408866,5e-324,5e-324],"type":"LineString","coordinates":[[-69.64752216134906,-18.950296602408866],[-69.64714158856125,-18.950126222826835]]}}],"success":true}';                
               // var responseJson = Ext.util.JSON.decode(jsonExample);
                
                console.log(responseJson.data);
                var investmentLayer = this._getInvestmentLayer();
                var baseUrl = this.baseUrl;

                investmentLayer.removeAllFeatures();

                var featureCollection = {
                    type: 'FeatureCollection',
                    features: responseJson.data
                };
                
                
                
                //this._showResultsGrid(responseJson);
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
		                    width: 100
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
		                    filterable: true
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
	                            grid.getView().hmenu.getComponent('ext-comp-1206').hide();
	                            grid.getView().hmenu.getComponent('ext-comp-1208').hide();
	                            
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
	                    	
	                    	var record = grid.getStore().getAt(rowIndex);
	                    	var x=record.data.x;
	                    	var y=record.data.y;
	                    	console.log(x);
	                    	console.log(y);
	                    	var point = new OpenLayers.LonLat(x, y);	                    	
	                    	point.transform(new OpenLayers.Projection("EPSG:4326"), context.map.getProjectionObject());
	                    	context.map.setCenter(point,18);
	                    	//context.map.zoom=60;
	                    	
	        		        //var zRec = iView.getRecord(iRowEl);
                    		//console.log(record.get("x"));
                    		//console.log(record.get("y"));
                    		
	        		        //console.log(zRec.data.name);
	        		        
	        		       }
	                    }
	                },        
	                tbar: [		                       	                       
			                {
			                    text: 'Eliminar Filtros',
			                    handler : function(){
			                        grid.filters.clearFilters();
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
            
            
            _createGridInvStore: function(num) {
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
                    sortInfo: {
                        field: 'codigoBip',
                        direction: 'ASC'
                    },
                    storeId: 'myStore',
                    count : num,
                    listeners: {
                        load : function(){
                                this.count = this.getCount();
                                num=this.getCount();                                
                        },                        
                        datachanged: {
                            fn: function(){                            	
                                // solo actualiza mapa en caso de filtrado y no ordenación
                                if((num!=this.getCount()&&(num!=0)))
                                {
                                    num = this.getCount();
                                    var datos={'results':num,'data':[],'success':true};
                                    this.each(function(item){ datos.data.push(item.data); });
                                    console.log("Iniciativas filtradas a resaltar");
                                    console.log(JSON.stringify(datos));   
                                    //context.georeferenceInitiativesSuccess(datos);
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
                        row += '"' + unescape(encodeURIComponent(arrData[i][index])) + '",';
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