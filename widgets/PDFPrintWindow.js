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
Viewer.dialog.PDFPrintWindow = Ext.extend(Ext.Window,{
	target: null,
	action : null,
	printProvider: null,

	/** i18n * */	
	printText : 'Print',	
	closeText : "Close",
	sizeText:"Size",
	fontText: "Font",
	resolutionText:"Resolution",
	titleText: "Title",
	descriptionText: "Description",
	logoText: "Logo",
	northArrowText : "North Arrow",
	downloadImageText: "Download image",
	gridText:"Grid",
	browseText : "Browse",
	textText : "Text",
	legendText: "Legend",
	waitText: "Please wait...",
	errorText:"An error was found. Please try again later.",
	logoFileTypeUnsupportedText: "Supported image file types are PNG and JPEG",

	logoImgUri : "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABkAAD/4QMtaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6M0NFQ0U1Rjg0NUUyMTFFMkFGMURFMTVEMkU0NkQ5RDQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6M0NFQ0U1Rjk0NUUyMTFFMkFGMURFMTVEMkU0NkQ5RDQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxODc3NTFGRjQ1RTAxMUUyQUYxREUxNUQyRTQ2RDlENCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxODc3NTIwMDQ1RTAxMUUyQUYxREUxNUQyRTQ2RDlENCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/uAA5BZG9iZQBkwAAAAAH/2wCEAAEBAQEBAQEBAQEBAQEBAQEB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",

	labelWidth : 75,

	_previewMapPanel : null,
	_legendPanel : null,
	_form : null,
	_printButton:null,
	_graticuleControl : null,

	// Used to know if we have to create a PDF or a PNG image.
	_downloadImage : false,

	persistenceGeoContext : null,

	
	constructor : function(config) {

		Viewer.dialog.PDFPrintWindow.superclass.constructor
				.call(this, Ext.apply({
					title : this.printText,
					width : 500,
					height: 650,
					layout : {
						type:"vbox",
						align:"stretch",
						padding:"5px"
					},
					closeAction:"hide"
				}, config));

		this.on({
			beforerender : this.onBeforeRender,
			show: this.onShow,
			hide: function() {
				this.destroy()
				Viewer.unregisterComponent('PDFPrintWindow');
			},
			scope : this
		});
	},
	
	onShow : function() {
		// Here we reset the form.
		this._setFormValue("pageSize", "letter");
		this._setFormValue("resolution", 75);
		this._setFormValue("grid",false);
		this._setFormValue("legend",true);

		//this._setFormValue("logo", null);
		this._form.find("name","logo")[0].reset();

		this._setFormValue("title_font","helvetica");
		this._setFormValue("title_size", 25);
		this._setFormValue("title_text", "Escriba aquí el título");

		this._setFormValue("comment_font","helvetica");
		this._setFormValue("comment_size", 12);
		this._setFormValue("comment_text", "Escriba aquí una descripción");

		this._setFormValue("northArrow", "");

		if(!this._graticuleControl) {
			this._graticuleControl = new OpenLayers.Control.Graticule({
				labelled: true
			});
			this._previewMapPanel.map.addControl(this._graticuleControl);

		}

		var mapPanel = Viewer.getMapPanel();
		
		var previewMap = this._previewMapPanel.map;
		
		this._previewMapPanel.layers = new GeoExt.data.LayerStore({
			map: this._previewMapPanel,
			layers: layers
		})
		this._previewMapPanel.map.zoomToExtent(mapPanel.map.getExtent());

		this._graticuleControl.deactivate();		
	},

	onBeforeRender : function() {
		
		this._form = this.add({
			xtype: "form",
			bodyStyle: "padding: 5px",
			autoHeight: true,     
			monitorValid: true,
			labelWidth :this.labelWidth,   
        	defaults: {
            	anchor: '100%',
            	labelSeparator :""
        	},
			items: [
				this._firstFormRow(),
				this._secondFormRow(),
				this._thirdFormRow(),
				this._fourthFormRow(),
				this._fifthFormRow()
			],
			listeners : {
				scope : this,
				clientvalidation : function(form, valid) {
					this._printButton.setDisabled(!valid);
				}
			}
		});

	
		var mapContainer =this.add({
			xtype: "panel",
			layout: "hbox",
			layoutConfig : {
				pack: "center",				
				align: "middle"
			}
		});

		this._previewMapPanel = mapContainer.add(new GeoExt.PrintMapPanel({
			sourceMap : Viewer.getMapPanel().map,
			printProvider : this.printProvider,
			limitScales: true,
			width: 200,
			height: 200,
			items : [
        		{
        			xtype: "gx_zoomslider",
			        aggressive: true,
			        vertical: true,
			        height: 100,
			        x: 10,
			        y: 20
        		}
        	]
		}));

		this._downloadPNGButton = this.addButton(new Ext.Button({
			text: this.downloadImageText,
			listeners: {
				click: this._onDownloadImageClicked,
				scope: this
			}
		}))
		
		this._printButton = this.addButton(new Ext.Button({
			text : this.printText,
			listeners : {
				click : this._onPrintButtonClicked,
				scope : this
			}
		}));
		
		this.addButton(new Ext.Button({
			text : this.closeText,
			listeners : {
				click : this._onCancelButtonClicked,
				scope : this
			}
		}));

	},	

	_firstFormRow: function() {

		var avalaibleDpis = [];
        for(var idx =0; idx < this.printProvider.capabilities.dpis.length; idx++) {
            var dpi = this.printProvider.capabilities.dpis[idx];
            avalaibleDpis.push([dpi.value, dpi.value + " dpi"]);
        }

        var items = [
        	{
        		flex:0.9,
                labelWidth: this.labelWidth,
        		items: [
        			{
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
	    	},{
	    		flex:0.9,
                labelWidth: this.labelWidth,
	    		items:[{
	    			xtype: "combo",  
	    			name: "resolution",	        		
	        		fieldLabel : this.resolutionText,
		            typeAhead: true,
		            mode: "local",
		            forceSelection: true,
		            triggerAction: "all",
		            selectOnFocus: true,
		            store: avalaibleDpis,
		            width: 100
		         }]
    		},{
    			flex:0,
    			items: [{
					xtype: "checkbox",
					name: "grid",
					boxLabel: this.gridText,
					hideLabel:true,
					listeners: {
						scope: this,
						check : function(sender, checked) {
							if(checked) {
								this._graticuleControl.activate();
							} else {
								this._graticuleControl.deactivate();
							}
						}
					}
				}]
        	},{
        		flex:0,
        		items: [{
        			xtype: "checkbox",
        			name: "legend",
        			boxLabel: this.legendText,
        			hideLabel:true,
        			width: 70
        		}]
       		}
        ];

        return {
        	xtype: 'panel',           
            layout: 'hbox',
            align: "stretchmax",            
            defaults:{
                layout:'form',
                labelSeparator:"",	
                border:false,
                xtype:'panel',
                bodyStyle: "padding-right: 15px",
                flex:1,               
                defaults:{
                	anchor: "100%"
                }
            },
            items: items                
        };
    },	

    _secondFormRow : function () {
    	return {
    		xtype: "fileuploadfield",
    		name: "logo",
    		fieldLabel: this.logoText,
    		buttonText: this.browseText,
    		regex: /^.*\.(png|jpeg|jpg)$/i,
    		regexText: this.logoFileTypeUnsupportedText    
    	}
    },

    _thirdFormRow : function () {
    	return {
    		xtype: "fieldset",
    		title: this.titleText,
    		collapsible: false,
    		autoHeight :true,
    		labelWidth: this.labelWidth - 10,
    		defaults : {
    			anchor: "100%"
    		},
    		items:[
    			this._fontStyleRow("title"),    			
    			{
    				xtype: "textfield",
    				name: "title_text",
    				fieldLabel: this.textText,
    				value: "Título",
    				allowBlank : false,
    				selectOnFocus : true
    			}
    		]
    	}
    },

    _fourthFormRow : function () {
    	return {
    		xtype: "fieldset",
    		title: this.descriptionText,
    		collapsible: false,
    		autoHeight :true,
    		labelWidth: this.labelWidth - 10,
    		defaults : {
    			anchor: "100%"
    		},
    		items:[
    			this._fontStyleRow("comment"),    			
    			{
    				xtype: "textarea",
    				name:"comment_text",
    				fieldLabel: this.textText,
    				allowBlank : false,
    				selectOnFocus : true
    			}
    		]
    	}
    },

    _fifthFormRow : function () {
    	var items = [
        	{
        		flex:0.8,
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
		            	select : function(sender, comboItem) {
		            		if(comboItem.json.imageName) {
			            		Ext.get("pdfPrintWindow_arrowPreview").setStyle(
			            			"background-image", 
			            			"url('../theme/ux/img/compasses/"+comboItem.json.imageName+".png')");
		            		} else {
		            			// We clear the image preview when selectingt no arrow
		            			Ext.get("pdfPrintWindow_arrowPreview").setStyle("background-image","");
		            		}
		            	}
		            }
		        }]
	    	}, {
	    		height: 50,
	    		width: 50,
	    		id:"pdfPrintWindow_arrowPreview",
	    		style: "background-size: cover; background-repeat: no-repeat"
	    	}

        ];

        return {
        	xtype: 'panel',           
            layout: 'hbox',
            align: "stretchmax",            
            defaults:{
                layout:'form',
                labelSeparator:"",	
                border:false,
                xtype:'panel',
                bodyStyle: "padding-right: 15px",
                flex:1,               
                defaults:{
                	anchor: "100%"
                }
            },
            items: items                
        };
    },

    _getCompassesStore : function () {
    	// We store filenames and dataures because we have the urls for pneg files with transparency for use in the
    	// ui, and jpegs for use in the pdf.
    	var compassesData = [
    		{
    			label:"Ninguna",
    			imageName :null
    		},
    		{
    			label: "Flecha moderna 1",
    			imageName: "modern1"    			
    		},{
    			label: "Flecha moderna 2",
    			imageName: "modern2"
    		},{
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
		    fields: ["label","imageName"],
		    data : {
		    	compasses: compassesData
		    }
		});

		return store;
    },

    _fontStyleRow : function(namePrefix) {

    	 var fontSizes = [];
    	 var inc=1;
    	 for(var fontSize = 5; fontSize <60; fontSize+=inc) {
    	 	fontSizes.push([fontSize,fontSize+" pt"]);
    	 	if(fontSize>=20) {
    	 		inc = 5;
    	 	} else  if(fontSize>=40) {
    	 		inc = 10;
    	 	}
    	 }

    	 var items = [
        	{
        		flex:0,
                labelWidth: this.labelWidth-10,
        		items: [{
					xtype: "combo",	
					displayField: "name",
		            typeAhead: true,
		            fieldLabel: this.fontText,
		            mode: "local",
		            name: namePrefix+"_font",
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
		        }]
	    	},{
	    		flex:0,
                labelWidth: this.labelWidth-20,
	    		items:[{
	    			xtype: "combo",		
	    			name: namePrefix+"_size",	
	    			forceSelection : true,			
	    			fieldLabel: this.sizeText,		            
		            mode:"local",
		            typeAhead: true,
		            triggerAction: "all",
		            store : fontSizes,
		            value: 14,
		            width: 100,
		         }]
    		}       		
        ];

        return {
        	xtype: 'panel',           
            layout: 'hbox',
            align: "stretchmax",            
            defaults:{
                layout:'form',
                labelSeparator:"",	
                border:false,
                xtype:'panel',
                bodyStyle: "padding-right: 15px",
                flex:1,               
                defaults:{
                	anchor: "100%"
                }
            },
            items: items                
        };
    },

	_onCancelButtonClicked : function() {
		this.hide();
		
	},

	_onDownloadImageClicked : function() {
		Ext.MessageBox.wait(this.waitText);

		this._downloadImage=true;
		this._pdfImagesData = {		
			mapImg : false,
			customLogoImg : false
		};

		// This methods retrieve data the Ajax-y way. Will call the _doPDFCreation method
		// when are finished, but only the last to finish will actually do the pdf creation.

		this._retrieveCustomLogoDataUri();	
		this._retrieveMapDataUri();
	},
	
	_onPrintButtonClicked : function() {

		Ext.MessageBox.wait(this.waitText);

		this._downloadImage=false;

		this._pdfImagesData = {		
			mapImg : false,
			customLogoImg : false
		};

		// This methods retrieve data the Ajax-y way. Will call the _doPDFCreation method
		// when are finished, but only the last to finish will actually do the pdf creation.

		this._retrieveCustomLogoDataUri();	
		this._retrieveMapDataUri();	
	},	

	_retrieveMapDataUri : function() {
		// We use geoserver's mapfish based print service to generate a pdf (because we cant get directly an image
		// because the version being to low or because having tried hard enough...)
		this.printProvider.customParams.layout = "MAP";
		this.printProvider.customParams.dpi = this._getFormValue("resolution");
		this.printProvider.customParams.renderLegend = false;		
		var includeLegend = this._getFormValue("legend");

		var imageName = this._getFormValue("northArrow");
		if(imageName) {
			this.printProvider.customParams.imageName = imageName;
		}

		this._previewMapPanel.print(includeLegend && {legend: 
				new GeoExt.LegendPanel({
					layerStore: this._previewMapPanel.layers,
					filter: function(record) {
						// If has url attribute, then its an WMS layer.
						return !!record.data.layer.url;
					}
				})
			});
	},

	_mapPDFUrlRetrieved : function (mapPDFUrl) {
		// The print service has returned the url of the pdf file.
		// We use imageUriGen to convert it to a jpeg image.
		Ext.Ajax.request({
                url: 'http://localhost/ImageURIGen/urigen.php',
                method:"POST",              
                params:{
                    params:Ext.encode({
                       images:[{
                       		url: mapPDFUrl
                       }],
                        outputFormat: "jpeg"
                    }),                   
                },
                success: function(response) {
                	response = Ext.decode(response.responseText);
                    if(response.error || response.data[0].error) {
                    	console.debug(response.error);
                    	Ext.MessageBox.updateProgress(1);
                    	Ext.MessageBox.hide();
                    	Ext.MessageBox.alert("",this.errorText); 
                    	return;
                    }

                    // We have the custom logo data uri so we try creating the certificate.
                    var imageResult = response.data[0];
                    this._pdfImagesData.mapImg = imageResult;
                    this._doPDFCreation();          
                },
                failure : function(response) {
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert("",this.errorText); 
                },
                scope:this
            });

		this._doPDFCreation();
	},

	_retrieveCustomLogoDataUri : function () {
		if(!this._getFormValue("logo")){
			// The user dont want a logo.
			this._pdfImagesData.customLogoImg = null;
			this._doPDFCreation();          
			return;
		}

		Ext.Ajax.request({
                url: app.proxy+'http://localhost/ImageURIGen/urigen.php',
                method:"POST",  
                isUpload: true,
                form: this._form.form.el.dom,            
                params:{
                    params:Ext.encode({
                       images:[{
                       		fileFormField: "logo"
                       }],
                        outputFormat: "jpeg"
                    }),                   
                },
                success: function(response) {
                	// The data comes inside an xml document with a pre....
                	// must be because either the proxy or the Ext.Ajax.request using fileUpload...
                	//var json = .replace(/<.*>{/,"{").replace("</pre>","");
                    response = Ext.decode(response.responseText);
                    if(response.error || response.data[0].error) {
                    	console.debug(response.error);
                    	Ext.MessageBox.updateProgress(1);
                    	Ext.MessageBox.hide();
                    	Ext.MessageBox.alert("",this.errorText); 
                    	return;
                    }

                    // We have the custom logo data uri so we try creating the certificate.
                    var imageResult = response.data[0];
                    this._pdfImagesData.customLogoImg = imageResult;                    
                    this._doPDFCreation();          
                },
                failure : function(response) {
                    Ext.MessageBox.updateProgress(1);
                    Ext.MessageBox.hide();
                    Ext.MessageBox.alert("",this.errorText); 
                },
                scope:this
            });
	},


	// Does the pdf creation, only if all required data (retrieved using Ajax) is
	// avalaible.
	_doPDFCreation : function () {
		// Firstly we check the ajax requests have finished so we have
		// all required data.
		if( this._pdfImagesData.customLogoImg ===false
			|| this._pdfImagesData.mapImg===false) {
			// Some data is not avalaible so we do nothing.
			return;
		}

		var margin = 30;
		var pageSize = this._getFormValue("pageSize");
		var pdfDoc= new jsPDF("p","mm",pageSize);
		var fileName = "impresion modulo cartografico";

		try {
			this._createPDFContents(pdfDoc);	
		} catch(e) {
			console.debug(e);
			Ext.MessageBox.updateProgress(1);
			Ext.MessageBox.hide();
			Ext.MessageBox.alert("",this.errorText);
			return;
		}
		

		if(this._downloadImage){
			this._downloadPNGConversion(fileName+".png", pdfDoc.output("datauristring"));
		} else {

			jsPDFUtils.downloadPDF(fileName+".pdf", pdfDoc); 
			Ext.MessageBox.hide(); 
			
		}
		    
       
	},

	_downloadPNGConversion : function(fileName, pdfDataURI) {
		Ext.Ajax.request({
            url: app.proxy + 'http://localhost/ImageURIGen/urigen.php',
            method:"POST",                     
            params:{
                params:Ext.encode({
                	// We pass the data uri directly, just because we can.
                	images:[pdfDataURI],
                    outputFormat: "png"
                }),                   
            },
            success: function(response) {                	
                response = Ext.decode(response.responseText);
                if(response.error || response.data[0] && response.data[0].error) {
                	console.debug(response.error);
                	Ext.MessageBox.updateProgress(1);
                	Ext.MessageBox.hide();
                	Ext.MessageBox.alert("",this.errorText); 
                	return;
                }

                // We have the custom logo data uri so we try creating the certificate.
                var imageResult = response.data[0];
                this._downloadPNG(fileName, imageResult.uri) ;  
                Ext.MessageBox.hide(); 
            },
            failure : function(response) {
                Ext.MessageBox.updateProgress(1);
                Ext.MessageBox.hide();
                Ext.MessageBox.alert("",this.errorText); 
            },
            scope:this
        });
	},

	_downloadPNG: function(fileName, uristring){
     	// The document is converted.
		var options ={
			filename : fileName,
			data: uristring,
			contentType:"application/png"
		};     


        // Localhost will work because the request is done actually by the proxy.
        var form = $('<form method="POST" style="display:none" action="'+app.proxy+'http://localhost/downloadURI/downloadURI.php">'
                +'<input type="text" name="filename" value="'+options.filename
                +'"/><input type="hidden" name="data" value="'+options.data
                +'"/><input type="text" name="contentType" value="'+options.contentType
                +'"/><button type="submit"/>')[0];
        var body = $("body")[0];
        body.appendChild(form);
        form.submit();                              
    },
	

	_createPDFContents : function(pdfDoc) {
		var pageWidth = pdfDoc.internal.pageSize.width;
		var margin = 30;		
		var avalaibleWidth =  pageWidth - 2* margin;
		var spacing=5;		

		// This image was converted manually to avoid requests, we know this values are true.
		var logosHeight = 20;
		pdfDoc.addImage(this.logoImgUri, "JPEG", margin, margin, 22, logosHeight);		

		if(this._pdfImagesData.customLogoImg) {
			var cLogoImg = this._pdfImagesData.customLogoImg;
			// We have custom logo data so render it.

			// Firstly we have to calculate the dimensions...
			var cLogoWidth = logosHeight * cLogoImg.width / cLogoImg.height;

			// Then, we have to calculte the left position where the image will be renderer.
			var cLogoLeft = pageWidth- margin - cLogoWidth;

			// And finaly we render the image.
			pdfDoc.addImage(cLogoImg.uri, "JPEG", cLogoLeft, margin, cLogoWidth, logosHeight);	

		}


		pdfDoc.setFont(this._getFormValue("title_font"))
		pdfDoc.setFontSize(this._getFormValue("title_size"));

		// The height of the image plus the line height so the title is completely under
		// the images.
		var top = margin + logosHeight + jsPDFUtils.getLineHeight(pdfDoc);
		jsPDFUtils.renderCenteredText(pdfDoc, top, this._getFormValue("title_text"));	

		top+=spacing;
		jsPDFUtils.renderCenteredImage(pdfDoc, top, avalaibleWidth, this._pdfImagesData.mapImg);

		// We add just the height of the map (not map + legend, as they come in the same image
		// and wee need to draw over). Easy because the map is square :)
		top += avalaibleWidth;
	
		pdfDoc.setFont(this._getFormValue("comment_font"))
		pdfDoc.setFontSize(this._getFormValue("comment_size"));
		
		// A bit nearer to the map...
		top -= spacing;		
		pdfDoc.text(margin, top, "Descripción");

		// We need to recalculate line height because it depends on the font and its size.
		top+= spacing/2 + jsPDFUtils.getLineHeight(pdfDoc);

		top = jsPDFUtils.renderParagraph(pdfDoc, margin,top, this._getFormValue("comment_text"));

	},

	_getFormValue : function(fieldName) {
		return this._form.find("name", fieldName)[0].getValue();
	},

	_setFormValue : function(fieldName, newValue) {
		this._form.find("name", fieldName)[0].setValue(newValue);
	},

	_createURL : function(baseUrl, params) {
        var url = baseUrl+"?";
        var paramPieces = [];
        for(var key in params) {
            paramPieces.push(key+"="+params[key]);
        }           
        return url+paramPieces.join("&");
    }
});