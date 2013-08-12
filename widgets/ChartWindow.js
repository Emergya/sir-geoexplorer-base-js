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
 * Author: Juan Luis Rodriguez Ponce <jlrodriguez@emergya.com>
 */

Viewer.dialog.ChartWindow = Ext
        .extend(
                Ext.Window,
                {
                    LAYER_NAME : 'Iniciativas de Inversión',
                    map : null,
                    selectControl : null,
                    baseUrl : '../..',
                    layerController : null,
                    vectorLayer : null,
                    _barStore : null,
                    _pieStore : null,
                    title : 'Chart window',
                    topTitleText : 'SEARCH CRITERIAS',
                    stageText : 'State',
                    yearText : 'Year',
                    sourceText : 'Source',
                    financingLineText : 'Financing Line',
                    sectorText : 'Sector',
                    territorialLevelText : 'Territorial Level',
                    groupByText : "Group by",
                    proyectosPreinversionText : 'Preinvesment',
                    proyectosEjecucionText : 'PROPIR execution',
                    exchangeChartsText : "Exchange",
                    graphicButtonText : 'Render',
                    centerTitleText : 'Chart',
                    eastTitleText : 'Chart',
                    xAxisTitle : 'Amount',
                    porcionOtrosText : 'Others',
                    geoButtonText : 'Search geo referenced initiatives',

                    // This is used to know which chart is the big one.
                    _bigChart : null,

                    constructor : function (config) {

                        this.listeners = {
                            beforerender : this.onBeforeRender,
                            show : this._onShow,
                            resize : this._onResize,
                            scope : this
                        };

                        Viewer.dialog.ChartWindow.superclass.constructor.call(
                                this, Ext.apply({
                                    cls : 'vw_chart_window',
                                    title : this.title,
                                    width : 1000,
                                    height : 600,
                                    minHeight : 450,
                                    minWidth : 700,
                                    closeAction : 'hide',
                                    layout : 'column',
                                    maximizable : true
                                }, config));

                        this.layerController = Viewer.getController('Layers');
                        this.selectedFeatures = this.layerController
                                .getSelectedFeatures();

                        var context = this;
                        this._barStore = new Ext.data.JsonStore({
                            url : context.baseUrl + '/inversion/getMontosGroupBy',
                            storeId : 'barStoreId',
                            root : 'data',
                            idProperty : 'groupBy',
                            fields : [ {
                                name : 'groupBy',
                                type : 'string'
                            }, {
                                name : 'monto',
                                type : 'float'
                            }, {
                                name : 'numProyectos',
                                type : 'int'
                            } ],
                            autoload : false
                        });
                        this._pieStore = new Ext.data.JsonStore({
                            url : context.baseUrl + '/inversion/getMontosGroupBy',
                            storeId : 'pieStoreId',
                            root : 'data',
                            idProperty : 'groupBy',
                            fields : [ {
                                name : 'groupBy',
                                type : 'string'
                            }, {
                                name : 'monto',
                                type : 'float'
                            }, {
                                name : 'numProyectos',
                                type : 'int'
                            } ],
                            autoload : false
                        });

                        this.map.events.register('preremovelayer', this,
                                this.layerRemoved);

                        // this.map.addLayer(this.vectorLayer);
                    },
                    layerRemoved : function (evt) {
                        if (evt.layer == this.layer) {
                            if (this.selectControl) {
                                this.selectControl.unselectAll();
                                this.map.removeControl(this.selectControl);
                                this.selectControl = null;
                            }

                        }
                    },
                    generateData : function generateData () {
                        var data = [];
                        for ( var i = 0; i < 12; ++i) {
                            data
                                    .push([
                                            Date.monthNames[i],
                                            (Math.floor(Math.random() * 11) + 1) * 100 ]);
                        }
                        return data;
                    },

                    _onResize : function () {
                        if (!this.hidden) {
                            this.doLayout();
                            this._doChartsCreation(false);
                        }
                    },
                    _onShow : function () {
                        this._bigChart = "bars";
                        this._doChartsCreation(true);
                    },

                    onHide : function () {
                    },
                    updateGroupBy : function () {
                        var sector = Ext.getCmp('sectorId').getValue();
                        var fuente = Ext.getCmp('fuenteId').getValue();
                        var store = Ext.StoreMgr.get('agruparPorStoreId');

                        var arrayCampos = [];
                        arrayCampos.push([ 'nivelTerritorial', 'Comuna' ]);

                        if (fuente === 'Todos') {
                            arrayCampos.push([ 'fuente', 'Fuente' ]);
                        }
                        if (sector === 'Todos') {
                            arrayCampos.push([ 'sector', 'Sector' ]);
                        }
                        store.loadData(arrayCampos, false);
                    },

                    onBeforeRender : function () {
                        
                        
                        var c = [
                                {
                                    xtype : "panel",
                                    layout : "border",
                                    padding : 0,
                                    width : 350,
                                    items : [ this._createSearchForm(),
                                            this._createSmallChart()

                                    ]
                                }, this._createBigChart() ];

                        this.add(c);
                    },

                    _createSmallChart : function () {
                        return {
                            // region: 'center',
                            cls : "smallChart",
                            columnWidth : 1,
                            xtype : 'gvisualization',
                            region : "south",
                            height : 250,
                            id : 'smallChartId',
                            visualizationPkgs : {
                                'corechart' : 'ColumnChart'
                            },
                            visualizationPkg : 'corechart',
                            html : '<div class="chartLoading">Cargando...</div>',
                            flex : 1,
                            buttons : [ {
                                id : "exchangeChartsBtn",
                                text : this.exchangeChartsText,
                                handler : this._exchangeCharts,
                                scope : this
                            } ],
                            visualizationCfg : {
                                vAxis : {
                                    title : this.xAxisTitle,
                                    textPosition : "in"
                                },
                                hAxis : {
                                    textStyle : {
                                        fontSize : 8
                                    }
                                },
                                legend : {
                                    position : 'in'
                                },
                                title : "Monto Solicitado en sector:"
                            },
                            store : this._barStore,
                            columns : [
                                    {
                                        dataIndex : 'groupBy',
                                        label : ''
                                    },
                                    {
                                        dataIndex : 'monto',
                                        label : 'Monto'
                                    },
                                    {
                                        tooltip : true,
                                        fields : [ 'groupBy', 'monto',
                                                'numProyectos' ],

                                        template : new Ext.Template(
                                                '{groupBy}: {monto:number("0.000/i")} CL$ en {numProyectos} iniciativas',
                                                {
                                                    compiled : true
                                                })
                                    } ]
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

                    _createBigChart : function () {
                        return {
                            xtype : 'gvisualization',
                            // region: 'east',
                            columnWidth : 1,
                            cls : "chart",
                            layout : 'fit',
                            id : 'bigChartId',
                            html : '<div class="chartLoading">Cargando...</div>',
                            flex : 1,
                            buttons : [ {
                                id : 'iniciatiavasGeoId',
                                text : this.geoButtonText,
                                handler : this.georeferenceInitiatives,
                                scope : this
                            } ],
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
                                    height : "90%"
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
                                                '{monto}: {monto:number("0.000.000/i")} CL$ en {numProyectos} iniciativas',
                                                {
                                                    compiled : true
                                                })
                                    } ]

                        };
                    },

                    _getBarChartCfg : function (formValues, small) {
                        var groupingByCombo = Ext.getCmp('agruparPorId');
                        var groupingByText = groupingByCombo.findRecord(
                                groupingByCombo.valueField || groupingByCombo.displayField,
                                groupingByCombo.getValue()).get(
                                groupingByCombo.displayField);
                        return {
                            visualizationPkgs : {
                                'corechart' : 'ColumnChart'
                            },
                            visualizationPkg : 'corechart',
                            visualizationCfg : {
                                vAxis : {
                                    title : this.xAxisTitle,
                                    textPosition : "in"
                                },
                                hAxis : {
                                    textStyle : {
                                        fontSize : 9
                                    },
                                    slantedTextAngle : 45
                                },
                                legend : {
                                    position : 'in'
                                },
                                chartArea : {
                                    width : small ? "70%" : "90%",
                                    height : small ? "70%" : "75%"
                                },
                                title : "Monto Solicitado en sector: " +
                                        formValues.sector + " - " +
                                        "Fuente: " + formValues.fuente +
                                        " - " + "Año: " + formValues.anyo +
                                        " - Agrupado por: " + groupingByText
                            },
                            store : this._barStore,
                            columns : [
                                    {
                                        dataIndex : 'groupBy',
                                        label : ''
                                    },
                                    {
                                        dataIndex : 'monto',
                                        label : 'Monto'
                                    },
                                    {
                                        tooltip : true,
                                        fields : [ 'groupBy', 'monto',
                                                'numProyectos' ],

                                        template : new Ext.Template(
                                                '{groupBy}: {monto:number("0.000.000/i")} CL$ en {numProyectos} iniciativas',
                                                {
                                                    compiled : true
                                                })
                                    } ]
                        };
                    },

                    _getPieChartCfg : function (formValues, small) {
                        var projectTypeCombo = Ext.getCmp('tipoProyectoId');
                        var projectTypeText = projectTypeCombo.findRecord(
                                projectTypeCombo.valueField || projectTypeCombo.displayField,
                                projectTypeCombo.getValue()).get(
                                projectTypeCombo.displayField);

                        return {
                            visualizationPkgs : {
                                'corechart' : 'PieChart'
                            },
                            visualizationPkg : 'corechart',
                            visualizationCfg : {
                                title : projectTypeText + " - Año: " +
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
                                url : this.baseUrl + '/inversion/getFuentes'
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

                    _createYearStore : function () {
                        return new Ext.data.Store({
                            reader : new Ext.data.JsonReader({
                                fields : [ 'anyo' ],
                                root : 'data'
                            }),
                            proxy : new Ext.data.HttpProxy({
                                url : this.baseUrl + '/inversion/getAnyos'
                            }),
                            remoteSort : true,
                            autoLoad : true,
                            baseParams : {
                                tipoProyecto : 'PREINVERSION'
                            },
                            listeners : {
                                load : function (store, records, options) {
                                    // Autoselect first result

                                    var anyoCombo = Ext.getCmp('anyoId');

                                    if (records.length !== 0) {
                                        anyoCombo.setValue(records[0]
                                                .get('anyo'));
                                        anyoCombo.fireEvent('select',
                                                anyoCombo, records[0], 0);
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
                                url : this.baseUrl + '/inversion/getSectores'
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

                    _createSearchForm : function () {

                        var sourceStore = this._createSourceStore();
                        var yearsStore = this._createYearStore();
                        var lineStore = this._createLineStore();
                        var sectorStore = this._createSectorStore();
                        var nivelTerritorialStore = this
                                ._createAreaLevelStore();
                        var agruparPorStore = this._createGroupingStore();

                        return {
                            xtype : 'form',
                            title : this.topTitleText,
                            // region: 'west',
                            region : "center",
                            id : 'inversion-form-region',
                            labelWidth : 100,
                            defaultType : 'combo',
                            defaults : {
                                listClass : "vw_chart_window_combo_list"
                            },
                            flex : 1,
                            items : [
                                    {
                                        id : 'tipoProyectoId',
                                        fieldLabel : this.stageText,
                                        hiddenName : 'tipoProyecto',
                                        mode : 'local',
                                        triggerAction : 'all',
                                        value : 'PREINVERSION',
                                        store : [
                                                [
                                                        'PREINVERSION',
                                                        this.proyectosPreinversionText ],
                                                [
                                                        'EJECUCION',
                                                        this.proyectosEjecucionText ] ],
                                        valueField : 'value',
                                        displayField : 'label',
                                        forceSelection : true,
                                        selectOnFocus : true,
                                        editable : false,
                                        listeners : {
                                            select : function (e) {

                                                var tipoProyecto = Ext.getCmp(
                                                        'tipoProyectoId')
                                                        .getValue();
                                                var anyoCombo = Ext
                                                        .getCmp('anyoId');

                                                // reload anyo
                                                anyoCombo.store.removeAll();
                                                anyoCombo.store
                                                        .reload({
                                                            params : {
                                                                tipoProyecto : tipoProyecto
                                                            }
                                                        });
                                            },
                                            scope : this
                                        }
                                    },
                                    {
                                        id : 'anyoId',
                                        fieldLabel : this.yearText,
                                        hiddenName : 'anyo',
                                        store : yearsStore,
                                        valueField : 'anyo',
                                        displayField : 'anyo',
                                        forceSelection : true,
                                        editable : false,
                                        triggerAction : 'all',
                                        listeners : {
                                            select : function (combo, record,
                                                    index) {
                                                var tipoProyecto = Ext.getCmp(
                                                        'tipoProyectoId')
                                                        .getValue();
                                                var fuenteCombo = Ext
                                                        .getCmp('fuenteId');
                                                var anyo = record.get('anyo');

                                                // reload fuente
                                                fuenteCombo.store.removeAll();
                                                fuenteCombo.store
                                                        .reload({
                                                            params : {
                                                                tipoProyecto : tipoProyecto,
                                                                anyo : anyo
                                                            }
                                                        });
                                            },
                                            focus : function (combo) {
                                                // setBaseParams
                                                var tipoProyecto = Ext.getCmp(
                                                        'tipoProyectoId')
                                                        .getValue();
                                                combo.store.setBaseParam(
                                                        'tipoProyecto',
                                                        tipoProyecto);
                                            },
                                            scope : this
                                        }
                                    },
                                    {
                                        id : 'fuenteId',
                                        fieldLabel : this.sourceText,
                                        hiddenName : 'fuente',
                                        store : sourceStore,
                                        valueField : 'fuente',
                                        displayField : 'fuente',
                                        forceSelection : true,
                                        editable : false,
                                        triggerAction : 'all',
                                        listeners : {
                                            select : function (combo, record,
                                                    index) {
                                                // clear financial line combo
                                                var tipoProyecto = Ext.getCmp(
                                                        'tipoProyectoId')
                                                        .getValue();
                                                var fuente = Ext.getCmp(
                                                        'fuenteId').getValue();
                                                var anyo = Ext.getCmp('anyoId')
                                                        .getValue();
                                                var lineaCombo = Ext
                                                        .getCmp('lineaId');
                                                lineaCombo.store.removeAll();
                                                lineaCombo.store
                                                        .reload({
                                                            params : {
                                                                tipoProyecto : tipoProyecto,
                                                                anyo : anyo,
                                                                fuente : fuente
                                                            }
                                                        });
                                            },
                                            focus : function (combo) {
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
                                            scope : this
                                        }
                                    },
                                    {
                                        id : 'lineaId',
                                        fieldLabel : this.financingLineText,
                                        hiddenName : 'lineaFinanciera',
                                        store : lineStore,
                                        valueField : 'linea',
                                        displayField : 'linea',
                                        forceSelection : true,
                                        editable : false,
                                        triggerAction : 'all',
                                        listeners : {
                                            select : function (combo, record,
                                                    index) {
                                                // clear sector combo
                                                var tipoProyecto = Ext.getCmp(
                                                        'tipoProyectoId')
                                                        .getValue();
                                                var fuente = Ext.getCmp(
                                                        'fuenteId').getValue();
                                                var anyo = Ext.getCmp('anyoId')
                                                        .getValue();
                                                var linea = Ext.getCmp(
                                                        'lineaId').getValue();
                                                var sectorCombo = Ext
                                                        .getCmp('sectorId');

                                                sectorCombo.store.removeAll();
                                                sectorCombo.store
                                                        .reload({
                                                            params : {
                                                                tipoProyecto : tipoProyecto,
                                                                anyo : anyo,
                                                                fuente : fuente,
                                                                lineaFinanciera : linea
                                                            }
                                                        });
                                            },
                                            focus : function (combo) {
                                                // setBaseParams
                                                var tipoProyecto = Ext.getCmp(
                                                        'tipoProyectoId')
                                                        .getValue();
                                                var anyo = Ext.getCmp('anyoId')
                                                        .getValue();
                                                var fuente = Ext.getCmp(
                                                        'fuenteId').getValue();
                                                combo.store.setBaseParam(
                                                        'tipoProyecto',
                                                        tipoProyecto);
                                                combo.store.setBaseParam(
                                                        'anyo', anyo);
                                                combo.store.setBaseParam(
                                                        'fuente', fuente);
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
                                        listeners : {
                                            select : function (combo, record,
                                                    index) {
                                                this.updateGroupBy();
                                            },
                                            focus : function (combo) {
                                                var tipoProyecto = Ext.getCmp(
                                                        'tipoProyectoId')
                                                        .getValue();
                                                var fuente = Ext.getCmp(
                                                        'fuenteId').getValue();
                                                var anyo = Ext.getCmp('anyoId')
                                                        .getValue();
                                                var linea = Ext.getCmp(
                                                        'lineaId').getValue();

                                                combo.store.setBaseParam(
                                                        'tipoProyecto',
                                                        tipoProyecto);
                                                combo.store.setBaseParam(
                                                        'anyo', anyo);
                                                combo.store.setBaseParam(
                                                        'fuente', fuente);
                                                combo.store.setBaseParam(
                                                        'lineaFinanciera',
                                                        linea);
                                            },
                                            scope : this
                                        }
                                    }, {
                                        id : 'nivelTerritorialId',
                                        fieldLabel : this.territorialLevelText,
                                        hiddenName : 'nivelTerritorial',
                                        store : nivelTerritorialStore,
                                        valueField : 'nivelTerritorial',
                                        displayField : 'nivelTerritorial',
                                        forceSelection : true,
                                        editable : false,
                                        triggerAction : 'all',
                                        value : 'Regional'

                                    }, {
                                        id : 'agruparPorId',
                                        fieldLabel : this.groupByText,
                                        hiddenName : 'agruparPor',
                                        store : agruparPorStore,
                                        valueField : 'idCampo',
                                        displayField : 'nombreCampo',
                                        forceSelection : true,
                                        editable : false,
                                        triggerAction : 'all',
                                        mode : 'local',
                                        listeners : {
                                            afterrender : function (combo) {
                                                this.updateGroupBy();
                                            },
                                            focus : function () {

                                                this.updateGroupBy();
                                            },
                                            scope : this
                                        }

                                    }

                            ],
                            buttons : [ {
                                scope : this,
                                text : this.graphicButtonText,
                                handler : function () {
                                    this._doChartsCreation(false);
                                }

                            } ]
                        };
                    },

                    _createAreaLevelStore : function () {
                        return new Ext.data.Store({
                            reader : new Ext.data.JsonReader({
                                fields : [ 'nivelTerritorial' ],
                                root : 'data'
                            }),
                            proxy : new Ext.data.HttpProxy({
                                url : this.baseUrl + '/inversion/getNivelesTerritoriales'
                            }),
                            remoteSort : true

                        });
                    },

                    _createGroupingStore : function () {
                        return new Ext.data.ArrayStore({
                            storeId : 'agruparPorStoreId',
                            idIndex : 0,
                            fields : [ 'idCampo', 'nombreCampo' ],
                            autoload : false,
                            listeners : {
                                load : function (store, records, options) {
                                    var combo = Ext.getCmp('agruparPorId');
                                    if (combo) {
                                        combo.setValue(records[0]
                                                .get('idCampo'));
                                        combo.fireEvent('select', combo,
                                                records[0], 0);
                                    }
                                },
                                scope : this
                            }
                        });
                    },

                    _createLineStore : function () {
                        return new Ext.data.Store({
                            reader : new Ext.data.JsonReader({
                                fields : [ 'linea' ],
                                root : 'data'
                            }),
                            proxy : new Ext.data.HttpProxy({
                                url : this.baseUrl + '/inversion/getLineasFinancieras'
                            }),
                            remotSort : true,
                            autoLoad : false,
                            listeners : {
                                load : function (store, records, options) {

                                    var lineaCombo = Ext.getCmp('lineaId');
                                    if (records.length !== 0) {
                                        lineaCombo.setValue(records[0]
                                                .get('linea'));
                                        lineaCombo.fireEvent('select',
                                                lineaCombo, records[0], 0);
                                    }
                                },
                                scope : this
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
                                'tipoProyecto' : formValues.tipoProyecto,
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
                    _reInitChart : function (chart) {
                        if (typeof chart.visualizationPkg === 'object') {
                            Ext.apply(chart.visualizationPkgs,
                                    chart.visualizationPkg);
                            for ( var key in chart.visualizationPkg) {
                                chart.visualizationPkg = key;
                                break;
                            }
                        }
                        google.load(chart.visualizationAPI,
                                chart.visualizationAPIVer, {
                                    packages : [ chart.visualizationPkg ],
                                    callback : chart.onLoadCallback
                                            .createDelegate(chart)
                                });
                        chart.store = Ext.StoreMgr.lookup(chart.store);
                        chart.store.addListener('datachanged',
                                chart.datachanged, chart);
                    },

                    georeferenceInitiatives : function () {
                        var values = Ext.getCmp('inversion-form-region')
                                .getForm().getValues();
                        var button = Ext.getCmp('iniciatiavasGeoId');
                        button.setDisabled(true);

                        Ext.Ajax.request({
                            url : this.baseUrl + '/inversion/getProyectosGeo',
                            success : this.georeferenceInitiativesSuccess,
                            failure : this.georeferenceInitiativesFailure,
                            params : values,
                            scope : this

                        });

                    },
                    georeferenceInitiativesSuccess : function (response,
                            options) {
                        var button = Ext.getCmp('iniciatiavasGeoId');
                        button.enable();
                        var responseJson = Ext.util.JSON
                                .decode(response.responseText);
                        var investmentLayers = this.map
                                .getLayersByName(this.LAYER_NAME);
                        var investmentLayer = null;
                        var baseUrl = this.baseUrl;
                        if (investmentLayers.length === 0) {
                            var defaultStyle = new OpenLayers.Style({
                                externalGraphic : baseUrl + '/img/marker-blue.png',
                                fill : false,
                                stroke : false,
                                pointRadius : 0,
                                graphicWidth : 18,
                                graphicHeight : 30,
                                fillOpacity : 1,
                                graphicXOffset : -30 / 2,
                                graphicYOffset : -18 / 2,
                                cursor : 'pointer',
                                graphicZIndex : 1
                            });
                            var selectedStyle = new OpenLayers.Style({
                                externalGraphic : baseUrl + '/img/marker-red.png',
                                fill : false,
                                stroke : false,
                                pointRadius : 0,
                                graphicWidth : 18,
                                graphicHeight : 30,
                                fillOpacity : 1,
                                graphicXOffset : -30 / 2,
                                graphicYOffset : -18 / 2,
                                cursor : 'pointer',
                                graphicZIndex : 1000
                            });

                            var myStyles = new OpenLayers.StyleMap({
                                "default" : defaultStyle,
                                "select" : selectedStyle
                            });

                            var utm19Projection = new OpenLayers.Projection(
                                    "EPSG:32719");
                            var mapProjection = this.map.getProjectionObject();
                            // Create investment layer and add to map
                            investmentLayer = new OpenLayers.Layer.Vector(
                                    this.LAYER_NAME,
                                    {
                                        styleMap : myStyles,
                                        preFeatureInsert : function (feature) {
                                            OpenLayers.Projection.transform(
                                                    feature.geometry,
                                                    utm19Projection,
                                                    mapProjection);

                                        },
                                        eventListeners : {
                                            'featureselected' : function (evt) {
                                                var feature = evt.feature;
                                                // create the select feature
                                                // control
                                                var popupWindow = new Viewer.plugins.FichaInversion(
                                                        {
                                                            feature : feature,
                                                            location : feature,
                                                            baseUrl : this.baseUrl,
                                                            anchored : false

                                                        });
                                                popupWindow
                                                        .on(
                                                                'close',
                                                                function (p) {
                                                                    feature.popupWindow = null;
                                                                    this.selectControl
                                                                            .unselect(feature);
                                                                }, this);
                                                feature.popupWindow = popupWindow;

                                                popupWindow.createPopup();

                                            },
                                            'featureunselected' : function (evt) {
                                                var feature = evt.feature;
                                                if (feature.popupWindow) {
                                                    feature.popupWindow.close();
                                                    feature.popupWindow = null;
                                                }
                                            },
                                            scope : this
                                        }
                                    });
                            var selector = new OpenLayers.Control.SelectFeature(
                                    investmentLayer, {
                                        hover : false,
                                        autoActivate : true,
                                        clickout : true,
                                        multiple : false,
                                        box : false,
                                        toggle : true

                                    });
                            this.layer = investmentLayer;
                            this.selectControl = selector;
                            this.map.addLayer(investmentLayer);
                            this.map.addControl(selector);

                        } else {
                            investmentLayer = investmentLayers[0];
                        }
                        investmentLayer.removeAllFeatures();
                        var featureCollection = {
                            type : 'FeatureCollection',
                            features : responseJson.data
                        };
                        var geojsonFormat = new OpenLayers.Format.GeoJSON();
                        var features = geojsonFormat.read(featureCollection);
                        investmentLayer.addFeatures(features);
                        Ext.MessageBox.alert("Resultado de la búsqueda",
                                "Se han encontrado " + responseJson.results +
                                        " proyectos georreferenciados");
                        if (responseJson.results > 0) {
                            var extent = investmentLayer.getDataExtent();
                            this.map.zoomToExtent(extent);

                        }

                    },
                    georeferenceInitiativesFailure : function (response,
                            options) {
                        var button = Ext.getCmp('iniciatiavasGeoId');
                        button.enable();
                        Ext.MessageBox
                                .alert("Resultado de la búsqueda",
                                        "Se ha producido un error al realizar la búsqueda.");
                    }
                });
