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
 */
Viewer.dialog.LocalCertificatesWindow = Ext.extend(Ext.Window, {
	target: null,
	action: null,

	/** i18n * */
	titleText: 'Local certificates',
	printText: 'Print',
	viewText: 'View',
	closeText: 'Close',
	searchText: 'Search',
	ownerHeaderText: "Owner",
	roleHeaderText: "Role",
	predioHeaderText: "Predio",
	waitText: "Please wait...",
	errorText: "An error was found. Please try again later.",
	noSearchResultsText: "No data to show, change the filter and press 'Search'",
	selectInMapText: "Select in map",
	noParcelSelectedText: "No parcel was selected, please click 'Select in map' again.",

	persistenceGeoContext: null,


	printButton: null,
	viewButton: null,
	searchButton: null,
	searchTextField: null,
	searchCriteriaCB: null,
	grid: null,

	constructor: function(config) {

		Viewer.dialog.LocalCertificatesWindow.superclass.constructor.call(this, Ext.apply({
			title: this.titleText,
			width: 500,
			height: 400,
			layout: {
				type: "vbox",
				align: "stretch",
				padding: "5px"
			},
			closeAction: 'hide'
		}, config));

		this.on({
			beforerender: this.onBeforeRender,
			show: this._onShow,
			scope: this
		});

	},

	_onShow: function() {
		// Antes de mostrar el formulario reiniciamos todos los input.		
		this.searchCriteriaCB.setValue(null);
		this.searchTextField.setValue("");
		this.viewButton.setDisabled(true);
		this.printButton.setDisabled(true);
		this.searchButton.setDisabled(true);
		this.grid.store.removeAll();
		this.grid.getView().focusRow(0);
	},

	onBeforeRender: function() {

		var searchPanel = new Ext.FormPanel({
			labelAlign: "top",
			autoHeight: true,
			items: [{
				layout: "hbox",
				align: "stretchmax",
				// defaults for columns
				defaults: {
					layout: 'form',
					labelSeparator: "",
					border: false,
					xtype: 'panel',
					bodyStyle: 'padding:0 10px 0 0'
				},
				items: [{
					flex: 1,
					defaults: {
						anchor: "100%"
					},
					items: [
					this.searchCriteriaCB = new Ext.form.ComboBox({
						store: new Ext.data.SimpleStore({
							fields: ['criteria', 'label'],
							data: [
								['ROL', 'Rol'],
								['PROPIETARI', 'Propietario'],
								['DIRECCION', "Dirección"]
							]
						}),			
						mode:"local",			
						fieldLabel: "Criterio",
						valueField: 'criteria',
						displayField: 'label',		
						triggerAction: 'all',				
						editable: false,
						typeAhead:false,
						flex: 1,
						listeners: {
							change: this.onCriteriaChanged,
							scope: this
						}
					})]
				}, {
					flex: 2,
					defaults: {
						anchor: "100%"
					},
					items: [
					this.searchTextField = new Ext.form.TextField({
						emptyText: this.searchPromptText,
						enableKeyEvents: true,
						flex: 1,
						minLength: 3,
						fieldLabel: "Texto a buscar",
						minLengthText: "El texto de búsqueda debe tener al menos 3 carácteres",
						listeners: {
							keyup: this.onSearchTextChanged,
							specialkey: function(f, e) {
								if (e.getKey() == e.ENTER) {
									this.doSearch();
								}
							},
							scope: this
						}
					})]
				}, {
					defaults: {
						anchor: "100%"
					},
					items: [
					this.searchButton = new Ext.Button({
						text: this.searchText,
						style: "padding-top:15px",
						listeners: {
							click: this.onSearchButtonClicked,
							scope: this
						}
					})]
				}]
			}]
		});
		this.add(searchPanel);

		this.grid = new Ext.grid.GridPanel({
			flex: 1,
			store: new Ext.data.JsonStore({
				autoDestroy: true,
				data: {
					items: []
				},
				root: 'items',
				fields: ["OBJECTID", "PROPIETARI", "NOM_PREDIO", "ROL"]

			}),
			colModel: new Ext.grid.ColumnModel({
				defaults: {
					sortable: true,
					width: 120
				},
				columns: [{
					id: 'id',
					dataIndex: 'OBJECTID',
					hidden: true
				}, {
					header: this.roleHeaderText,
					dataIndex: 'ROL',
					width: 50
				}, {
					header: this.ownerHeaderText,
					dataIndex: 'PROPIETARI'
				}, {
					header: this.predioHeaderText,
					dataIndex: 'NOM_PREDIO'
				}]
			}),
			viewConfig: {
				forceFit: true,
				deferEmptyText: false,
				emptyText: this.noSearchResultsText
			},
			sm: new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					rowSelect: this.onRowSelected,
					scope: this
				}
			}),
			frame: true,
			iconCls: 'icon-grid'
		});

		this.add(this.grid);

		this.addButton(this.viewButton = new Ext.Button({
			text: this.viewText,
			disabled: true,
			listeners: {
				click: this.onViewButtonClicked,
				scope: this
			}
		}));

		this.addButton(this.printButton = new Ext.Button({
			text: this.printText,
			disabled: true,
			listeners: {
				click: this.onPrintButtonClicked,
				scope: this
			}
		}));

		this.addButton(new Ext.Button({
			text: this.closeText,
			listeners: {
				click: this.onCancelButtonClicked,
				scope: this
			}
		}));

	},

	doSearch: function() {
		if (!this.searchTextField.validate()) {
			return;
		}

		var filterText = this.searchTextField.getValue().toUpperCase();
		var criteria = this.searchCriteriaCB.getValue();

		Ext.MessageBox.wait(this.waitText);
		Ext.Ajax.request({
			url: app.sources.local.url,
			method: "GET",
			params: {
				service: "wfs",
				request: "GetFeature",
				typeName: "gore:" + this.action.getLayerName(),
				outputFormat: "json",
				srsName: Viewer.getMapPanel().map.projection,
				cql_filter: "strToUpperCase(" + criteria + ") like '%" + filterText + "%'"
			},

			success: function(response) {
				var output;
				try {
					output = Ext.decode(response.responseText);
				} catch (e) {
					// Si la respuesta no es json válido hubo un fallo
					Ext.MessageBox.updateProgress(1);
					Ext.MessageBox.hide();
					Ext.MessageBox.alert("", this.errorText);
					return;
				}
				var items = [];
				for (var i = 0; i < output.features.length; i++) {
					items.push(this.action.processRuralProperty(output.features[i]));
				}
				this.grid.store.loadData({
					items: items
				});

				Ext.MessageBox.updateProgress(1);
				Ext.MessageBox.hide();

			},

			failure: function(error) {
				// Si la respuesta no es json válido hubo un fallo
				Ext.MessageBox.updateProgress(1);
				Ext.MessageBox.hide();
				Ext.MessageBox.alert("", this.errorText);
			},
			scope: this
		});
	},



	onCriteriaChanged: function() {
		this.toggleSearchButton();
	},

	onSearchTextChanged: function() {
		this.toggleSearchButton();
	},

	toggleSearchButton: function() {
		var filterText = this.searchTextField.getValue();
		var criteria = this.searchCriteriaCB.getValue();
		if (!filterText || filterText.length < 3 || !criteria) {

			this.searchButton.setDisabled(true);
		} else {
			this.searchButton.setDisabled(false);
		}
	},

	onCancelButtonClicked: function() {
		this.hide();
	},

	onViewButtonClicked: function() {
		var selection = this.grid.getSelectionModel().getSelected();

		var layerName = "gore:" + this.action.getLayerName();

		var map = Viewer.getMapPanel().map;


		this.action.addLocalityLayer();


		var resultLabel = this.action.getCertificateLabel(selection.data, ", ");


		var gjson = new OpenLayers.Format.GeoJSON();
		var geometry = gjson.parseGeometry(selection.json.geom);

		var style = new OpenLayers.Style();
		var rule = new OpenLayers.Rule({
			name: resultLabel,
			symbolizer: {
				fillColor: "#FF5500",
				fillOpacity: 0.5,
				pointRadius: 6,
				pointerEvents: "visiblePainted",
				label: "${name}",
				fontColor: "red"
			}
		});
		style.addRules([rule]);
		var layer = new OpenLayers.Layer.Vector("Propiedad rural " + resultLabel, {
			styleMap: new OpenLayers.StyleMap({
				"default": style
			})
		});
		var geomLayer = new OpenLayers.Feature.Vector(geometry, {
			name: resultLabel,
			title: resultLabel
		});
		layer.addFeatures([geomLayer]);
		this.action.addLayerIfNotExists(layer);


		map.zoomToExtent(layer.getDataExtent());
		map.zoomTo(map.getZoom() - 1);
	},


	onPrintButtonClicked: function() {
		var selection = this.grid.getSelectionModel().getSelected();

		this.action.createLocalCertificate(selection.json);
	},

	onSearchButtonClicked: function() {
		this.doSearch();
	},

	onRowSelected: function() {
		this.viewButton.setDisabled(false);
		this.printButton.setDisabled(false);
	}
});