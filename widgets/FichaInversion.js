/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */


Ext.namespace("Viewer.plugins");

Viewer.plugins.FichaInversion = Ext.extend(GeoExt.Popup, {
    
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
	item4: null,
	window: null,
	
	imprimirFicha: function() {
		var url = this.baseUrl + "/fichaInversion/ficha";
		var params = Ext.urlEncode({
			codBip: this.feature.attributes.codBip,
			etapa: this.feature.attributes.etapa,
			serRes: this.feature.attributes.serRes,
			anyo: this.feature.attributes.anyo
		});
		url = Ext.urlAppend(url, params);
		window.open(url, "Ficha del proyecto " + this.feature.attributes.codBip);
	},
    
    /** private: method[constructor]
     */
    constructor: function(config) {       
        Viewer.plugins.FichaInversion.superclass.constructor.call(this, config);
    },
    
    /** private: method[initComponent]
     */
    initComponent: function() {
    	
        this.iniItem = new Ext.Panel({
        	cls:'item postini'
        });
        
        this.item1 = new Ext.Panel({
        	title: 'Postulación iniciativa',
        	autoScroll: true,
        	cls:'item postini'
        });
        
        this.item2 = new Ext.Panel({
        	title: 'Evaluación Técnico Económica',
        	autoScroll: true,
        	cls:'item evteec'
        });
        
        this.item3 = new Ext.Panel({
        	title: 'Aprobación Recursos Financieros',
        	autoScroll: true,
        	cls:'item aprefi'
        });
        
        this.item4 = new Ext.Panel({
        	title: 'Proceso Ejecución Inversión',
        	autoScroll: true,
        	cls:'item prejin'
        });
        
        var accordion = new Ext.Panel({
        	region:'west',
        	margins:'5 0 5 5',
        	split:true,
        	width: 487,
        	height: 200,
        	layout:'accordion',
        	items: [this.item1, this.item2, this.item3, this.item4]
        });
    	
        this.items = [this.iniItem, accordion];


        Viewer.plugins.FichaInversion.superclass.initComponent.call(this);
        this.addButton(	
                {
        		    text: 'Imprimir'
        		},
        		this.imprimirFicha,
    		    this);

    }, 
    
    createPopup: function(){
    	
    	// Parametros del punto
    	var codBip = this.feature.attributes.codBip;
    	var etapa = this.feature.attributes.etapa;
    	var serRes = this.feature.attributes.serRes;
    	var anyo = this.feature.attributes.anyo;
    	
    	Ext.Ajax.request({
	 	    url: this.baseUrl + "/fichaInversion/fichaPopup",
	 	    params: {
	 	    	codBip: codBip,
	 	    	etapa: etapa,
	 	    	serRes: serRes,
	 	        anyo: anyo
	 	    },
	 	    scope: this,
	 	    success: function(response){
	 	    	var info = response.responseText;
	 	    	var html = Ext.DomHelper.createDom({html:info});
	 	    	var bloqueIni = Ext.DomQuery.selectNode("div[id=headerPopup]", html);
	 	    	if (bloqueIni) {
	 	    		this.iniItem.html = bloqueIni.innerHTML;	 	    		
	 	    	}
	 	    	
	 	    	var bloque1 = Ext.DomQuery.selectNode("div[id=postulacionIniciativa]", html);
	 	    	if (bloque1) {
	 	    		this.item1.html = bloque1.innerHTML;	 	    		
	 	    	}
	 	    	
	 	    	var bloque2 = Ext.DomQuery.selectNode("div[id=evalTecEco]", html);
	 	    	if (bloque2) {
	 	    		this.item2.html = bloque2.innerHTML;	 	    		
	 	    	} 
	 	    	
	 	    	var bloque3 = Ext.DomQuery.selectNode("div[id=aproRecFin]", html);
	 	    	if (bloque3) {
	 	    		this.item3.html = bloque3.innerHTML;	 	    		
	 	    	}
	 	    	
	 	    	var bloque4 = Ext.DomQuery.selectNode("div[id=procEjeInv]", html);
	 	    	if (bloque4) {
	 	    		this.item4.html = bloque4.innerHTML;	 	    		
	 	    	}
	 	    	
	 	    	this.show();
	 	    }
	 	});
    	
    }

});

Ext.reg("vw_fichainversion", Viewer.plugins.FichaInversion);
