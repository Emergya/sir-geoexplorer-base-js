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
Viewer.dialog.PDFPrintWindow = Ext.extend(Ext.Window, {
	target: null,
	action: null,
	printProvider: null,

	/** i18n * */
	printText: 'Print',
	closeText: "Close",
	sizeText: "Size",
	fontText: "Font",
	resolutionText: "Resolution",
	titleText: "Title",
	descriptionText: "Description",
	logoText: "Logo",
	northArrowText: "North Arrow",
	downloadImageText: "Download image",
	gridText: "Grid",
	browseText: "Browse",
	textText: "Text",
	legendText: "Legend",
	waitText: "Please wait...",
	errorText: "An error was found. Please try again later.",
	logoFileTypeUnsupportedText: "Supported image file types are PNG and JPEG",

	/** api: config[pdfFooterText]
	 * If not present no footer will be added to the pdf. If pressent, the footer will contain the specified text.
	 */
	pdfFooterText: null,
	/** api: config[logoImgUri]
	 * The url/data uri used for the main pdf logo. No logo will be shown if no uri is supplied.
	 */
	pdfLogoUri: null,
	legendImgUrlTpl: "{url}SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&LAYER={name}&transparent=true&format=image/png&legend_options=fontAntiAliasing:true;fontSize:11;fontName:Arial",

	labelWidth: 80,

	pageWidths: {
		letter: 215.9,
		a4: 210,
		legal: 215.9
	},

	_previewMapPanel: null,
	_legendPanel: null,
	_form: null,
	_printButton: null,
	_graticuleControl: null,

	// Used to know if we have to create a PDF or a PNG image.
	_downloadImage: false,

	persistenceGeoContext: null,


	constructor: function(config) {

		Viewer.dialog.PDFPrintWindow.superclass.constructor
			.call(this, Ext.apply({
			title: this.printText,
			width: 500,
			height: 650,
			layout: {
				type: "vbox",
				align: "stretch",
				padding: "5px"
			},
			closeAction: "hide"
		}, config));

		this.on({
			beforerender: this.onBeforeRender,
			show: this._onShow,
			hide: function() {
				this.destroy();
				Viewer.unregisterComponent('PDFPrintWindow');
			},
			scope: this
		});
	},

	_onShow: function() {
		// Here we reset the form.
		this._setFormValue("pageSize", "letter");
		this._setFormValue("resolution", 75);
		this._setFormValue("grid", false);
		this._setFormValue("legend", true);

		//this._setFormValue("logo", null);
		this._form.find("name", "logo")[0].reset();

		this._setFormValue("title_font", "helvetica");
		this._setFormValue("title_size", 25);
		this._setFormValue("title_text", "Escriba aquí el título");

		this._setFormValue("comment_font", "helvetica");
		this._setFormValue("comment_size", 12);
		this._setFormValue("comment_text", "Escriba aquí una descripción");

		this._setFormValue("northArrow", "");

		if (!this._graticuleControl) {
			this._graticuleControl = new OpenLayers.Control.Graticule({
				labelled: true
			});
			this._previewMapPanel.map.addControl(this._graticuleControl);

		}

		var mapPanel = Viewer.getMapPanel();



		this._previewMapPanel.map.zoomToExtent(mapPanel.map.getExtent());

		this._graticuleControl.deactivate();
	},

	onBeforeRender: function() {

		this._form = this.add({
			xtype: "form",
			bodyStyle: "padding: 5px",
			autoHeight: true,
			monitorValid: true,
			labelWidth: this.labelWidth,
			defaults: {
				anchor: '100%',
				labelSeparator: ""
			},
			items: [
				this._firstFormRow(),
				this._secondFormRow(),
				this._thirdFormRow(),
				this._fourthFormRow(),
				this._fifthFormRow()
			],
			listeners: {
				scope: this,
				clientvalidation: function(form, valid) {
					this._printButton.setDisabled(!valid);
				}
			}
		});

		var mapContainer = this.add({
			xtype: "panel",
			layout: "hbox",
			layoutConfig: {
				pack: "center",
				align: "middle"
			}
		});

		this._previewMapPanel = mapContainer.add(new GeoExt.PrintMapPanel({
			sourceMap: Viewer.getMapPanel().map,
			printProvider: this.printProvider,
			limitScales: true,
			width: 200,
			height: 200,
			items: [{
					xtype: "gx_zoomslider",
					baseCls: "previewMapSlider", // So we control styles
					aggressive: true,
					vertical: true,
					height: 100,
					// Hack for correct positining due bad styles.
					x: 5,
					y: 10
				}
			]
		}));

		this._downloadPNGButton = this.addButton(new Ext.Button({
			text: this.downloadImageText,
			listeners: {
				click: this._onDownloadImageClicked,
				scope: this
			}
		}));

		this._printButton = this.addButton(new Ext.Button({
			text: this.printText,
			listeners: {
				click: this._onPrintButtonClicked,
				scope: this
			}
		}));

		this.addButton(new Ext.Button({
			text: this.closeText,
			listeners: {
				click: this._onCancelButtonClicked,
				scope: this
			}
		}));

	},

	_firstFormRow: function() {

		var avalaibleDpis = [];
		for (var idx = 0; idx < this.printProvider.capabilities.dpis.length; idx++) {
			var dpi = this.printProvider.capabilities.dpis[idx];
			avalaibleDpis.push([dpi.value, dpi.value + " dpi"]);
		}

		var items = [{
				flex: 0.9,
				labelWidth: this.labelWidth,
				items: [{
						xtype: "combo",
						name: "pageSize",
						displayField: "name",
						typeAhead: true,
						fieldLabel: this.sizeText,
						mode: "local",
						forceSelection: true,
						triggerAction: "all",
						selectOnFocus: true,
						width: 100,
						store: [
							["letter", "Letter"],
							["a4", "A4"],
							["legal", "Legal"]
						],
						value: "letter"
					}
				]
			}, {
				flex: 0.9,
				labelWidth: this.labelWidth,
				items: [{
						xtype: "combo",
						name: "resolution",
						fieldLabel: this.resolutionText,
						typeAhead: true,
						mode: "local",
						forceSelection: true,
						triggerAction: "all",
						selectOnFocus: true,
						store: avalaibleDpis,
						width: 100
					}
				]
			}, {
				flex: 0,
				items: [{
						xtype: "checkbox",
						name: "grid",
						boxLabel: this.gridText,
						hideLabel: true,
						listeners: {
							scope: this,
							check: function(sender, checked) {
								if (checked) {
									this._graticuleControl.activate();
								} else {
									this._graticuleControl.deactivate();
								}
							}
						}
					}
				]
			}, {
				flex: 0,
				items: [{
						xtype: "checkbox",
						name: "legend",
						boxLabel: this.legendText,
						hideLabel: true,
						width: 70
					}
				]
			}
		];

		return {
			xtype: 'panel',
			layout: 'hbox',
			align: "stretchmax",
			defaults: {
				layout: 'form',
				labelSeparator: "",
				border: false,
				xtype: 'panel',
				bodyStyle: "padding-right: 15px",
				flex: 1,
				defaults: {
					anchor: "100%"
				}
			},
			items: items
		};
	},

	_secondFormRow: function() {
		return {
			xtype: "fileuploadfield",
			name: "logo",
			fieldLabel: this.logoText,
			buttonText: this.browseText,
			regex: /^.*\.(png|jpeg|jpg)$/i,
			regexText: this.logoFileTypeUnsupportedText
		};
	},

	_thirdFormRow: function() {
		return {
			xtype: "fieldset",
			title: this.titleText,
			collapsible: false,
			autoHeight: true,
			labelWidth: this.labelWidth - 10,
			defaults: {
				anchor: "100%"
			},
			items: [
				this._fontStyleRow("title"), {
					xtype: "textfield",
					name: "title_text",
					fieldLabel: this.textText,
					value: "Título",
					allowBlank: false,
					selectOnFocus: true
				}
			]
		};
	},

	_fourthFormRow: function() {
		return {
			xtype: "fieldset",
			title: this.descriptionText,
			collapsible: false,
			autoHeight: true,
			labelWidth: this.labelWidth - 10,
			defaults: {
				anchor: "100%"
			},
			items: [
				this._fontStyleRow("comment"), {
					xtype: "textarea",
					name: "comment_text",
					fieldLabel: this.textText,
					allowBlank: false,
					selectOnFocus: true
				}
			]
		};
	},

	_fifthFormRow: function() {
		var items = [{
				flex: 0.8,
				labelWidth: this.labelWidth,
				height: 50,
				style: "padding-top: 14px",
				items: [{
						xtype: "combo",
						name: "northArrow",
						displayField: "label",
						valueField: "imageName",
						typeAhead: true,
						disableKeyFilter: true,
						fieldLabel: this.northArrowText,
						mode: "local",
						store: this._getCompassesStore(),
						forceSelection: true,
						triggerAction: "all",
						selectOnFocus: true,
						width: 100,
						listeners: {
							scope: this,
							select: function(sender, comboItem) {
								if (comboItem.json.imageName) {
									Ext.get("pdfPrintWindow_arrowPreview").setStyle(
										"background-image",
										"url('../theme/ux/img/compasses/" + comboItem.json.imageName + ".png')");
								} else {
									// We clear the image preview when selectingt no arrow
									Ext.get("pdfPrintWindow_arrowPreview").setStyle("background-image", "");
								}
							}
						}
					}
				]
			}, {
				height: 50,
				width: 50,
				id: "pdfPrintWindow_arrowPreview",
				style: "background-size: cover; background-repeat: no-repeat"
			}

		];

		return {
			xtype: 'panel',
			layout: 'hbox',
			align: "stretchmax",
			defaults: {
				layout: 'form',
				labelSeparator: "",
				border: false,
				xtype: 'panel',
				bodyStyle: "padding-right: 15px",
				flex: 1,
				defaults: {
					anchor: "100%"
				}
			},
			items: items
		};
	},

	_getCompassesStore: function() {
		// We store filenames and dataures because we have the urls for pneg files with transparency for use in the
		// ui, and jpegs for use in the pdf.
		var compassesData = [{
				label: "Ninguna",
				imageName: null
			}, {
				label: "Flecha moderna 1",
				imageName: "modern1"
			}, {
				label: "Flecha moderna 2",
				imageName: "modern2"
			}, {
				label: "Flecha clásica 1",
				imageName: "classic1"
			}, {
				label: "Flecha clásica 2",
				imageName: "classic2"
			}
		];

		var store = new Ext.data.JsonStore({
			// store configs
			autoDestroy: true,
			// reader configs
			root: 'compasses',
			idProperty: 'imageName',
			fields: ["label", "imageName"],
			data: {
				compasses: compassesData
			}
		});

		return store;
	},

	_fontStyleRow: function(namePrefix) {

		var fontSizes = [];
		var inc = 1;
		for (var fontSize = 5; fontSize < 60; fontSize += inc) {
			fontSizes.push([fontSize, fontSize + " pt"]);
			if (fontSize >= 20) {
				inc = 5;
			} else if (fontSize >= 40) {
				inc = 10;
			}
		}

		var items = [{
				flex: 0,
				labelWidth: this.labelWidth - 10,
				items: [{
						xtype: "combo",
						displayField: "name",
						typeAhead: true,
						fieldLabel: this.fontText,
						mode: "local",
						name: namePrefix + "_font",
						forceSelection: true,
						triggerAction: "all",
						selectOnFocus: true,
						width: 150,
						store: [
							["helvetica", "Arial"],
							["courier", "Courier New"],
							["times", "Times New Roman"]
						],
						value: "helvetica"
					}
				]
			}, {
				flex: 0,
				labelWidth: this.labelWidth - 20,
				items: [{
						xtype: "combo",
						name: namePrefix + "_size",
						forceSelection: true,
						fieldLabel: this.sizeText,
						mode: "local",
						typeAhead: true,
						triggerAction: "all",
						store: fontSizes,
						value: 14,
						width: 100
					}
				]
			}
		];

		return {
			xtype: 'panel',
			layout: 'hbox',
			align: "stretchmax",
			defaults: {
				layout: 'form',
				labelSeparator: "",
				border: false,
				xtype: 'panel',
				bodyStyle: "padding-right: 15px",
				flex: 1,
				defaults: {
					anchor: "100%"
				}
			},
			items: items
		};
	},

	_onCancelButtonClicked: function() {
		this.hide();

	},

	_onDownloadImageClicked: function() {
		Ext.MessageBox.wait(this.waitText);

		this._downloadImage = true;
		this._pdfImagesData = {
			mapPDFUrl: false
		};

		// This methods retrieve data the Ajax-y way. Will call the _doPDFCreation method
		// when are finished, but only the last to finish will actually do the pdf creation.
		this._retrieveMapPDFUrl();
	},

	_onPrintButtonClicked: function() {

		Ext.MessageBox.wait(this.waitText);

		this._downloadImage = false;

		this._pdfImagesData = {
			mapPDFUrl: false
		};

		// This methods retrieve data the Ajax-y way. Will call the _doPDFCreation method
		// when are finished, but only the last to finish will actually do the pdf creation.	
		this._retrieveMapPDFUrl();
	},

	_retrieveMapPDFUrl: function() {
		// We use geoserver's mapfish based print service to generate a pdf (because we cant get directly an image
		// because the version being to low or because having tried hard enough...)
		this.printProvider.customParams.layout = "MAP";
		this.printProvider.customParams.dpi = this._getFormValue("resolution");
		this.printProvider.customParams.renderLegend = false;

		var imageName = this._getFormValue("northArrow");
		if (imageName) {
			this.printProvider.customParams.imageName = imageName;
		}

		this._previewMapPanel.print();
	},

	_mapPDFUrlRetrieved: function(mapPDFUrl) {
		this._pdfImagesData.mapPDFUrl = mapPDFUrl;
		this._doPDFCreation();
	},


	// Does the pdf creation, only if all required data (retrieved using Ajax) is
	// avalaible.
	_doPDFCreation: function() {
		// Firstly we check the ajax requests have finished so we have
		// all required data.
		if (this._pdfImagesData.mapPDFUrl === false) {
			// Some data is not avalaible so we do nothing.
			return;
		}

		var margin = 30;
		var pageSize = this._getFormValue("pageSize");
		var pageWidth = this.pageWidths[pageSize];
		var outputFormat = this._downloadImage ? "PNG" : "PDF";
		// We can use localhost in la url because the request is made by the proxy.
		var url =app.proxy + "http://localhost/phpPDF/phpPDF.php";
		var params = {
			size: pageSize,
			margin: {
				"top": margin + 5,
				"bottom": margin + 10,
				"left": margin,
				"right": margin
			}, // mm
			title: "Impresión Módulo Cartográfico",
			header: {
				items: this._createPDFHeaderContents(margin, pageWidth)
			},
			items: this._createPDFContents(margin, pageWidth, this._pdfImagesData.mapPDFUrl),
			outputFile: "impresion_modulo_cartografico",
			keepFile: true,
			outputFormat: outputFormat
		};

		if (this.pdfFooterText) {
			// We add a footer only if avalaible.
			params.footer = {
				items: [{
						type: "par",
						newFont: {
							size: 9
						},
						text: this.pdfFooterText,
						align: "C"
					}
				],
				margin: 20
			};
		}

		Ext.Ajax.request({
			url: url,
			method: "POST",
			isUpload: true,
			form: this._form.form.el.dom,
			params: {
				params: Ext.encode(params)
			},
			success: function(response) {
				Ext.MessageBox.updateProgress(1);
				Ext.MessageBox.hide();
				// We should have get a json text here

				var result;
				try {
					result = Ext.decode(response.responseText);
				} catch (e) {
					console.debug(response.responseText);
					Ext.MessageBox.updateProgress(1);
					Ext.MessageBox.hide();
					Ext.MessageBox.alert("", this.errorText);
					return;
				}

				// We can use localhost this way because of the proxy
				app.downloadFile(url, {
					params: Ext.encode({
						downloadFile: result.downloadableFile,
						outputFormat: outputFormat
					})
				});
			},
			failure: function(response) {
				Ext.MessageBox.updateProgress(1);
				Ext.MessageBox.hide();
				Ext.MessageBox.alert("", this.errorText);
			},
			scope: this
		});

	},

	_createPDFHeaderContents: function(margin, pageWidth) {
		var items = [];

		if (this.pdfLogoUri) {
			items.push({
				type: "image",
				width: 22,
				url: this.pdfLogoUri,
				keepPosition: true
			});
		}

		if (this._getFormValue("logo")) {
			items.push({
				type: "image",
				fileInputName: "logo",
				width: 22,
				x: pageWidth - margin - 22
			});
		}

		return items;
	},

	_createPDFContents: function(margin, pageWidth, mapPDFUrl) {
		var avalaibleWidth = pageWidth - 2 * margin;
		var spacing = 5;

		// This image was converted manually to avoid requests, we know this values are true.	

		var items = [];

		items.push({
			type: "par",
			newFont: {
				family: this._getFormValue("title_font"),
				size: this._getFormValue("title_size")
			},
			text: this._getFormValue("title_text"),
			align: "C"
		});

		var mapSize = avalaibleWidth * 0.9;

		items.push({
			type: "image",
			url: mapPDFUrl,
			width: mapSize,
			dy: spacing,
			dx: avalaibleWidth * 0.05,
			border:true
		});

		var font = this._getFormValue("comment_font");
		var size = this._getFormValue("comment_size");
		items.push({
			text: "Descripción",
			newFont: {
				family: font,
				size: size,
				style: "B"
			},
			x: margin,
			dy: spacing
		});

		items.push({
			type: "paragraph",
			newFont: {
				style: "N"
			},
			text: this._getFormValue("comment_text"),
			dy: 2
		});

		var includeLegend = this._getFormValue("legend");
		if (!includeLegend) {
			return items;
		}

		items.push({
			"type": "pagebreak",
			"columns": 2,
			"topMargin": 50
		});

		items.push({
			text: "Leyenda",
			newFont: {
				family: font,
				size: size,
				style: "B"
			},
			x: margin
		});

		var urlTpl = new Ext.Template(this.legendImgUrlTpl);

		Ext.each(this._previewMapPanel.map.layers, function(layer) {
			if ( !! layer.url && layer.params && layer.params.LAYERS) {

				// Fix for some layer's legend url not being properly constructed.
				var layerUrl = layer.url;
				if(layerUrl.substr(-1)!="?") {
					layerUrl += "?";
				}


				// Its viewable, so we add an title element...			
				items.push({
					newFont: {
						"family": font,
						"size": 10,
						"style": "N"
					},
					text: layer.name,
					dy: 5
				});
				// ... and the legend image itself.
				items.push({
					"type": "image",
					"url": urlTpl.apply({
						"url" : layerUrl,
						"name": layer.params.LAYERS,
                        "style": layer.params.STYLE
					}),
					"dx":2,
					"dpi": 120 // So the leyends are downscaled

				});
			}
		},this);
		return items;

	},

	_getFormValue: function(fieldName) {
		return this._form.find("name", fieldName)[0].getValue();
	},

	_setFormValue: function(fieldName, newValue) {
		this._form.find("name", fieldName)[0].setValue(newValue);
	},

	_createURL: function(baseUrl, params) {
		var url = baseUrl + "?";
		var paramPieces = [];
		for (var key in params) {
			paramPieces.push(key + "=" + params[key]);
		}
		return url + paramPieces.join("&");
	}
});