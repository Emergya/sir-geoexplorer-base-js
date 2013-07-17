/*
 * AddLayers.js
 *
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
 * Authors:: Antonio José Rodríguez Ríos (mailto:ajrodriguez@emergya.com)
 * 
 */



// Definimos un tipo para reconocer los nombresconacentos
Ext.apply(Ext.form.VTypes, {
	/**
	 * 
	 * @param {String} value The name.
	 * @return {Boolean} true if the RegExp test passed, and false if not.
	 */
	'alphaNumAccents': function(v) {
		var alphaNumAccentsRegExp = /^[\.a-zA-Z_0-9\'\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00FC\u00DC]+$/;
		return alphaNumAccentsRegExp.test(v);
	},
	'alphaNumAccentsText': 'El nombre solo puede contener números, letras, _ y .',
	'alphaNumAccentsMask': /[\.a-zA-Z_0-9\'\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00FC\u00DC]/i

});
 

/** api: (define)
 *  module = Viewer.plugins
 *  class = XLSWizard
 *  base_link = `Ext.Window <http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Window>`
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 *  .. class:: XLSWizard(config)
 *
 *    Upload CSVfiles wizard.
 */
Viewer.plugins.XLSWizard = Ext.extend(Ext.Window, {
	/** api: ptype = vw_xlswizard */
    ptype: "vw_xlswizard",
    step: 0,

    /** i18n **/
    windowTitleText: "Create new layer from XLS",
    fileEmptyText: "Select an XLS file",
    layerNameEmptyText: "Type a name for the layer",
    projectionNameEmpty: "Coordinate Reference System ID",
    buttonNextText: "Next",
    layerNameLabelText: "Layer's name",
    fileLabelText: "XLS File",
    chooseFileText: "Explore...",
    uploadWaitMsgText: "Sending file. Please wait.",
    waitTitleMsgText: "File Upload",
    createLayerWaitMsgText: "XLS file processing. Please wait.",
    createLayerWaitMsgTitleText: "XLS processing",
    fieldNameEmptyText: 'Type a name for the field (letters, numbers and _)',
    projectionLabel: 'CRS ',
    coordinateXLabel: 'X coordinate',
    coordinateYLabel: 'Y coordinate',
    layerTypeId: null,
    layerResourceId: null,
    columnNames: null,
    projection: null,
    columnX: null,
    columnY: null,
    columsEmpty: '* Columns with empty header will not be imported.',
    descriptionTextXLS1: 'Enter the name for the new layer and select a XLS file with UTM coordinates to upload.',
    descriptionTextXLS2: 'Select the reference system and the columns in which are stored the coordinates X and Y in UTM format in the file.',
    columnNamesStore: new Ext.data.ArrayStore({
        fields: [
           {name: 'column', type: 'String'},
        ]
    }),
    
    initComponent: function() {
    	var me = this;
    	this.self = me;

    	var defaultOptions = {
    		title: this.windowTitleText,
    		width: 500,
    		height: 400,
    		boxMaxHeight: 400,
    		layout: 'card',
    		autoScroll: true,
    		activeItem: 0,
    		bodyStyle: 'padding:15px',
    		defaults: {
    			// applied to each contained panel
    			border: false
    		},
    		bbar: [
	    		
       			'->', // greedy spacer so that the buttons are aligned to each side
        		{
		            id: 'move-next',
		            text: this.buttonNextText,
		            handler: this.navHandler.createDelegate(this, [1])
        		}
    		],
    		items: [
    			{
    				xtype: 'form',
                    id: 'uploadXlsForm',
                    fileUpload: true,
                    frame: true,
                    autoHeight: true,
                    height: 200,
                    labelWidth: 100,
    				defaults: {
    					anchor: '90%',
                        allowBlank: false,
                        msgTarget: 'side'
    				},
                    items:[
						{
						    xtype: 'label',
						    cls: 'toolDescription',
						    text: this.descriptionTextXLS1
						},
                        {
                        	xtype: 'textfield',
                        	id: 'name',
                        	emptyText: this.layerNameEmptyText,
                        	name: 'name',
                        	fieldLabel: this.layerNameLabelText
                        },
                        {
                            xtype: 'fileuploadfield',
                            fieldClass: 'upload-form-field',
                            id: 'form-file-field',
                            emptyText: this.fileEmptyText,
                            name: 'file',
                            fieldLabel: this.fileLabelText,
                            buttonText: this.chooseFileText

                        }
                    ]
    			}, {
    				xtype: 'form',
                    id: 'selectColumnsXlsForm',
                    frame: true,
                    autoHeight: true,
                    height: 200,
                    labelWidth: 100,
    				defaults: {
    					anchor: '90%',
                        allowBlank: false,
                        msgTarget: 'side'
    				},
                    items:[
						{
						    xtype: 'label',
						    cls: 'toolDescription',
						    text: this.descriptionTextXLS2
						},
                        {
                        	//Codificación coordenadas
                        	xtype: 'combo',
                        	id: 'projection',
                            forceSelection: true,
                            emptyText: this.projectionNameEmpty,
                            getListParent: function() {
                                return this.el.up('.x-menu');
                            },
                            store: [
                                    "EPSG:32719",
                                    "EPSG:32718",
                                    "EPSG:4326"
                                ], 
                            mode: 'local',
                            triggerAction: 'all',
                            listeners: {
                                "select": function(combo) {
                                	this.projection =  combo.getValue();
                                },
                                scope: this
                            },
                            displayField: "column", 
                            valueField: "column", 
                            fieldLabel: this.projectionLabel
                        },
                        {
                        	//columna X
                        	xtype: 'combo',
                        	id: 'columnX',
                            forceSelection: true,
                            emptyText: this.projectionNameEmpty,
                            getListParent: function() {
                                return this.el.up('.x-menu');
                            },
                            store: this.columnNamesStore, 
                            mode: 'local',
                            triggerAction: 'all',
                            listeners: {
                                "select": function(combo) {
                                    this.columnX =  combo.getValue();
                                },
                                scope: this
                            },
                            displayField: "column", 
                            valueField: "column", 
                            fieldLabel: this.coordinateXLabel
                        },
                        {
                        	//Columna Y
                        	xtype: 'combo',
                        	id: 'columnY',
                            forceSelection: true,
                            emptyText: this.projectionNameEmpty,
                            getListParent: function() {
                                return this.el.up('.x-menu');
                            },
                            store: this.columnNamesStore, 
                            mode: 'local',
                            triggerAction: 'all',
                            listeners: {
                                "select": function(combo) {
                                	this.columnY =  combo.getValue();
                                },
                                scope: this
                            },
                            displayField: "column", 
                            valueField: "column", 
                            fieldLabel: this.coordinateYLabel
                        }, {
                            xtype: 'label',
                            cls: 'toolDescription',
                            text: this.columsEmpty
                        }
                    ]
    			},{
    				xtype: 'form',
    				autoHeight: true,
    				frame: true,
    				labelWidth: 100,    				
    				defaults: {
    					emptyText: this.fieldNameEmptyText,
    					anchor: '90%',
                        allowBlank: false,
                        msgTarget: 'side',
                        vtype: 'alphaNumAccents'
    				}
    			}
    		]
    	};

    	Ext.apply(me, defaultOptions);



    	Viewer.plugins.XLSWizard.superclass.initComponent.apply(me, arguments);
    },
    navHandler: function (direction) {
        var changePanel = false;
        

        switch(this.step) {
            case 0:
                if(direction > 0) {
                    changePanel = this.uploadFile();
                } else {
                    changePanel = true;
                }

                break;
            
            case 1:
                this.showColumnSelector();
            	
            	break;
            
            default:
                this.step = 0;
                this.layout.setActiveItem(0);
        }

        if (changePanel) {
            if (direction > 0) {
               this.step = this.step + 1;
            } else {
                this.step = this.step - 1;
            }

        }
    },
    /**
     *   Perfoms the upload. 
     */
    uploadFile: function() {
        var fp = Ext.ComponentMgr.get('uploadXlsForm');
        if (fp.getForm().isValid()) {
            fp.getForm().submit({
                url: '../../uploadXls/step1',
                waitMsg: this.uploadWaitMsgText,
                waitTitle: this.waitTitleMsgText,
                success: function(fp, o) {
                	var resp = Ext.util.JSON.decode(o.response.responseText);
                	
                	if(resp && resp.success && resp.data && resp.data.status === "error") {
                		Ext.Msg.alert('Error', resp.data.message);
                		return false;
                	} else if(!resp || !resp.success || !resp.data){
                		Ext.Msg.alert('Error', "Se ha producido un error creando la capa.");
                		return false;
                	}
                	
                	this.columnNames = resp.data.columnNames;
                	
                	this.columnNamesStore.loadData(this.columnNames);
                	Ext.ComponentMgr.get('columnX').bindStore(this.columnNamesStore);
                	Ext.ComponentMgr.get('columnY').bindStore(this.columnNamesStore);
                	// read response, populate Grid and show field name edit form.
                    this.layout.setActiveItem(1);
                    this.doLayout();
                    this.step = 1;
                }, 
                failure: function(form, action) {
                	Ext.Msg.alert('Error', "Se ha producido un error al enviar los datos al servidor");
                	return false;
                },
                
                scope: this
            });
        }
    }, 
    showColumnSelector: function() {
    	var fp = Ext.ComponentMgr.get('selectColumnsXlsForm');
    	if (fp.getForm().isValid()) {
            fp.getForm().submit({
            	scope: this,
                url: '../../uploadXls/step2',
                waitMsg: this.createLayerWaitMsgText,
                waitTitle: this.createLayerWaitMsgTitleText,
                success: function(fp, o) {
                    var resp = Ext.util.JSON.decode(o.response.responseText);
                    if (resp && resp.success && resp.data && resp.data.status==="success") {
                    	//Add layer to map and close window
                        var layerName = resp.data.layerName;
                        var layerTitle = resp.data.layerTitle;
                        var geoserverUrl = (resp.data.serverUrl) || (app.sources.local.url + "/wms");
                        var layer = new OpenLayers.Layer.WMS(layerTitle,
                        		geoserverUrl,
                        	{
                        		layers: layerName,
                        		transparent: true                         
                        	}, {
                        		opacity: 1,
                        		visibility: true                            					
                        	});
                        layer.metadata.layerResourceId = resp.data.layerResourceId;
                        layer.metadata.layerTypeId = resp.data.layerTypeId;;
                        layer.metadata.temporal = true;
                        Viewer.getMapPanel().map.addLayer(layer);
                        this.close();
                        Ext.Msg.alert('Capa creada', "La capa se ha creado de forma temporal");
                    } else if(resp && resp.success && resp.data && resp.data.status === "error") {
                    	Ext.Msg.alert('Error', resp.data.message);
                    } else {
                    	Ext.Msg.alert('Error', "Se ha producido un error creando la capa.");
                    }
                	
                }, 
                failure: function(form, action) {
                	Ext.Msg.alert('Error', "Se ha producido un error al enviar los datos al servidor");
                	return false;
                },
                
                scope: this
            });
        }
    },



});

Ext.preg(Viewer.plugins.XLSWizard.prototype.ptype, Viewer.plugins.XLSWizard);
