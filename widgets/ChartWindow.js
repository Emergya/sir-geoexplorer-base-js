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

Viewer.dialog.ChartWindow = Ext.extend(Ext.Window, {
    LAYER_NAME: 'Iniciativas de Inversión',
    map: null,
    selectControl: null,
    baseUrl: '../..',
    layerController: null,
    vectorLayer: null,
    barStore: null,
    pieStore: null,
    title: 'Chart window',
    topTitleText: 'SEARCH CRITERIAS',
    stageText: 'State',
    yearText: 'Year',
    sourceText: 'Source',
    financingLineText: 'Financing Line',
    sectorText: 'Sector',
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


    constructor: function (config) {

        this.listeners = {
            beforerender: this.onBeforeRender,
            show: this._onShow,
            scope: this
        };

        Viewer.dialog.ChartWindow.superclass.constructor.call(this, Ext.apply({
            cls: 'vw_chart_window',
            title: this.title,
            width: 1000,
            height: 300,
            closeAction: 'hide',
            layout: 'column',
            maximizable: true
        }, config));

        this.layerController = Viewer.getController('Layers');
        this.selectedFeatures = this.layerController.getSelectedFeatures();

        
        var context = this;
         this.barStore = new Ext.data.JsonStore({
        	 url: context.baseUrl + '/inversion/getMontosGroupBy',
        	 storeId: 'barStoreId',
        	 root: 'data',
        	 idProperty: 'groupBy',
             fields: [
                 {name: 'groupBy', type: 'string'}
                 ,{name: 'monto', type: 'float'}
                 ,{name: 'numProyectos', type: 'int'}
             ],
             autoload: false             
         });
         this.pieStore = new Ext.data.JsonStore({
        	 url: context.baseUrl + '/inversion/getMontosGroupBy',
        	 storeId: 'pieStoreId',
        	 root: 'data',
        	 idProperty: 'groupBy',
             fields: [
                 {name: 'groupBy', type: 'string'}
                 ,{name: 'monto', type: 'float'}
                 ,{name: 'numProyectos', type: 'int'}
             ],
             autoload: false             
         });
         this.on('resize', function() {
        	 this.items.each(function(i) {
	                		if (i.rendered) {
		                		i.setHeight(this.body.getHeight(true));
		                	}
	                	}, this);
         }, this);
         this.map.events.register('preremovelayer', this, this.layerRemoved);

        //this.map.addLayer(this.vectorLayer);
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
    generateData: function generateData(){
        var data = [];
        for(var i = 0; i < 12; ++i){
            data.push([Date.monthNames[i], (Math.floor(Math.random() *  11) + 1) * 100]);
        }
        return data;
    },
    _onShow: function () {
    },

    onHide: function () {
    },
    updateGroupBy: function () {
    	var sector = Ext.getCmp('sectorId').getValue();
    	var fuente = Ext.getCmp('fuenteId').getValue();
    	var store = Ext.StoreMgr.get('agruparPorStoreId');

    	var arrayCampos = new Array();
    	arrayCampos.push(['nivelTerritorial', 'Comuna']);
    
    	if (fuente === 'Todos') {
    		arrayCampos.push(['fuente', 'Fuente']);
    	}
    	if (sector === 'Todos') {
    		arrayCampos.push(['sector', 'Sector']);
    	}
    	store.loadData(arrayCampos, false);
    	
    	
    	/*store.clearFilter(true);
    	store.filter({
    		fn: function (record) {
    			console.log("Registro " + record.get('idCampo') +  " aceptado: " + (arrayCampos.indexOf(record.get('idCampo')) != -1));
    			return arrayCampos.indexOf(record.get('idCampo')) != -1;
    		},
    		scope: this
    	});
    	if (combobox) {
    		combobox.setValue('nivelTerritorial');    		
    	}*/
    	
    	
   
    	
    	
    },

    onBeforeRender: function () {
        var chartWindow = this;
        
        var sourceStore = new Ext.data.Store({
        	reader: new Ext.data.JsonReader({
        		fields: ['fuente'],
        		root: 'data'
        	}),
        	proxy: new Ext.data.HttpProxy({
        		url: chartWindow.baseUrl + '/inversion/getFuentes'
        	}),
        	remoteSort: true,
        	autoLoad: false,
        	listeners: {
        		load: function (store, records, options) {
        			
        	 		var fuenteCombo = Ext.getCmp('fuenteId');
        	 		fuenteCombo.setValue(records[0].get('fuente'));
        	 		fuenteCombo.fireEvent('select', fuenteCombo, records[0], 0);
        		}        	
        	}
        });
        
        var yearsStore = new Ext.data.Store({
            reader: new Ext.data.JsonReader({
                fields : ['anyo'],
                root: 'data'
            }),
            proxy: new Ext.data.HttpProxy({
                url: chartWindow.baseUrl + '/inversion/getAnyos'
            }),
            remoteSort: true,
            autoLoad: true,
            baseParams: {
        		tipoProyecto: 'PREINVERSION'
        	},
        	listeners: {
        		load: function (store, records, options) {
        			// Autoselect first result
        		
        			var anyoCombo = Ext.getCmp('anyoId');
        			
        			if (records.length != 0) {
        				anyoCombo.setValue(records[0].get('anyo'));
        				anyoCombo.fireEvent('select', anyoCombo, records[0], 0);
        			}
        		}
        	}        	
        });
        
        var lineStore = new Ext.data.Store({
        	reader: new Ext.data.JsonReader({
        		fields: ['linea'],
        		root: 'data'
        	}),
        	proxy: new Ext.data.HttpProxy({
        		url: chartWindow.baseUrl + '/inversion/getLineasFinancieras'
        	}),
        	remotSort: true,
        	autoLoad: false,
        	listeners: {
        		load: function (store, records, options) {
        			
        			var lineaCombo = Ext.getCmp('lineaId');
        			if (records.length != 0) {
        				lineaCombo.setValue(records[0].get('linea'));
        				lineaCombo.fireEvent('select', lineaCombo, records[0], 0);
        			}
        		}
        	}
        });
        
        var sectorStore = new Ext.data.Store({
        	reader: new Ext.data.JsonReader({
        		fields: ['sector'],
        		root: 'data'
        	}),
        	proxy: new Ext.data.HttpProxy({
        		url: chartWindow.baseUrl + '/inversion/getSectores'
        	}),
        	remoteSort: true,
        	autoload: false,
        	listeners: {
        		load: function(store, records, options) {
        			
        			var sectorCombo = Ext.getCmp('sectorId');
        			if (records.length != 0) {
        				sectorCombo.setValue(records[0].get('sector'));
        				sectorCombo.fireEvent('select', sectorCombo, records[0], 0);
        			}
        			
        		}
        	}
        });
        
        var nivelTerritorialStore = new Ext.data.Store({
        	reader: new Ext.data.JsonReader({
        		fields:['nivelTerritorial'],
        		root: 'data'
        	}),
        	proxy: new Ext.data.HttpProxy({
        		url: chartWindow.baseUrl + '/inversion/getNivelesTerritoriales'
        	}),
        	remoteSort: true
     	
        });
        
        var agruparPorStore = new Ext.data.ArrayStore({
        		storeId: 'agruparPorStoreId',
        		idIndex: 0,
        		fields: ['idCampo', 'nombreCampo'],
        		autoload: false,
        		listeners: {
        			load: function(store, records, options) {
        				var combo = Ext.getCmp('agruparPorId');
        				if (combo) {
        					combo.setValue(records[0].get('idCampo'));
        					combo.fireEvent('select', combo, records[0], 0);
        				}
        			}
        		}
        	});
        
        /*var chartOptions = {
        	is3D: true,
        	dfs:dfs
        	
        	
        };*/

        var c = [
            {
                xtype: 'form',
                title: chartWindow.topTitleText,
                //region: 'west',
                
                margins: '5 0 0 5',
                width: 320,
                id: 'inversion-form-region',
                labelWidth: 100,
                defaultType: 'combo',
                items: [
                    {
                        id: 'tipoProyectoId',
                        fieldLabel: chartWindow.stageText,
                        hiddenName: 'tipoProyecto',
                        mode: 'local',
                        triggerAction: 'all',
                        value: 'PREINVERSION',
                        store: [
                            ['PREINVERSION', chartWindow.proyectosPreinversionText],
                            ['EJECUCION', chartWindow.proyectosEjecucionText]
                        ],
                        valueField: 'value',
                        displayField: 'label',
                        forceSelection: true,
                        selectOnFocus: true,
                        editable: false,
                        listeners: {
                            select: function (e) {
                    			
                                var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                                var anyoCombo = Ext.getCmp('anyoId');
                                
                                // reload anyo
                                anyoCombo.store.removeAll();
                                anyoCombo.store.reload({
                                    params: {
                                        tipoProyecto: tipoProyecto
                                    }
                                });
                            }
                        }
                    },
                    {
                        id: 'anyoId',
                        fieldLabel: chartWindow.yearText,
                        hiddenName: 'anyo',
                        store: yearsStore,
                        valueField: 'anyo',
                        displayField: 'anyo',
                        forceSelection: true,
                        editable: false,
                        triggerAction: 'all',
                        listeners: {
                    		select: function(combo, record, index) {
                    			var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                    			var fuenteCombo = Ext.getCmp('fuenteId');
                    			var anyo = record.get('anyo');
                    			
                    			// reload fuente
                    			fuenteCombo.store.removeAll();
                    			fuenteCombo.store.reload({
                    				params: {
                    					tipoProyecto: tipoProyecto,
                    					anyo: anyo
                    				}
                    			});
                    		},
                            focus: function(combo) {
                            	// setBaseParams
                            	var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                            	combo.store.setBaseParam('tipoProyecto', tipoProyecto);
                            }
                    	}
                    },
                    {
                    	id: 'fuenteId',
                        fieldLabel: chartWindow.sourceText,
                        hiddenName: 'fuente',
                        store: sourceStore,
                        valueField: 'fuente',
                        displayField: 'fuente',
                        forceSelection: true,
                        editable: false,
                        triggerAction: 'all',
                        listeners: {
                    		select: function(combo, record, index) {
                    			// clear financial line combo
                    			var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                    			var fuente = Ext.getCmp('fuenteId').getValue();
                    			var anyo = Ext.getCmp('anyoId').getValue();
                    			var lineaCombo = Ext.getCmp('lineaId');
                    			lineaCombo.store.removeAll();
                    			lineaCombo.store.reload({
                    				params: {
                    					tipoProyecto: tipoProyecto,
                    					anyo: anyo,
                    					fuente: fuente
                    				}
                    			});
                    		},
                            focus: function(combo) {
                            	// setBaseParams
                            	var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                            	var anyo = Ext.getCmp('anyoId').getValue();
                            	combo.store.setBaseParam('tipoProyecto', tipoProyecto);
                            	combo.store.setBaseParam('anyo', anyo);
                            }
                    	}
                    },
                    {
                    	id: 'lineaId',
                        fieldLabel: chartWindow.financingLineText,
                        hiddenName: 'lineaFinanciera',
                        store: lineStore,
                        valueField: 'linea',
                        displayField: 'linea',
                        forceSelection: true,
                        editable: false,
                        triggerAction: 'all',
                        listeners: {
                        	select: function(combo, record, index) {
                        		// clear sector combo
                    			var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                    			var fuente = Ext.getCmp('fuenteId').getValue();
                    			var anyo = Ext.getCmp('anyoId').getValue();
                    			var linea = Ext.getCmp('lineaId').getValue();
                    			var sectorCombo = Ext.getCmp('sectorId');
                    			
                    			sectorCombo.store.removeAll();
                    			sectorCombo.store.reload({
                    				params: {
                    					tipoProyecto: tipoProyecto,
                    					anyo: anyo,
                    					fuente: fuente,
                    					lineaFinanciera: linea
                    				}
                    			});
                        	},
                            focus: function(combo) {
                            	// setBaseParams
                            	var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                            	var anyo = Ext.getCmp('anyoId').getValue();
                            	var fuente = Ext.getCmp('fuenteId').getValue();
                            	combo.store.setBaseParam('tipoProyecto', tipoProyecto);
                            	combo.store.setBaseParam('anyo', anyo);
                            	combo.store.setBaseParam('fuente', fuente);
                            }
                        }
                    },
                    {
                    	id: 'sectorId',
                        fieldLabel: chartWindow.sectorText,
                        hiddenName: 'sector',
                        store: sectorStore,
                        valueField: 'sector',
                        displayField: 'sector',
                        forceSelection: true,
                        editable: false,
                        triggerAction: 'all',
                        listeners: {
                        	select: function(combo, record, index) {
                        		chartWindow.updateGroupBy();
                        	},
                        	focus: function(combo) {
                        		var tipoProyecto = Ext.getCmp('tipoProyectoId').getValue();
                    			var fuente = Ext.getCmp('fuenteId').getValue();
                    			var anyo = Ext.getCmp('anyoId').getValue();
                    			var linea = Ext.getCmp('lineaId').getValue();
                    			
                    			combo.store.setBaseParam(
                    					'tipoProyecto',tipoProyecto);
                    			combo.store.setBaseParam('anyo', anyo);
                    			combo.store.setBaseParam('fuente', fuente);
                    			combo.store.setBaseParam('lineaFinanciera', linea);
                        	}
                        }
                    },
                    {
                    	id: 'nivelTerritorialId',
                        fieldLabel: chartWindow.territorialLevelText,
                        hiddenName: 'nivelTerritorial',
                        store: nivelTerritorialStore,
                        valueField: 'nivelTerritorial',
                        displayField: 'nivelTerritorial',
                        forceSelection: true,
                        editable: false,
                        triggerAction: 'all',
                        value: 'Regional'
                        
                        
                    },
                    {
                    	id: 'agruparPorId',
                        fieldLabel: chartWindow.groupByText,
                        hiddenName: 'agruparPor',
                        store: agruparPorStore,
                        valueField: 'idCampo',
                        displayField: 'nombreCampo',
                        forceSelection: true,
                        editable: false,
                        triggerAction: 'all',
                        mode: 'local',
                        listeners: {
                        	afterrender: function (combo) {
                        		chartWindow.updateGroupBy();
                        	}, 
                        	focus: function() {

                        		chartWindow.updateGroupBy();
                        	}
                    
                        }
                        
                    }

                ],
                buttons: [{
                	scope: this,
                	text: this.graphicButtonText,
                	handler: this.graficar
                	
                }]
            },
          
            
            {
               	//region: 'center',
            	columnWidth: .60,
               	margins: '5 5 0 0',
               	xtype: 'gvisualization',
               	id: 'lineChartId',
               	visualizationPkgs: {'corechart': 'ColumnChart'},
               	visualizationPkg: 'corechart',
               	html: 'Cargando...',
               	
               	visualizationCfg: {
               		
               		vAxis: {
               			title: this.xAxisTitle
               		},
               		hAxis: {
               			textStyle: {
               				fontSize: 7
               			}
               		},
               		legend: {
               			position: 'in'
               		},
               		chartArea: {width: 'auto'}
               	},
               	store: this.barStore,
               	columns: [
               	         {dataIndex: 'groupBy', label:''}, 
               	         {dataIndex: 'monto', label: 'Monto'},
               	         {
               	        	 tooltip:true,
               	        	 fields: ['groupBy', 'monto', 'numProyectos'],
               	        	 
               	        	 template: new Ext.Template('{groupBy}: {monto:number("0.000/i")} M$ en {numProyectos} iniciativas',
               	        		 {
               	        	 		compiled: true
               	        		 }) 
               	         }
               	]            		
                               
            },
            {
           		xtype: 'gvisualization',
           		//region: 'east',
           		columnWidth: .40,
               	margins: '5 5 0 0',
               	layout: 'fit',
               	id: 'pieChartId',
               	html: 'Cargando...',
               	buttons: [
               	          {
               	        	  id: 'iniciatiavasGeoId',
               	        	  text: this.geoButtonText,
               	        	  handler: this.georeferenceInitiatives,
               	        	  scope: chartWindow
               	          }
               	],
               	
               	visualizationPkgs: {'corechart': 'PieChart'},
               	visualizationPkg: 'corechart',
               	visualizationCfg: {
               		title: 'Invertido en sectores',
               		pieSliceText: 'label',
               		pieResidualSliceLabel: this.porcionOtrosText
               	},
               	store: this.pieStore,
               	columns: [
               	          {dataIndex: 'groupBy', label:'Sectores'}, 
               	          {dataIndex: 'monto', label: 'Monto'},
               	          {
               	        	  tooltip:true,
               	        	  fields: ['monto', 'numProyectos'],
               	        	  
               	        	  template: new Ext.Template('Monto: {monto:number("0,000/i")} M$ en {numProyectos} iniciativas',
               	        			  {
               	        		  compiled: true
               	        			  }) 
               	          }
                  ]            		
                       
           	}           	
        ];

        chartWindow.add(c);
        chartWindow.on('resize', Ext.getCmp('lineChartId').onParentResize, Ext.getCmp('lineChartId'));
        chartWindow.on('resize', Ext.getCmp('pieChartId').onParentResize, Ext.getCmp('pieChartId'));
    },
    graficar: function() {
    	//var lineChartPanel = Ext.getCmp('chartCenterPanelId');
    	//this.barStore.loadData([['2004',1000,400],['2005',1170,460],['2006',860,580],['2007',1030,540]], false);
    	var values = Ext.getCmp('inversion-form-region').getForm().getValues();
    	var lineChart = Ext.getCmp('lineChartId');
    	var agrupadoPorCombo = Ext.getCmp('agruparPorId');
    	var tipoProyectoCombo = Ext.getCmp('tipoProyectoId');
    	var agrupadoPorText = agrupadoPorCombo.findRecord(agrupadoPorCombo.valueField || agrupadoPorCombo.displayField, agrupadoPorCombo.getValue()).get(agrupadoPorCombo.displayField);
    	var tipoProyectoText = tipoProyectoCombo.findRecord(tipoProyectoCombo.valueField || tipoProyectoCombo.displayField, tipoProyectoCombo.getValue()).get(tipoProyectoCombo.displayField);
    	
    	
        var pieChart = Ext.getCmp('pieChartId');
        
        var barChartTitle = "Monto invertido en sector " + values.sector + " - " 
        	+ "Fuente: " + values.fuente + " - " 
        	+ "Año: " + values.anyo 
        	+ " - Agrupado por: " + agrupadoPorText;
        
        var pieChartTitle = tipoProyectoText + " - Año: " + values.anyo + " - Invertido en sectores";  
        lineChart.visualizationCfg.title = barChartTitle;
        pieChart.visualizationCfg.title= pieChartTitle;
        
    	
    	this.barStore.reload({params: values});
    	this.pieStore.reload({
    		params: {
    			'tipoProyecto': values.tipoProyecto,
    			'anyo': values.anyo,
    			'agruparPor': 'sector'
    		}
    	});       
    },
    georeferenceInitiatives: function() {
    	var values = Ext.getCmp('inversion-form-region').getForm().getValues();
    	var button = Ext.getCmp('iniciatiavasGeoId');
    	button.setDisabled(true);
    	
    	Ext.Ajax.request({
    		url: this.baseUrl + '/inversion/getProyectosGeo',
    		success: this.georeferenceInitiativesSuccess,
    		failure: this.georeferenceInitiativesFailure,
    		params: values,
    		scope: this
    			
    	});
    	
    	
    	
    },
    georeferenceInitiativesSuccess: function(response, options) {
    	var button = Ext.getCmp('iniciatiavasGeoId');
    	button.enable();
    	var responseJson = Ext.util.JSON.decode(response.responseText);
    	var investmentLayers = this.map.getLayersByName(this.LAYER_NAME);
    	var investmentLayer = null;
    	var chartWindow = this;
    	var baseUrl = this.baseUrl;
    	if (investmentLayers.length == 0) {
            var defaultStyle = new OpenLayers.Style(
                {
                    externalGraphic: baseUrl +'/img/marker-blue.png',
                    fill: false, 
                    stroke: false, 
                    pointRadius: 0,
                    graphicWidth: 18 , 
                    graphicHeight: 30,
                    fillOpacity: 1,
                    graphicXOffset: -30/2,
                    graphicYOffset: -18/2,
                    cursor: 'pointer'
                });
    		
    		var myStyles = new OpenLayers.StyleMap(defaultStyle);
    		
    		
    		var utm19Projection = new OpenLayers.Projection("EPSG:32719");
    		var mapProjection = this.map.getProjectionObject();
    		// Create investment layer and add to map
    		investmentLayer = new OpenLayers.Layer.Vector(this.LAYER_NAME, {
    			styleMap: myStyles,
    			preFeatureInsert: function(feature) {
    				OpenLayers.Projection.transform(feature.geometry, utm19Projection, mapProjection);
    		           
    		    },
    		    eventListeners: {
    		    	'featureselected': function(evt) {
    		    		var feature = evt.feature;
    		    		// create the select feature control
    		    		var popupWindow = new Viewer.plugins.FichaInversion({
    		    			feature: feature,
    		    			location: feature,
    		    			baseUrl: chartWindow.baseUrl
    		    			
    		    		});
    		    		popupWindow.on('close', function(p){
    		    			feature.popupWindow = null;
    		    			this.selectControl.unselect(feature);
    		    		}, chartWindow);
    		    		feature.popupWindow = popupWindow;
    		    		
    		    		popupWindow.createPopup();
    		    	    
    		    	},
    		    	'featureunselected': function(evt) {
    		    		var feature = evt.feature;
    		    		if (feature.popupWindow) {
    		    			feature.popupWindow.close();
    		    			feature.popupWindow = null;
    		    		}
    		    	}
    		    }
    		});
    		var selector = new OpenLayers.Control.SelectFeature(investmentLayer,{
    	        hover: false,
    	        autoActivate:true,
    	        clickout: true,
    	        multiple: false,
    	        box: false,
    	        toggle: true
    	        
    	    }); 
    		this.layer= investmentLayer;    		
    		this.selectControl = selector;
    		this.map.addLayer(investmentLayer);   		
    		this.map.addControl(selector);
    		
    	} else {
    		investmentLayer = investmentLayers[0];
    	}
    	investmentLayer.removeAllFeatures();
    	var featureCollection = {
    			type:'FeatureCollection', 
    			features: responseJson.data};
    	var geojsonFormat = new OpenLayers.Format.GeoJSON();
    	var features = geojsonFormat.read(featureCollection);
    	investmentLayer.addFeatures(features);
    	Ext.MessageBox.alert("Resultado de la búsqueda", "Se han encontrado " + responseJson.results + " proyectos georreferenciados");
    	if(responseJson.results > 0) {
    		var extent = investmentLayer.getDataExtent();
    		this.map.zoomToExtent(extent);
    		
    	}
    	
    	
    	
    	
    },
    georeferenceInitiativesFailure: function(response, options) {
    	var button = Ext.getCmp('iniciatiavasGeoId');
    	button.enable();
    	Ext.MessageBox.alert("Resultado de la búsqueda", "Se ha producido un error al realizar la búsqueda.");
    }
});

