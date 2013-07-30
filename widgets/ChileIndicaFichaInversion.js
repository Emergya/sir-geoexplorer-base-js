/**
 * Copyright (c) 2008-2011 The Open Planning Project
 *
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */


Ext.namespace("Viewer.plugins");

Viewer.plugins.ChileIndicaFichaInversion = Ext.extend(GeoExt.Popup, {

	title: 'Antecedentes consultados',
	width: 500,
	location: null,
	baseUrl: null,
	closeAction: 'close',
	feature: null,
	iniItem: null,
	item1: null,
	item2: null,
	item3: null,
	window: null,

	waitText: "Please wait...",
	errorText: "An error ocurred, please try again in a few moments.",

	imprimirFicha: function() {
		var url = this.baseUrl + "/fichaImprimir";
		var params = Ext.urlEncode({
			codBip: this.feature.attributes.codBip,
			etapa: this.feature.attributes.etapa,			
			anyo: this.feature.attributes.anyo
		});
		url = Ext.urlAppend(url, params);
		window.open(url, "Ficha_" + this.feature.attributes.codBip);
	},

	/** private: method[constructor]
	 */
	constructor: function(config) {
		Viewer.plugins.ChileIndicaFichaInversion.superclass.constructor.call(this, Ext.apply({
			cls: "vw_fichainversion",
			width: 487 * 1.5
		}, config));
	},

	/** private: method[initComponent]
	 */
	initComponent: function() {

		this.iniItem = new Ext.Panel({
			cls: 'item postini'
		});

		this.item1 = new Ext.Panel({
			title: 'Detalles',
			autoScroll: true,
			cls: 'item details'
		});

		this.item2 = new Ext.Panel({
			title: 'Aprobación de Fecursos Financieros',
			autoScroll: true,
			cls: 'item labelsInFinancingSources'
		});

		this.item3 = new Ext.Panel({
			title: 'Proceso Ejecución Inversión',
			autoScroll: true,
			cls: 'item executionProcess'
		});

		var accordion = new Ext.Panel({
			region: 'west',
			margins: '5 0 5 5',
			split: true,
			height: 250,
			layout: 'accordion',
			items: [this.item1, this.item2, this.item3]
		});

		this.items = [this.iniItem, accordion];


		Viewer.plugins.ChileIndicaFichaInversion.superclass.initComponent.call(this);
		this.addButton({
				text: 'Imprimir'
			},
			this.imprimirFicha,this);

	},

	createPopup: function() {

		// Parametros del punto
		var codBip = this.feature.attributes.codBip;
		var etapa = this.feature.attributes.etapa;		
		var anyo = this.feature.attributes.anyo;

		Ext.Msg.wait(this.waitText);

		Ext.Ajax.request({
			url: this.baseUrl + "/fichaPopup",
			params: {
				codBip: codBip,
				etapa: etapa,				
				anyo: anyo
			},
			scope: this,
			success: function(response) {

				Ext.Msg.updateProgress(1),
				Ext.Msg.hide();

				var info = response.responseText;
				var html = Ext.DomHelper.createDom({
					html: info
				});
				var bloqueIni = Ext.DomQuery.selectNode("div[id=headerPopup]", html);
				if (bloqueIni) {
					this.iniItem.html = bloqueIni.innerHTML;
				}

				var bloque1 = Ext.DomQuery.selectNode("div[id=details]", html);
				if (bloque1) {
					this.item1.html = bloque1.innerHTML;
				}

				var bloque2 = Ext.DomQuery.selectNode("div[id=financingSources]", html);
				if (bloque2) {
					this.item2.html = bloque2.innerHTML;
				}

				var bloque3 = Ext.DomQuery.selectNode("div[id=executionProcess]", html);
				if (bloque3) {
					this.item3.html = bloque3.innerHTML;
				}

				this.show();
			},

			failure : function() {
				Ext.Msg.updateProgress(1),
				Ext.Msg.hide();

				Ext.Msg.alert("", this.errorText);
			}
		});

	}

});

Ext.reg("vw_chileindicafichainversion", Viewer.plugins.ChileIndicaFichaInversion);
